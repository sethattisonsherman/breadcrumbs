import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  Sprout,
  Orbit,
  Star,
  ArrowUpRight,
  ArrowRight,
  Plus,
  Sun,
  Leaf,
  BookOpen,
  Compass,
  Settings,
  ChevronRight,
  ChevronLeft,
  Check,
  X,
  Clock,
  Play,
  Pause,
  Volume2,
  PenLine,
  Guitar,
  Languages,
  Flower2,
  ArrowLeft,
  Sparkles,
  Mountain,
  Headphones,
  Eye,
  Hand,
  MessageCircle,
  Download,
  RotateCcw,
  Lock,
  NotebookPen,
  CheckCheck,
} from "lucide-react";
import { generatePlan } from "./planner";
import "./styles.css";
import {
  apiFetch,
  cancelCaptchaChallenge,
  completeCaptchaChallenge,
  planFetch,
} from "./api";
import {
  Universe,
  ConstellationGlyph,
  colorFor,
  shapeFor,
} from "./constellations";
const guideLabel = (source) =>
  source === "ai"
    ? "AI GUIDE"
    : source === "pause"
      ? "TAKE A BREAK"
      : "CURATED GUIDE";
let turnstileScriptPromise;
function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!turnstileScriptPromise) {
    turnstileScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(window.turnstile);
      script.onerror = () => reject(new Error("Could not load CAPTCHA."));
      document.head.appendChild(script);
    });
  }
  return turnstileScriptPromise;
}
function TurnstileWidget({ siteKey, onSuccess, onError, onExpire }) {
  const container = useRef(null);
  const callbacks = useRef({ onSuccess, onError, onExpire });
  callbacks.current = { onSuccess, onError, onExpire };
  useEffect(() => {
    let active = true;
    let widgetId;
    loadTurnstile()
      .then((turnstile) => {
        if (!active || !container.current) return;
        widgetId = turnstile.render(container.current, {
          sitekey: siteKey,
          theme: "dark",
          callback: (token) => callbacks.current.onSuccess(token),
          "error-callback": () => callbacks.current.onError(),
          "expired-callback": () => callbacks.current.onExpire(),
        });
      })
      .catch(() => callbacks.current.onError());
    return () => {
      active = false;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [siteKey]);
  return <div ref={container} />;
}
const Icon = ({ name, ...p }) => {
  const C =
    {
      guitar: Guitar,
      language: Languages,
      art: PenLine,
      skill: Sprout,
      academic: BookOpen,
    }[name] || Sprout;
  return <C {...p} />;
};
const samples = [
  {
    id: "demo-guitar",
    name: "Acoustic guitar",
    icon: "guitar",
    color: "peach",
    track: "hobby",
    preference: "doing",
    minutes: 5,
    level: "beginner",
    sessions: 4,
    confidence: 2,
    tag: "Finding your rhythm",
    goal: "Play a song around a campfire",
  },
  {
    id: "demo-spanish",
    name: "Web development",
    icon: "language",
    color: "lavender",
    track: "hobby",
    preference: "doing",
    minutes: 5,
    level: "beginner",
    sessions: 7,
    confidence: 4,
    tag: "A world of new words",
    goal: "Build a little corner of the internet",
  },
  {
    id: "demo-art",
    name: "Sketching",
    icon: "art",
    color: "sage",
    track: "hobby",
    preference: "watching",
    minutes: 5,
    level: "beginner",
    sessions: 2,
    confidence: 1,
    tag: "Seeing things a little differently",
    goal: "Fill a sketchbook with everyday moments",
  },
];
const fresh = {
  version: 1,
  skills: [],
  notes: [],
  profile: { preference: "doing", minutes: 5 },
  onboarded: false,
};
function readData() {
  try {
    const d = JSON.parse(localStorage.getItem("breadcrumbs-v1"));
    return d &&
      d.version === 1 &&
      Array.isArray(d.skills) &&
      Array.isArray(d.notes) &&
      d.profile
      ? d
      : fresh;
  } catch {
    return fresh;
  }
}
const prefs = [
  {
    id: "doing",
    icon: Hand,
    title: "Jump in & try",
    text: "I find my way by getting hands-on.",
  },
  {
    id: "watching",
    icon: Eye,
    title: "See it in action",
    text: "Show me what it looks like first.",
  },
  {
    id: "reading",
    icon: BookOpen,
    title: "Read & reflect",
    text: "Give me an idea I can sit with.",
  },
  {
    id: "talking",
    icon: MessageCircle,
    title: "Talk it through",
    text: "It clicks when I explain it aloud.",
  },
];
function App() {
  const [data, setDataRaw] = useState(readData);
  const [nav, setNav] = useState("universe");
  const [modal, setModal] = useState(null);
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [toast, setToast] = useState("");
  const [minutes, setMinutes] = useState(data.profile.minutes || 5);
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState(false);
  const [focusPlan, setFocusPlan] = useState(null);
  const [dbReady, setDbReady] = useState(false);
  const [sync, setSync] = useState("connecting");
  const setData = (next) => {
    setSync(dbReady ? "saving" : "local");
    setDataRaw(next);
  };
  const revision = useRef(0);
  const pending = useRef(null);
  const saving = useRef(false);
  const demo = !data.onboarded;
  const skills = demo ? samples : data.skills;
  const active = skills.find((s) => s.id === selected) || skills[0];
  useEffect(() => {
    const showCaptcha = () => setCaptchaRequired(true);
    window.addEventListener("constellations:captcha-required", showCaptcha);
    return () =>
      window.removeEventListener("constellations:captcha-required", showCaptcha);
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("breadcrumbs-v1", JSON.stringify(data));
    } catch {
      setToast(
        "Your browser storage is full. Export your progress in settings.",
      );
    }
  }, [data]);
  useEffect(() => {
    apiFetch("/api/user")
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((result) => {
        if (result.localOnly) {
          setSync("local");
          return;
        }
        revision.current = result.revision;
        if (result.state) {
          setData(result.state);
          setMinutes(result.state.profile.minutes);
        }
        setDbReady(true);
        setSync("saving");
      })
      .catch(() => {
        setSync("offline");
        setToast(
          "Database connection unavailable. Your progress is safe in this browser. We’ll retry when you reload.",
        );
      });
  }, []);
  useEffect(() => {
    if (!dbReady) return;
    pending.current = data;
    setSync("saving");
    const timer = setTimeout(async () => {
      if (saving.current) return;
      saving.current = true;
      try {
        while (pending.current) {
          const snapshot = pending.current;
          pending.current = null;
          const response = await apiFetch("/api/user", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              state: snapshot,
              revision: revision.current,
            }),
          });
          if (!response.ok) {
            const body = await response.json();
            throw Error(
              body.error ||
                "Your database save did not complete. Your browser copy is safe.",
            );
          }
          const result = await response.json();
          revision.current = result.revision;
        }
        setSync("saved");
      } catch (e) {
        setSync("offline");
        setToast(e.message);
      } finally {
        saving.current = false;
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [data, dbReady]);
  useEffect(() => {
    apiFetch("/api/status")
      .then((r) => r.json())
      .then((d) => setStatus(d.aiConfigured))
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 4500);
      return () => clearTimeout(t);
    }
  }, [toast]);
  const add = (s) => {
    setData((d) => ({
      ...d,
      onboarded: true,
      skills: [...d.skills, s],
      profile: { ...d.profile, preference: s.preference, minutes: s.minutes },
    }));
    setSelected(s.id);
    setMinutes(s.minutes);
    setModal(null);
    setNav("constellation");
    setToast(`A new spark for ${s.name}. Your adventure starts here.`);
  };
  const start = (s = active) => {
    if (demo) {
      setModal({ type: "adventure", initial: s?.name || "" });
      return;
    }
    if (s)
      setModal({
        type: "session",
        skill: {
          ...s,
          minutes,
          preparedPlan:
            s.id === active?.id && focusPlan?.key === planKey
              ? focusPlan.plan
              : null,
        },
      });
    else setModal({ type: "adventure" });
  };
  const complete = (skill, reflection, rating, plan) => {
    const now = new Date().toISOString();
    setData((d) => ({
      ...d,
      skills: d.skills.map((s) =>
        s.id === skill.id
          ? {
              ...s,
              sessions: s.sessions + 1,
              confidence: s.confidence + (rating === "comfortable" ? 1 : 0),
              lastPracticed: now,
              nextReview: new Date(
                Date.now() +
                  (rating === "stretch" ? 1 : rating === "just-right" ? 2 : 4) *
                    86400000,
              ).toISOString(),
              feedback: rating + " — " + reflection,
            }
          : s,
      ),
      notes: [
        {
          id: crypto.randomUUID(),
          skill: skill.name,
          text: reflection || "Showed up and took one small step.",
          rating,
          title: plan.title,
          date: now,
        },
        ...d.notes,
      ],
    }));
    setToast(
      "A little further than before. Your constellation is taking shape.",
    );
  };
  const total = data.skills.reduce((n, s) => n + s.sessions, 0);
  const surveyShown = useRef(false);
  useEffect(() => {
    if (
      (dbReady || sync === "offline" || sync === "local") &&
      demo &&
      !surveyShown.current
    ) {
      surveyShown.current = true;
      setModal({ type: "adventure" });
    }
  }, [dbReady, sync, demo]);
  const openSkill = (skill) => {
    setSelected(skill.id);
    setMinutes(skill.minutes);
    setNav("constellation");
  };
  const saveLabel =
    sync === "connecting"
      ? "Connecting your universe…"
      : sync === "saving"
        ? "Saving your universe…"
        : sync === "saved"
          ? "Your universe is saved"
          : sync === "local"
            ? "Saved in this browser"
            : "Browser copy saved · database offline";
  const planKey = active
    ? JSON.stringify([active.id, active.feedback, active.preference, minutes])
    : "";
  const focusLoading =
    nav === "constellation" && !demo && focusPlan?.key !== planKey;
  useEffect(() => {
    if (nav !== "constellation" || !active || demo) return;
    const controller = new AbortController();
    let live = true;
    planFetch("/api/plan", {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skill: active.name, ...active, minutes }),
    })
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((plan) => {
        if (live) setFocusPlan({ key: planKey, plan });
      })
      .catch(() => {
        if (live)
          setFocusPlan({
            key: planKey,
            plan: {
              ...generatePlan({ skill: active.name, ...active, minutes }),
              source: "curated",
              notice: "Your guide is offline. This practice is ready to use.",
            },
          });
      });
    return () => {
      live = false;
      controller.abort();
    };
  }, [nav, planKey, demo]);
  const nextPlan =
    active &&
    (focusPlan?.key === planKey
      ? focusPlan.plan
      : {
          ...generatePlan({ skill: active.name, ...active, minutes }),
          source: "curated",
        });
  return (
    <div className="app-shell">
      <div className="ambient-sky" aria-hidden="true" />
      <header className="topbar">
        <a
          href="#"
          className="brand"
          onClick={(e) => {
            e.preventDefault();
            setNav("universe");
          }}
        >
          <span className="brand-mark">
            <Orbit size={26} strokeWidth={1.2} />
          </span>
          constellations<span className="brand-dot">✦</span>
        </a>
        <nav className="main-nav" aria-label="Main navigation">
          <button
            className={nav !== "notes" ? "active" : ""}
            onClick={() => setNav("universe")}
          >
            <Orbit size={15} />
            Your universe
          </button>
          <button
            aria-label="Field notes"
            className={nav === "notes" ? "active" : ""}
            onClick={() => setNav("notes")}
          >
            <NotebookPen size={15} />
            Field notes
            {data.notes.length > 0 && <span>{data.notes.length}</span>}
          </button>
        </nav>
        <div className="topbar-right">
          <span className="no-rush">
            <span />A little space to be curious.
          </span>
          <button
            className="icon-button"
            aria-label="Your preferences"
            onClick={() => setModal({ type: "settings" })}
          >
            <Settings size={18} />
          </button>
          <button
            className="user-avatar"
            aria-label="About Constellations"
            onClick={() => setModal({ type: "about" })}
          >
            Y<span />
          </button>
        </div>
      </header>
      <main className={nav === "constellation" ? "focused-main" : ""}>
        {nav === "universe" && (
          <>
            <div className="page-heading">
              <div>
                <span className="eyebrow">
                  <span className="tiny-star">✦</span>
                  {demo
                    ? "A LITTLE PREVIEW OF WHAT’S POSSIBLE"
                    : "A SPACE THAT’S ENTIRELY YOURS"}
                </span>
                <h1>Your curiosity has a universe.</h1>
                <p>Follow a spark. Take a small step. See what lights up.</p>
              </div>
              <button
                className="button primary"
                onClick={() => setModal({ type: "adventure" })}
              >
                <Plus size={16} />
                {demo ? "Find my first constellation" : "Discover a skill"}
              </button>
            </div>
            <div className="universe-topline">
              <div>
                <span className="live-dot" />
                {demo
                  ? "EXAMPLE CONSTELLATIONS"
                  : `${skills.length} CONSTELLATION${skills.length === 1 ? "" : "S"}`}
                <span className="line-dot">·</span>
                <span>
                  {demo
                    ? "A FEW POSSIBLE DIRECTIONS"
                    : `${total} SMALL STEP${total === 1 ? "" : "S"} TAKEN`}
                </span>
              </div>
              <span>
                <Compass size={12} />
                No finish line. Just a direction.
              </span>
            </div>
            <Universe
              skills={skills}
              demo={demo}
              onSelect={openSkill}
              onAdd={() => setModal({ type: "adventure" })}
            />
            <div className="universe-bottomline">
              <div className="legend">
                <span>
                  <i className="explored" />
                  Explored
                </span>
                <span>
                  <i className="current" />
                  Your next star
                </span>
                <span>
                  <i />
                  Possibility
                </span>
              </div>
              <span className="sky-note">
                You don’t need to see the whole sky to find your next star.
              </span>
            </div>
            {demo && (
              <div className="preview-callout">
                <Sparkles size={16} />
                <p>
                  This is a little inspiration. Your own universe begins with
                  one skill.
                </p>
                <button onClick={() => setModal({ type: "adventure" })}>
                  Make it mine <ArrowRight size={14} />
                </button>
              </div>
            )}
          </>
        )}
        {nav === "constellation" && active && (
          <>
            <div className="constellation-breadcrumb">
              <button
                className="text-button"
                onClick={() => setNav("universe")}
              >
                <ArrowLeft size={15} />
                Back to your universe
              </button>
              <span>/</span>
              <span>{active.name}</span>
            </div>
            <div className="focus-heading">
              <div>
                <span className="eyebrow" style={{ color: colorFor(active) }}>
                  YOUR {shapeFor(active.name).toUpperCase()} CONSTELLATION
                </span>
                <h1>{active.name}</h1>
                <p>
                  {active.goal ||
                    "A little curiosity. A constellation of possibilities."}
                </p>
              </div>
              <span className="focus-count">
                <Sparkles size={15} />
                {active.sessions} little steps into your adventure
              </span>
            </div>
            <div className="constellation-layout">
              <section
                className="detail-sky"
                aria-label={`${active.name} skill constellation`}
              >
                <div className="detail-coordinates">
                  <span>ONE STAR AT A TIME</span>
                  <span>{demo ? "EXAMPLE PROGRESS" : "YOUR OWN PACE"}</span>
                </div>
                <div className="detail-orbit" />
                <ConstellationGlyph
                  skill={active}
                  interactive
                  loading={focusLoading}
                  onStart={() => start(active)}
                />
                <div className="constellation-caption">
                  <span className="tag">
                    <Star size={12} />
                    {active.sessions === 0
                      ? "A new beginning"
                      : active.confidence > 2
                        ? "Finding your orbit"
                        : "A spark taking shape"}
                  </span>
                  <p>
                    Each practice lights a star.
                    <br />
                    Every discovery makes a new connection.
                  </p>
                </div>
                <span className="constellation-axis x-axis" />
                <span className="constellation-axis y-axis" />
              </section>
              <aside className="next-step-panel">
                <div className="next-step-kicker">
                  <span className="pulse-dot" />
                  YOUR NEXT STAR
                  <span>
                    {demo
                      ? "PREVIEW"
                      : String(active.sessions + 1).padStart(2, "0")}
                  </span>
                </div>
                <h2>
                  {focusLoading
                    ? "Finding a comfortable next step…"
                    : nextPlan.title}
                </h2>
                <p>{nextPlan.description}</p>
                <label className="input-label">
                  How much space do you have?
                </label>
                <div className="time-picker">
                  {[2, 5, 10, 15].map((m) => (
                    <button
                      key={m}
                      className={minutes === m ? "selected" : ""}
                      onClick={() => setMinutes(m)}
                    >
                      {m} min
                    </button>
                  ))}
                </div>
                <div className="practice-method">
                  <Sparkles size={14} />
                  {nextPlan.method}
                  <span>·</span>
                  <Clock size={13} />
                  {nextPlan.estimated_seconds
                    ? "~" + Math.ceil(nextPlan.estimated_seconds / 60)
                    : minutes}{" "}
                  min
                </div>
                <button
                  className="button primary full-width"
                  disabled={focusLoading}
                  onClick={() => start(active)}
                >
                  {demo ? "Begin my own adventure" : "Take this little step"}
                  <ArrowUpRight size={17} />
                </button>
                <button
                  className="text-button defer-button"
                  onClick={() => {
                    setNav("universe");
                    setToast(
                      "Your stars aren’t going anywhere. Come back when you have a little space.",
                    );
                  }}
                >
                  Not today. That’s okay.
                  <ArrowRight size={13} />
                </button>
                <div className="panel-quiet">
                  <Star size={15} />
                  <p>
                    No streaks to keep.
                    <br />
                    Your progress stays with you.
                  </p>
                </div>
                {active.nextReview && (
                  <div className="review-note">
                    <RotateCcw size={13} />
                    {new Date(active.nextReview) <= new Date()
                      ? "A gentle review is ready whenever you are."
                      : `A gentle review on ${new Date(active.nextReview).toLocaleDateString(undefined, { month: "short", day: "numeric" })}.`}
                  </div>
                )}
              </aside>
            </div>
            <div className="constellation-footnote">
              <span>
                <Sparkles size={13} />
                {active.confidence} confident practices. No deadline for the
                next.
              </span>
              <button
                className="text-button"
                onClick={() => setModal({ type: "settings" })}
              >
                A different way to learn <Settings size={13} />
              </button>
            </div>
          </>
        )}
        {nav === "notes" && (
          <>
            <div className="page-heading">
              <div>
                <span className="eyebrow">
                  <NotebookPen size={13} />
                  LITTLE DISCOVERIES, LASTING CONNECTIONS
                </span>
                <h1>Notes from your explorations.</h1>
                <p>
                  A place for first attempts, unexpected connections, and small
                  wins.
                </p>
              </div>
              <span className="notes-count">
                {data.notes.length} little discoveries
              </span>
            </div>
            {!data.notes.length ? (
              <div className="empty-state">
                <div className="empty-orbit">
                  <NotebookPen size={32} strokeWidth={1} />
                  <Sparkles size={20} />
                </div>
                <h2>There’s a story in every star.</h2>
                <p>
                  After a little practice, leave a thought for your future self.
                  <br />
                  What surprised you? What would you try differently?
                </p>
                <button
                  className="button outlined"
                  onClick={() =>
                    demo ? setModal({ type: "adventure" }) : start()
                  }
                >
                  Take a little step <ArrowRight size={15} />
                </button>
              </div>
            ) : (
              <div className="notes-grid">
                {data.notes.map((n) => (
                  <article className="note-card" key={n.id}>
                    <div>
                      <span className="tag">
                        <Star size={10} />
                        {n.skill}
                      </span>
                      <time>
                        {new Date(n.date).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </time>
                    </div>
                    <h3>{n.title}</h3>
                    <p>{n.text}</p>
                    <span className="note-rating">
                      <Sparkles size={12} />
                      {n.rating === "comfortable"
                        ? "A little more confident"
                        : n.rating === "stretch"
                          ? "A useful stretch"
                          : "A step in your own direction"}
                    </span>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
        <footer>
          <button onClick={() => setModal({ type: "about" })}>
            <Orbit size={13} />
            Small steps. A sky full of possibility.
          </button>
          <span className="save-indicator" role="status">
            <span className={sync === "saved" ? "live-dot" : "offline-dot"} />
            {saveLabel}
          </span>
          <span>
            AT YOUR OWN PACE <span className="tiny-star">✦</span>
          </span>
        </footer>
      </main>
      {toast && (
        <div className="toast" role="status">
          <Sparkles size={17} />
          {toast}
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={15} />
          </button>
        </div>
      )}
      {modal && (
        <Modal close={() => setModal(null)} wide={modal.type === "adventure"}>
          {modal.type === "adventure" ? (
            <Adventure
              initial={modal.initial}
              profile={data.profile}
              onFinish={add}
            />
          ) : modal.type === "session" ? (
            <Session
              skill={modal.skill}
              onComplete={complete}
              onClose={() => setModal(null)}
              onDefer={() => {
                setModal(null);
                setToast(
                  "A pause is part of the journey. Your constellation will be right here.",
                );
              }}
            />
          ) : modal.type === "settings" ? (
            <Preferences
              data={data}
              status={status}
              sync={sync}
              onSave={(profile) => {
                setData((d) => ({
                  ...d,
                  profile,
                  skills: d.skills.map((s) => ({
                    ...s,
                    preference: profile.preference,
                    minutes: profile.minutes,
                  })),
                }));
                setMinutes(profile.minutes);
                setModal(null);
                setToast("A little more your own. Preferences saved.");
              }}
            />
          ) : (
            <div className="about-modal">
              <span className="modal-kicker">
                <Orbit size={17} />
                THE CONSTELLATIONS WAY
              </span>
              <h2>
                A whole universe.
                <br />
                One small step.
              </h2>
              <p>
                Follow something you’re curious about. Practice a tiny piece.
                Notice what changed. Come back when you can.
              </p>
              <p>
                Your skills become constellations. Each practice lights another
                star, and new branches trace the connections you’re making.
                Confidence adds a little more brightness.
              </p>
              <p>
                Academic paths use retrieval and explanation. Hands-on paths use
                small experiments and deliberate practice. Your preferences
                shape the approach; your reflections help guide the next task.
              </p>
              <p>
                There are no streaks to lose. Stars represent practice and
                self-reported confidence, not certified mastery.
              </p>
              <button className="button primary" onClick={() => setModal(null)}>
                That sounds like my kind of space <Sparkles size={16} />
              </button>
            </div>
          )}
        </Modal>
      )}
      {captchaRequired && (
        <Modal
          close={() => {
            setCaptchaRequired(false);
            cancelCaptchaChallenge();
          }}
        >
          <div className="about-modal captcha-modal">
            <span className="modal-kicker">
              <Lock size={17} />
              A QUICK SAFETY CHECK
            </span>
            <h2>One quick check</h2>
            <p>
              This helps keep automated sign-ups away so everyone can use the
              learning guide.
            </p>
            <TurnstileWidget
              siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
              onSuccess={(token) => {
                setCaptchaRequired(false);
                completeCaptchaChallenge(token);
              }}
              onError={() => {
                setCaptchaRequired(false);
                cancelCaptchaChallenge();
                setToast("The safety check could not load. Please try again.");
              }}
              onExpire={() => {
                setToast("The safety check expired. Please try it again.");
              }}
            />
            <button
              className="button outlined"
              onClick={() => {
                setCaptchaRequired(false);
                cancelCaptchaChallenge();
              }}
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
function Modal({ children, close, wide }) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    function key(e) {
      if (e.key === "Escape") close();
      if (e.key === "Tab") {
        const nodes = ref.current?.querySelectorAll(
          'button:not(:disabled),input,textarea,select,[tabindex="0"]',
        );
        if (!nodes?.length) return;
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        className={"modal " + (wide ? "wide" : "")}
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Your Constellations adventure"
      >
        <button
          className="close-modal"
          aria-label="Close dialog"
          onClick={close}
        >
          <X size={20} />
        </button>
        {children}
      </div>
    </div>
  );
}
function Adventure({ initial = "", profile, onFinish }) {
  const [step, setStep] = useState(0);
  const scene = [2, 0, 1, 3, 4, 5][step];
  const [skill, setSkill] = useState(initial);
  const [track, setTrack] = useState("hobby");
  const [preference, setPreference] = useState(profile.preference || "doing");
  const [minutes, setMinutes] = useState(profile.minutes || 5);
  const [level, setLevel] = useState("beginner");
  const [goal, setGoal] = useState("");
  const [busy, setBusy] = useState(false);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState("");
  const titles = [
    "A little curiosity is all it takes.",
    "Two paths. Both lead somewhere.",
    "How does your curiosity work?",
    "How much space feels good?",
    "Every adventure starts somewhere.",
    "Your first breadcrumb awaits.",
  ];
  async function grow() {
    setBusy(true);
    setError("");
    try {
      const r = await planFetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skill: skill.trim(),
          track,
          preference,
          minutes,
          level,
        }),
      });
      if (!r.ok) throw Error();
      const p = await r.json();
      setPlan(p);
      setStep(5);
    } catch {
      setError("We couldn’t reach your guide. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="adventure">
      <div className="adventure-top">
        <Sparkles size={21} />
        <span>YOUR UNIVERSE STARTS HERE</span>
        <span>{step + 1} / 6</span>
      </div>
      <div className="adventure-progress">
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} className={i <= step ? "done" : ""} />
        ))}
      </div>
      <span className="modal-kicker">
        {
          [
            "YOUR SPARK",
            "THE DIRECTION",
            "YOUR WAY",
            "YOUR PACE",
            "YOUR STARTING POINT",
            "THE FIRST STEP",
          ][scene]
        }
      </span>
      <h2>{titles[scene]}</h2>
      <p className="modal-description">
        {
          [
            "What’s something you’ve always wanted to learn? No need to have a plan.",
            "Is this more about making and doing, or understanding and remembering?",
            "Pick what sounds inviting today. This is a preference, not a fixed label.",
            "No daily commitment. Just a little time you might have when you visit.",
            "A little context helps us choose a comfortable first step.",
            "A gentle beginning, shaped around you. You can change direction any time.",
          ][scene]
        }
      </p>
      {scene === 0 && (
        <>
          <label className="input-label" htmlFor="skill">
            I’d love to learn…
          </label>
          <input
            id="skill"
            autoFocus
            maxLength={100}
            placeholder="e.g. guitar, astronomy, baking bread…"
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && skill.trim()) setStep(2);
            }}
          />
          <div className="suggestions">
            {[
              "Acoustic guitar",
              "Everyday Spanish",
              "Sketching",
              "Psychology",
            ].map((s) => (
              <button key={s} onClick={() => setSkill(s)}>
                {s}
                <Plus size={12} />
              </button>
            ))}
          </div>
        </>
      )}
      {scene === 1 && (
        <div className="option-grid">
          {[
            {
              id: "hobby",
              icon: Hand,
              title: "Make & explore",
              text: "A hands-on skill, a creative spark, something to try.",
            },
            {
              id: "academic",
              icon: BookOpen,
              title: "Learn & understand",
              text: "Ideas, languages, concepts, or a subject to make sense of.",
            },
          ].map((o) => (
            <Option
              key={o.id}
              {...o}
              selected={track === o.id}
              onClick={() => setTrack(o.id)}
            />
          ))}
        </div>
      )}
      {scene === 2 && (
        <div className="option-grid">
          {prefs.map((o) => (
            <Option
              key={o.id}
              {...o}
              selected={preference === o.id}
              onClick={() => setPreference(o.id)}
            />
          ))}
        </div>
      )}
      {scene === 3 && (
        <div className="time-options">
          {[2, 5, 10, 15].map((m, i) => (
            <button
              key={m}
              className={m === minutes ? "selected" : ""}
              onClick={() => setMinutes(m)}
            >
              <span>
                {m}
                <small> minutes</small>
              </span>
              <strong>
                {
                  [
                    "A tiny moment",
                    "A little breather",
                    "A curious pause",
                    "A little deeper",
                  ][i]
                }
              </strong>
              <span className="selection-circle">
                {m === minutes && <Check size={13} />}
              </span>
            </button>
          ))}
        </div>
      )}
      {scene === 4 && (
        <>
          <div className="level-options">
            {[
              {
                id: "beginner",
                text: "A fresh beginning",
                sub: "I’m finding my first star.",
              },
              {
                id: "some",
                text: "A little experience",
                sub: "I’ve explored a bit before.",
              },
              {
                id: "confident",
                text: "Ready to branch out",
                sub: "I want to refine what I know.",
              },
            ].map((o) => (
              <button
                key={o.id}
                className={level === o.id ? "selected" : ""}
                onClick={() => setLevel(o.id)}
              >
                <span>
                  <strong>{o.text}</strong>
                  <small>{o.sub}</small>
                </span>
                <span className="selection-circle">
                  {level === o.id && <Check size={13} />}
                </span>
              </button>
            ))}
          </div>
          <label className="input-label" htmlFor="goal">
            What would you love to do with this? <span>(optional)</span>
          </label>
          <input
            id="goal"
            maxLength={160}
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="A little dream to grow toward…"
          />
        </>
      )}
      {scene === 5 && plan && (
        <div className="first-plan">
          <span className="tag">
            {plan.source === "pause" ? (
              guideLabel(plan.source)
            ) : (
              <>
                <Clock size={13} />
                {minutes} MINUTES · {guideLabel(plan.source)}
              </>
            )}
          </span>
          <h3>{plan.title}</h3>
          <p>{plan.description}</p>
          <div>
            <Star size={15} />
            {plan.method}
          </div>
          <small>
            {plan.source === "pause"
              ? "Your new skill will be here when you are ready to practice."
              : "Your path will adapt as you practice and reflect."}
          </small>
        </div>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="adventure-actions">
        {step > 0 ? (
          <button
            className="text-button"
            disabled={busy}
            onClick={() => setStep(step - 1)}
          >
            <ArrowLeft size={15} />
            Go back
          </button>
        ) : (
          <span className="tiny-note">
            <Star size={13} />
            There’s no wrong answer.
          </span>
        )}
        <button
          className="button primary"
          disabled={(step === 1 && !skill.trim()) || busy}
          onClick={() =>
            step < 4
              ? setStep(step + 1)
              : step === 4
                ? grow()
                : onFinish({
                    id: crypto.randomUUID(),
                    name: skill.trim(),
                    goal: goal.trim(),
                    track,
                    preference,
                    minutes,
                    level,
                    sessions: 0,
                    confidence: 0,
                    color:
                      track === "academic"
                        ? "lavender"
                        : /guitar|cook|bak|bread/i.test(skill)
                          ? "peach"
                          : "sage",
                    icon: /guitar|ukulele/i.test(skill)
                      ? "guitar"
                      : /spanish|french|language|japanese/i.test(skill)
                        ? "language"
                        : /draw|sketch|paint/i.test(skill)
                          ? "art"
                          : track === "academic"
                            ? "academic"
                            : "skill",
                    plan,
                    tag: "A new little beginning",
                  })
          }
        >
          {busy
            ? "Finding your first step…"
            : step === 5
              ? "Light my first star"
              : step === 4
                ? "Find my first step"
                : "Follow this path"}
          {!busy && <ArrowRight size={16} />}
        </button>
      </div>
    </div>
  );
}
function Option({ icon: C, title, text, selected, onClick }) {
  return (
    <button
      className={"option " + (selected ? "selected" : "")}
      onClick={onClick}
    >
      <C size={25} strokeWidth={1.5} />
      <span className="selection-circle">
        {selected && <Check size={12} />}
      </span>
      <strong>{title}</strong>
      <p>{text}</p>
    </button>
  );
}
function Session({ skill, onComplete, onClose, onDefer }) {
  const [plan, setPlan] = useState(skill.preparedPlan || null);
  const [phase, setPhase] = useState("practice");
  const [checked, setChecked] = useState([]);
  const [output, setOutput] = useState("");
  const [reflection, setReflection] = useState("");
  const [rating, setRating] = useState("just-right");
  const [seconds, setSeconds] = useState(
    skill.preparedPlan?.estimated_seconds || skill.minutes * 60,
  );
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);
  useEffect(() => {
    if (skill.preparedPlan) return;
    let live = true;
    const controller = new AbortController();
    planFetch("/api/plan", {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skill: skill.name, ...skill }),
    })
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((p) => {
        if (live) {
          setPlan(p);
          if (p.estimated_seconds) setSeconds(p.estimated_seconds);
        }
      })
      .catch(() => {
        if (live) {
          setPlan({
            ...generatePlan({ skill: skill.name, ...skill }),
            source: "curated",
          });
          setError("Your guide is offline. This practice is ready to use.");
        }
      });
    return () => {
      live = false;
      controller.abort();
    };
  }, []);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(
      () =>
        setSeconds((s) => {
          if (s <= 1) {
            setRunning(false);
            return 0;
          }
          return s - 1;
        }),
      1000,
    );
    return () => clearInterval(t);
  }, [running]);
  return (
    <div className="session">
      <span className="modal-kicker">
        <Star size={16} />
        {skill.name.toUpperCase()}
      </span>
      <h2>
        {plan?.source === "pause"
          ? "A little time to rest."
          : phase === "practice"
          ? "One little step."
          : phase === "reflect"
            ? "What did you notice?"
            : "A little more connected."}
      </h2>
      {!plan ? (
        <div className="loading">
          <span className="loading-sprout">
            <Sparkles size={30} />
          </span>
          <p>Finding a comfortable place to begin…</p>
        </div>
      ) : plan.source === "pause" ? (
        <>
          <div className="session-title">
            <h3>{plan.title}</h3>
            <span className="tag">TAKE A BREAK</span>
          </div>
          <p>{plan.description}</p>
          <div className="reflection-note">
            <NotebookPen size={17} />
            {plan.method}
          </div>
          <button className="button primary full-width" onClick={onDefer}>
            Take a break <ArrowRight size={16} />
          </button>
        </>
      ) : phase === "practice" ? (
        <>
          <div className="session-title">
            <h3>{plan.title}</h3>
            <span className="tag">{guideLabel(plan.source)}</span>
          </div>
          <p>{plan.description}</p>
          {(error || plan.notice) && (
            <p className="subtle-notice">{error || plan.notice}</p>
          )}
          <div className="session-timer">
            <Clock size={16} />
            <span>
              {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
            </span>
            <small>
              {seconds === 0
                ? "A moment to pause. Finish when you’re ready."
                : "An optional timer. Take the time you need."}
            </small>
            <button
              className="round-button"
              onClick={() => setRunning(!running)}
              disabled={seconds === 0}
              aria-label={running ? "Pause timer" : "Start timer"}
            >
              {running ? <Pause size={15} /> : <Play size={15} />}
            </button>
          </div>
          <div className="practice-steps">
            {plan.steps.map((s, i) => (
              <button
                key={i}
                className={checked.includes(i) ? "checked" : ""}
                onClick={() =>
                  setChecked((c) =>
                    c.includes(i) ? c.filter((n) => n !== i) : [...c, i],
                  )
                }
              >
                <span>{checked.includes(i) ? <Check size={14} /> : i + 1}</span>
                <p>{s}</p>
              </button>
            ))}
          </div>
          <label className="input-label" htmlFor="practice-output">
            {skill.track === "academic"
              ? "Your explanation, from memory"
              : "Describe your attempt or what changed"}{" "}
            <span>(a few words is enough)</span>
          </label>
          <textarea
            id="practice-output"
            maxLength={2000}
            value={output}
            onChange={(e) => setOutput(e.target.value)}
            placeholder={
              skill.track === "academic"
                ? "Close your notes and explain one idea…"
                : "I tried… and noticed…"
            }
          />
          {plan.expected_answer && (
            <div className="retrieval-check">
              <button
                className="button outlined"
                disabled={!output.trim()}
                onClick={() => setShowAnswer(true)}
              >
                {showAnswer
                  ? "Answer check revealed"
                  : "Reveal the answer check"}
                <Eye size={14} />
              </button>
              {!output.trim() && (
                <small>Try your answer above first. A guess is welcome.</small>
              )}
              {showAnswer && <p role="status">{plan.expected_answer}</p>}
            </div>
          )}
          <button
            className="button primary full-width"
            disabled={checked.length < 3 || !output.trim()}
            onClick={() => {
              setRunning(false);
              setPhase("reflect");
            }}
          >
            I took this little step <Check size={16} />
          </button>
          <p className="tiny-center">
            Check off your steps and capture one observation to continue.
          </p>
          <button className="text-button session-defer" onClick={onDefer}>
            Leave this for another day <ArrowRight size={13} />
          </button>
        </>
      ) : phase === "reflect" ? (
        <>
          <p>A little reflection helps your next step feel right.</p>
          <label className="input-label">How did that feel?</label>
          <div className="rating-options">
            {[
              { id: "stretch", label: "A bit of a stretch", emoji: "☾" },
              { id: "just-right", label: "Just right", emoji: "✦" },
              { id: "comfortable", label: "Feeling confident", emoji: "✶" },
            ].map((r) => (
              <button
                key={r.id}
                className={rating === r.id ? "selected" : ""}
                onClick={() => setRating(r.id)}
              >
                <span>{r.emoji}</span>
                {r.label}
              </button>
            ))}
          </div>
          <label className="input-label" htmlFor="reflection">
            {plan.reflection}
          </label>
          <textarea
            id="reflection"
            maxLength={2000}
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="A small discovery, a question, a tweak for next time…"
          />
          <div className="reflection-note">
            <NotebookPen size={17} />
            This will be saved to your field notes and help guide your next
            practice.
          </div>
          <button
            className="button primary full-width"
            onClick={() => {
              onComplete(
                skill,
                [output, reflection].filter(Boolean).join("\n\n"),
                rating,
                plan,
              );
              setPhase("done");
            }}
          >
            Save this little win <Sparkles size={17} />
          </button>
          <button
            className="text-button back-practice"
            onClick={() => setPhase("practice")}
          >
            <ArrowLeft size={14} />
            Back to practice
          </button>
        </>
      ) : (
        <div className="session-done">
          <ConstellationGlyph
            skill={{
              ...skill,
              sessions: skill.sessions + 1,
              confidence: skill.confidence + (rating === "comfortable" ? 1 : 0),
            }}
            celebrate
          />
          <h3>You showed up. That counts.</h3>
          <p>
            {rating === "stretch"
              ? "Next time, we’ll make space for a smaller, gentler step."
              : rating === "comfortable"
                ? "One confident practice, one more connection in your sky."
                : "Your next step will build on what you noticed today."}
          </p>
          <button className="button primary" onClick={onClose}>
            Back to my constellation <ArrowRight size={16} />
          </button>
          <span>No streak to protect. Come back when you can.</span>
        </div>
      )}
    </div>
  );
}
function Preferences({ data, onSave, status, sync }) {
  const [preference, setPreference] = useState(data.profile.preference);
  const [minutes, setMinutes] = useState(data.profile.minutes);
  function download() {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "my-constellations.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className="preferences">
      <span className="modal-kicker">
        <Settings size={16} />
        YOUR PREFERENCES
      </span>
      <h2>A path that moves with you.</h2>
      <p>
        Change your pace or try a different way of learning. These choices apply
        to your skills.
      </p>
      <label className="input-label" htmlFor="preference">
        What feels inviting?
      </label>
      <select
        id="preference"
        value={preference}
        onChange={(e) => setPreference(e.target.value)}
      >
        {prefs.map((p) => (
          <option value={p.id} key={p.id}>
            {p.title}
          </option>
        ))}
      </select>
      <label className="input-label">A little time for learning</label>
      <div className="time-picker">
        {[2, 5, 10, 15].map((m) => (
          <button
            key={m}
            className={m === minutes ? "selected" : ""}
            onClick={() => setMinutes(m)}
          >
            {m} min
          </button>
        ))}
      </div>
      <button
        className="button primary full-width"
        onClick={() => onSave({ preference, minutes })}
      >
        Save my preferences <Check size={16} />
      </button>
      <div className="database-status">
        <span className={sync === "saved" ? "live-dot" : "offline-dot"} />
        <div>
          <strong>
            {sync === "saved"
              ? "Live database connected"
              : sync === "saving"
                ? "Saving to database…"
                : sync === "local"
                  ? "Saved on this device"
                  : "Database connection pending"}
          </strong>
          <p>
            {sync === "local"
              ? "Cloud sync is not connected. Export your progress to keep a backup."
              : "PostgreSQL · Private browser session · No account required"}
          </p>
        </div>
      </div>
      <div className="settings-section">
        <h3>Your progress belongs to you.</h3>
        <p>
          {sync === "local"
            ? "Skills and field notes are saved in this browser. Use the export below to keep a copy. Cloud sync is not connected."
            : "Skills and field notes are saved in the server’s PostgreSQL database, with a backup in this browser. Clearing cookies removes access to your private session; export a copy to keep it."}{" "}
          Practice details reach the AI provider only when the server has an API
          key configured.
        </p>
        <button className="button outlined" onClick={download}>
          <Download size={15} />
          Export my progress
        </button>
      </div>
      <div className="ai-status">
        <span className={status ? "live-dot" : "offline-dot"} />
        <div>
          <strong>
            {status ? "AI guide connected" : "Curated guide active"}
          </strong>
          <p>
            {status
              ? "Your practice adapts with an AI guide."
              : "Add the Supabase project URL and publishable key to the GitHub Pages build to activate AI practice."}
          </p>
        </div>
      </div>
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
