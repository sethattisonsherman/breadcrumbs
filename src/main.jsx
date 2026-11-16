import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  Sprout,
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
    name: "Everyday Spanish",
    icon: "language",
    color: "lavender",
    track: "academic",
    preference: "talking",
    minutes: 5,
    level: "beginner",
    sessions: 7,
    confidence: 4,
    tag: "A world of new words",
    goal: "Have a conversation with someone new",
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
const stages = [
  "Plant a seed",
  "Find your footing",
  "Build your rhythm",
  "Branch out",
  "Make it your own",
  "Keep growing",
];
function Plant({ variant = 0, small = false }) {
  return (
    <svg
      className={"plant " + (small ? "small" : "")}
      viewBox="0 0 180 145"
      fill="none"
      aria-hidden="true"
    >
      <ellipse
        cx="90"
        cy="134"
        rx="45"
        ry="6"
        fill="currentColor"
        opacity=".08"
      />
      <path
        d={
          variant === 1
            ? "M88 128C78 95 105 70 89 26"
            : "M90 129C94 103 76 83 90 47"
        }
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M88 100C66 102 47 88 48 69C68 68 86 79 88 100Z"
        fill="currentColor"
        opacity=".4"
      />
      <path
        d="M89 81C112 85 133 66 130 46C110 46 93 60 89 81Z"
        fill="currentColor"
        opacity=".65"
      />
      <path
        d="M87 59C67 58 58 42 62 27C81 29 92 42 87 59Z"
        fill="currentColor"
        opacity=".5"
      />
      {variant > 0 && (
        <>
          <path
            d="M91 43C110 42 119 27 115 13C96 15 86 28 91 43Z"
            fill="currentColor"
            opacity=".6"
          />
          <path
            d="M84 116C67 116 58 109 58 98C72 97 82 104 84 116Z"
            fill="currentColor"
            opacity=".5"
          />
        </>
      )}
      <path
        d="M73 131L108 131"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="137" cy="26" r="2" fill="currentColor" opacity=".3" />
      <path
        d="M37 47v8m-4-4h8"
        stroke="currentColor"
        opacity=".4"
        strokeLinecap="round"
      />
    </svg>
  );
}
function HeroArt() {
  return (
    <svg
      viewBox="0 0 480 260"
      className="hero-art"
      fill="none"
      aria-hidden="true"
    >
      <ellipse cx="266" cy="226" rx="157" ry="14" fill="#dfe4d8" />
      <path
        d="M130 223C131 184 195 207 197 173S264 159 266 124S315 98 319 63"
        stroke="#b8c5a9"
        strokeWidth="2"
        strokeDasharray="3 8"
        strokeLinecap="round"
      />
      <path
        d="M126 225C126 208 115 196 121 175"
        stroke="#68865c"
        strokeWidth="2"
      />
      <path
        d="M122 203C103 205 92 191 94 182C110 180 120 190 122 203Z"
        fill="#b9c8a1"
      />
      <path
        d="M122 191C137 192 150 180 148 170C133 168 123 178 122 191Z"
        fill="#8ca57a"
      />
      <path
        d="M269 218C275 180 257 155 270 119C280 90 266 70 282 34"
        stroke="#6c805c"
        strokeWidth="3"
      />
      <path
        d="M269 166C231 170 206 147 210 121C245 120 265 141 269 166Z"
        fill="#9bb78d"
      />
      <path
        d="M271 143C311 148 338 121 334 94C300 91 277 111 271 143Z"
        fill="#bfd0a1"
      />
      <path
        d="M274 108C243 110 225 88 231 66C257 68 275 84 274 108Z"
        fill="#b4c598"
      />
      <path
        d="M277 79C310 82 330 62 325 40C299 40 281 56 277 79Z"
        fill="#88a377"
      />
      <path
        d="M279 51C260 43 258 23 267 10C288 22 290 37 279 51Z"
        fill="#c8d4b0"
      />
      <path
        d="M253 221h36"
        stroke="#6c805c"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M356 225C354 206 367 194 363 177"
        stroke="#8d916d"
        strokeWidth="2"
      />
      <path
        d="M359 208C378 209 386 199 384 188C371 187 360 196 359 208Z"
        fill="#c1c9a2"
      />
      <path
        d="M360 196C345 197 336 185 338 176C352 176 359 185 360 196Z"
        fill="#a8b991"
      />
      <circle
        cx="198"
        cy="173"
        r="7"
        fill="#fcfaf5"
        stroke="#b9a185"
        strokeWidth="2"
      />
      <path d="M195 173l2 2 4-4" stroke="#9e8d70" strokeWidth="1.5" />
      <circle
        cx="266"
        cy="124"
        r="6"
        fill="#f9f7ef"
        stroke="#a3b58b"
        strokeWidth="2"
      />
      <circle cx="319" cy="63" r="5" fill="#e8bb8e" />
      <path
        d="M172 72v10m-5-5h10M370 126v8m-4-4h8"
        stroke="#c6ae85"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="201" cy="44" r="2" fill="#aebd99" />
      <circle cx="379" cy="57" r="2" fill="#c4af90" />
      <path d="M394 156c9-14 17-11 17-11s-1 10-17 11Z" fill="#d9d6b6" />
      <path d="M389 157c-11-7-10-15-10-15s10-1 10 15Z" fill="#b9c8a1" />
    </svg>
  );
}
function App() {
  const [data, setDataRaw] = useState(readData);
  const [nav, setNav] = useState("today");
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");
  const [minutes, setMinutes] = useState(data.profile.minutes || 5);
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState(false);
  const [dbReady, setDbReady] = useState(false);
  const [sync, setSync] = useState("connecting");
  const setData = (next) => {
    setSync("saving");
    setDataRaw(next);
  };
  const revision = useRef(0);
  const pending = useRef(null);
  const saving = useRef(false);
  const demo = !data.onboarded;
  const skills = demo ? samples : data.skills;
  const active = skills.find((s) => s.id === selected) || skills[0];
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
    fetch("/api/user")
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((result) => {
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
          const response = await fetch("/api/user", {
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
    fetch("/api/status")
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
    setNav("garden");
    setToast(`A little seed for ${s.name}. Your adventure starts here.`);
  };
  const start = (s = active) => {
    if (demo) {
      setModal({ type: "adventure", initial: s?.name || "" });
      return;
    }
    if (s) setModal({ type: "session", skill: { ...s, minutes } });
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
    setToast("A little further than before. Your garden is growing.");
  };
  const total = data.skills.reduce((n, s) => n + s.sessions, 0);
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          href="#"
          className="brand"
          onClick={(e) => {
            e.preventDefault();
            setNav("today");
          }}
        >
          <span className="brand-mark">
            <Sprout size={24} />
          </span>
          breadcrumbs<span className="brand-dot">.</span>
        </a>
        <div className="workspace-label">YOUR LITTLE CORNER</div>
        <nav>
          {[
            { id: "today", label: "Today", icon: Sun },
            { id: "garden", label: "My skill garden", icon: Sprout },
            { id: "notes", label: "Field notes", icon: NotebookPen },
          ].map((n) => (
            <button
              key={n.id}
              className={"nav-item " + (nav === n.id ? "active" : "")}
              onClick={() => {
                setNav(n.id);
                setSelected(null);
              }}
            >
              <n.icon size={19} />
              <span>{n.label}</span>
              {n.id === "garden" && (
                <span className="nav-count">{skills.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-skills">
          <div className="section-label">
            GROWING HERE{" "}
            <button
              aria-label="Add a skill"
              onClick={() => setModal({ type: "adventure" })}
            >
              <Plus size={15} />
            </button>
          </div>
          {skills.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setSelected(s.id);
                setNav("garden");
              }}
            >
              <span className={"skill-dot " + s.color} />
              {s.name}
            </button>
          ))}
        </div>
        <div className="sidebar-bottom">
          <div className="slow-note">
            <Sprout size={27} />
            <p>
              There’s no behind.
              <br />
              Only your own pace.
            </p>
            <span>A little is a lovely start.</span>
          </div>
          <button
            className="nav-item"
            onClick={() => setModal({ type: "settings" })}
          >
            <Settings size={18} />
            <span>Your preferences</span>
          </button>
          <div className="profile">
            <span className="avatar">{demo ? "Y" : "✳"}</span>
            <div>
              <strong>Your space</strong>
              <small>
                {demo ? "A new adventure awaits" : "Growing at your own pace"}
              </small>
            </div>
            <Leaf size={16} />
          </div>
        </div>
      </aside>
      <div className="page-wrap">
        <header className="topbar">
          <div>
            <span className="mobile-brand">
              <Sprout size={19} /> breadcrumbs
            </span>
            <span className="desktop-crumb">
              Your space <ChevronRight size={12} />{" "}
              <strong>
                {nav === "today"
                  ? "Today"
                  : nav === "garden"
                    ? "My skill garden"
                    : "Field notes"}
              </strong>
            </span>
          </div>
          <div className="topbar-right">
            <span className="quiet-pill">
              <span />
              Small steps. Real growth.
            </span>
            <button
              className="round-button"
              aria-label="Open preferences"
              onClick={() => setModal({ type: "settings" })}
            >
              Y
            </button>
          </div>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                <Sun size={15} />
                {nav === "today"
                  ? "A GOOD DAY TO BEGIN"
                  : nav === "garden"
                    ? "ROOM TO GROW"
                    : "NOTICING IS LEARNING"}
              </div>
              <h1>
                {nav === "today" ? (
                  <>
                    A little today.
                    <br />
                    <span>A little further tomorrow.</span>
                  </>
                ) : nav === "garden" ? (
                  "Your curiosity, taking root."
                ) : (
                  "Little notes. Lasting lessons."
                )}
              </h1>
              <p>
                {nav === "today"
                  ? "Big things begin with small, unhurried steps. Let’s find yours."
                  : nav === "garden"
                    ? "Every skill starts with a seed. Give it a little time and see what grows."
                    : "A place for discoveries, wobbly first attempts, and small wins."}
              </p>
            </div>
            {nav !== "notes" && (
              <button
                className="button outlined heading-add"
                onClick={() => setModal({ type: "adventure" })}
              >
                <Plus size={16} />
                Plant a new skill
              </button>
            )}
          </div>
          {nav === "today" && (
            <>
              <section className="welcome-card">
                <div className="welcome-copy">
                  <span className="tag">
                    <Sprout size={13} />
                    {demo
                      ? "YOUR NEXT CHAPTER STARTS HERE"
                      : "A LITTLE SPACE FOR YOU"}
                  </span>
                  <h2>
                    {demo ? (
                      <>
                        What have you always
                        <br />
                        wanted to learn?
                      </>
                    ) : (
                      <>
                        Your next small step
                        <br />
                        is waiting for you.
                      </>
                    )}
                  </h2>
                  <p>
                    {demo
                      ? "Follow your curiosity. We’ll turn it into a gentle path, made of little moments that fit your life."
                      : "No catching up. No falling behind. Just a few minutes with something that makes you curious."}
                  </p>
                  <button
                    className="button primary"
                    onClick={() =>
                      demo ? setModal({ type: "adventure" }) : start()
                    }
                  >
                    {demo ? "Find my path" : "Find my next step"}
                    <ArrowRight size={17} />
                  </button>
                  <span className="micro-copy">
                    {demo
                      ? "A few questions. A path that feels like you."
                      : "Come as you are. A little counts."}
                  </span>
                </div>
                <div className="hero-visual">
                  <HeroArt />
                  <span className="art-note">
                    good things take a little growing.
                  </span>
                  <span className="floating-leaf">
                    <Leaf size={15} />
                  </span>
                </div>
              </section>
              <div className="dashboard-grid">
                <div className="garden-section">
                  <div className="section-title">
                    <div>
                      <h2>
                        Your skill garden{" "}
                        <span className="count-badge">{skills.length}</span>
                      </h2>
                      <p>
                        {demo
                          ? "A glimpse of what you could grow."
                          : "A little attention goes a long way."}
                      </p>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => setNav("garden")}
                    >
                      View garden <ArrowUpRight size={15} />
                    </button>
                  </div>
                  <div className="skill-cards">
                    {skills.map((s) => (
                      <SkillCard
                        key={s.id}
                        s={s}
                        demo={demo}
                        onClick={() => {
                          setSelected(s.id);
                          setNav("garden");
                        }}
                      />
                    ))}
                  </div>
                  <div className="gentle-banner">
                    <span className="little-sun">
                      <Sun size={20} />
                    </span>
                    <div>
                      <strong>Your pace is the right pace.</strong>
                      <p>
                        Five minutes of curiosity is still five minutes of
                        growth.
                      </p>
                    </div>
                    <span className="banner-flower">
                      <Flower2 size={38} strokeWidth={1} />
                    </span>
                  </div>
                  <div className="how-section">
                    <div className="section-title">
                      <h2>A breadcrumb at a time</h2>
                      <span className="eyebrow">
                        LESS PRESSURE, MORE POSSIBILITY
                      </span>
                    </div>
                    <div className="how-grid">
                      {[
                        {
                          n: "01",
                          title: "Follow a little curiosity",
                          text: "A skill you’re drawn to. A path that’s yours.",
                        },
                        {
                          n: "02",
                          title: "Make a little space",
                          text: "Small, thoughtful tasks that fit your day.",
                        },
                        {
                          n: "03",
                          title: "Watch a little grow",
                          text: "See your efforts turn into something real.",
                        },
                      ].map((x) => (
                        <div key={x.n}>
                          <span>{x.n}</span>
                          <h3>{x.title}</h3>
                          <p>{x.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <aside className="today-panel">
                  <div className="today-top">
                    <span className="eyebrow">
                      <Sparkles size={13} /> A BREADCRUMB FOR TODAY
                    </span>
                    {demo && <span className="example-label">PREVIEW</span>}
                  </div>
                  <div className="time-picker" aria-label="Practice time">
                    {[2, 5, 10, 15].map((m) => (
                      <button
                        key={m}
                        onClick={() => setMinutes(m)}
                        className={m === minutes ? "selected" : ""}
                      >
                        {m} min
                      </button>
                    ))}
                  </div>
                  <span className="mini-label">
                    {active?.name || "YOUR NEXT ADVENTURE"}
                  </span>
                  <h3>
                    {active && /guitar/i.test(active.name)
                      ? "Two chords. A little rhythm."
                      : active
                        ? generatePlan({ skill: active.name, ...active }).title
                        : "A small step toward something new."}
                  </h3>
                  <p>
                    {active && /guitar/i.test(active.name)
                      ? "Get to know the switch between E minor and A minor. Slowly is exactly right."
                      : "Make a little room for curiosity with one simple, focused practice."}
                  </p>
                  <div className="task-meta">
                    <Clock size={14} />
                    {minutes} gentle minutes<span>·</span>
                    {active?.track === "academic"
                      ? "Active recall"
                      : "Hands-on practice"}
                  </div>
                  <button className="button dark" onClick={() => start()}>
                    {demo ? "Make this path mine" : "Take this little step"}
                    <ArrowRight size={16} />
                  </button>
                  <div className="task-footer">
                    <Leaf size={13} />
                    Enough for today. Really.
                  </div>
                  <div className="panel-divider" />
                  <div className="quote-mark">“</div>
                  <blockquote>
                    You don’t have to see the whole path to take the first step.
                  </blockquote>
                  <div className="quote-decoration">
                    ✧ <span>ONE BREADCRUMB AT A TIME</span> ✧
                  </div>
                </aside>
              </div>
            </>
          )}
          {nav === "garden" && (
            <>
              <div className="garden-toolbar">
                <span>
                  {demo
                    ? "EXAMPLE GARDEN · START A PATH TO MAKE IT YOURS"
                    : `${skills.length} SKILL${skills.length === 1 ? "" : "S"} TAKING ROOT · ${total} SMALL STEPS TAKEN`}
                </span>
                <div>
                  <Leaf size={14} /> No deadlines here
                </div>
              </div>
              <div className="garden-view-grid">
                <div>
                  <div className="skill-cards full">
                    {skills.map((s) => (
                      <SkillCard
                        key={s.id}
                        s={s}
                        demo={demo}
                        onClick={() => setSelected(s.id)}
                        selected={active?.id === s.id}
                      />
                    ))}
                  </div>
                  {!skills.length && (
                    <div className="empty-state">
                      <Plant />
                      <h2>A little possibility lives here.</h2>
                      <p>
                        Plant your first skill and we’ll find a place to begin.
                      </p>
                      <button
                        className="button primary"
                        onClick={() => setModal({ type: "adventure" })}
                      >
                        Find my path <ArrowRight size={16} />
                      </button>
                    </div>
                  )}
                  {active && (
                    <section className="tree-panel">
                      <div className="section-title">
                        <div>
                          <span className="eyebrow">
                            THE PATH OF {active.name.toUpperCase()}
                          </span>
                          <h2>From a little seed to something more.</h2>
                        </div>
                        <span className="tag">
                          {demo
                            ? "Example progress"
                            : `${active.sessions} steps taken`}
                        </span>
                      </div>
                      <div className="tree-road">
                        {stages.map((st, i) => {
                          const reached =
                            i <= Math.floor(active.confidence / 3);
                          return (
                            <div
                              className={
                                "tree-stage " + (reached ? "reached" : "")
                              }
                              key={st}
                            >
                              <span
                                className={
                                  "tree-node " +
                                  (i === Math.floor(active.confidence / 3)
                                    ? "current"
                                    : "")
                                }
                              >
                                {reached ? (
                                  i === 0 ? (
                                    <Sprout size={22} />
                                  ) : (
                                    <Check size={21} />
                                  )
                                ) : (
                                  <Leaf size={19} />
                                )}
                              </span>
                              <strong>{st}</strong>
                              <small>
                                {i === 0
                                  ? "A place to begin"
                                  : `${i * 3} confident practices`}
                              </small>
                            </div>
                          );
                        })}
                      </div>
                      <p className="tree-explainer">
                        <Sprout size={15} />
                        Your tree grows with confident practice. Revisiting a
                        tricky step is growth, too.
                      </p>
                    </section>
                  )}
                </div>
                {active && (
                  <aside className="detail-panel">
                    <span className={"detail-icon " + active.color}>
                      <Icon name={active.icon} size={26} />
                    </span>
                    <span className="eyebrow">YOUR LITTLE WHY</span>
                    <h2>
                      {active.goal || `Make a little room for ${active.name}.`}
                    </h2>
                    <p>
                      {demo
                        ? "This is an example path. Start your own to shape it around your life."
                        : `A ${active.minutes}-minute path, with ${prefs.find((p) => p.id === active.preference)?.title.toLowerCase()} activities to get you started.`}
                    </p>
                    {active.nextReview && (
                      <div className="review-note">
                        <Clock size={15} />
                        {new Date(active.nextReview) <= new Date()
                          ? "A good time to revisit your last step."
                          : `A gentle review on ${new Date(active.nextReview).toLocaleDateString(undefined, { month: "short", day: "numeric" })}.`}
                      </div>
                    )}
                    <button
                      className="button primary"
                      onClick={() => start(active)}
                    >
                      {demo ? "Start my own path" : "Take a little step"}
                      <ArrowRight size={16} />
                    </button>
                    <button
                      className="text-button adjust"
                      onClick={() => setModal({ type: "settings" })}
                    >
                      Adjust your pace <Settings size={14} />
                    </button>
                  </aside>
                )}
              </div>
            </>
          )}
          {nav === "notes" && (
            <>
              <div className="notes-intro">
                <NotebookPen size={24} />
                <p>
                  Your reflections become clues for what comes next.
                  <br />
                  <strong>No perfect words needed.</strong>
                </p>
                <span>{data.notes.length} little discoveries</span>
              </div>
              {!data.notes.length ? (
                <div className="empty-state notes-empty">
                  <div className="note-illustration">
                    <PenLine size={40} strokeWidth={1} />
                    <Leaf size={22} />
                  </div>
                  <h2>Something to look back on.</h2>
                  <p>
                    After a little practice, leave yourself a note.
                    <br />
                    What surprised you? What would you try differently?
                  </p>
                  <button className="button primary" onClick={() => start()}>
                    Take my first step <ArrowRight size={16} />
                  </button>
                </div>
              ) : (
                <div className="notes-grid">
                  {data.notes.map((n) => (
                    <article className="note-card" key={n.id}>
                      <div>
                        <span className="tag">{n.skill}</span>
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
                        <Leaf size={13} />
                        {n.rating === "comfortable"
                          ? "Feeling more confident"
                          : n.rating === "stretch"
                            ? "A useful stretch"
                            : "A step in the right direction"}
                      </span>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
          <footer>
            <span>
              <Sprout size={14} /> Made for the beautifully unfinished.
            </span>
            <span>
              {sync === "connecting"
                ? "Connecting your garden…"
                : sync === "saving"
                  ? "Saving your garden…"
                  : sync === "saved"
                    ? "Garden saved to your database"
                    : "Saved in this browser · database offline"}{" "}
              <span className="footer-dot">·</span>{" "}
              <button onClick={() => setModal({ type: "about" })}>
                The Breadcrumbs way <ArrowUpRight size={12} />
              </button>
            </span>
          </footer>
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
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
                setToast("A path that moves with you. Preferences saved.");
              }}
            />
          ) : (
            <div className="about-modal">
              <span className="modal-kicker">
                <Sprout size={18} /> THE BREADCRUMBS WAY
              </span>
              <h2>
                Small steps.
                <br />
                Room to be human.
              </h2>
              <p>
                Choose something you’re curious about. Practice a tiny piece.
                Notice what changed. Come back when you can.
              </p>
              <p>
                Academic paths use retrieval and explanation. Hands-on paths use
                small experiments and deliberate practice. Your preferences
                shape how tasks are presented; reflection and confidence help
                shape the next step.
              </p>
              <p>
                There are no streaks to lose. A tree shows your practice
                milestones, not a claim that you have mastered a skill.
              </p>
              <button className="button primary" onClick={() => setModal(null)}>
                That feels like my pace <Leaf size={16} />
              </button>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
function SkillCard({ s, demo, onClick, selected }) {
  const progress = Math.min(100, Math.round((s.confidence / 15) * 100));
  return (
    <button
      className={"skill-card " + s.color + (selected ? " is-selected" : "")}
      onClick={onClick}
    >
      <div className="card-top">
        <span className="card-icon">
          <Icon name={s.icon} size={19} />
        </span>
        <span>
          {demo
            ? "EXAMPLE SKILL"
            : s.track === "academic"
              ? "LEARN & UNDERSTAND"
              : "MAKE & EXPLORE"}
          <ArrowUpRight size={13} />
        </span>
      </div>
      <div className="plant-wrap">
        <Plant variant={s.confidence > 2 ? 1 : 0} />
        <span className="plant-stage">
          {s.confidence >= 3 ? "Taking root" : "Just sprouting"}
        </span>
      </div>
      <h3>{s.name}</h3>
      <p>{s.tag || "A little curiosity, a little possibility"}</p>
      <div className="progress-track">
        <span style={{ width: `${progress}%` }} />
      </div>
      <div className="card-foot">
        <span>{s.sessions} little steps</span>
        <span>{progress}% grown</span>
      </div>
    </button>
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
        aria-label="Your Breadcrumbs adventure"
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
    "How do you like to find your way?",
    "How much space feels good?",
    "Every adventure starts somewhere.",
    "Your first breadcrumb awaits.",
  ];
  async function grow() {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/plan", {
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
        <Sprout size={21} />
        <span>YOUR OWN LITTLE ADVENTURE</span>
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
            "THE SEED",
            "THE DIRECTION",
            "YOUR WAY",
            "YOUR PACE",
            "YOUR STARTING POINT",
            "THE FIRST STEP",
          ][step]
        }
      </span>
      <h2>{titles[step]}</h2>
      <p className="modal-description">
        {
          [
            "What’s something you’ve always wanted to learn? No need to have a plan.",
            "Is this more about making and doing, or understanding and remembering?",
            "Pick what sounds inviting today. This is a preference, not a fixed label.",
            "No daily commitment. Just a little time you might have when you visit.",
            "A little context helps us choose a comfortable first step.",
            "A gentle beginning, shaped around you. You can change direction any time.",
          ][step]
        }
      </p>
      {step === 0 && (
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
              if (e.key === "Enter" && skill.trim()) setStep(1);
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
      {step === 1 && (
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
      {step === 2 && (
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
      {step === 3 && (
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
      {step === 4 && (
        <>
          <div className="level-options">
            {[
              {
                id: "beginner",
                text: "A fresh beginning",
                sub: "I’m starting from the seed.",
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
      {step === 5 && plan && (
        <div className="first-plan">
          <span className="tag">
            <Clock size={13} />
            {minutes} MINUTES ·{" "}
            {plan.source === "ai" ? "AI GUIDE" : "CURATED GUIDE"}
          </span>
          <h3>{plan.title}</h3>
          <p>{plan.description}</p>
          <div>
            <Leaf size={15} />
            {plan.method}
          </div>
          <small>Your path will adapt as you practice and reflect.</small>
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
            <Leaf size={13} />
            There’s no wrong answer.
          </span>
        )}
        <button
          className="button primary"
          disabled={!skill.trim() || busy}
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
              ? "Plant my skill"
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
function Session({ skill, onComplete, onClose }) {
  const [plan, setPlan] = useState(null);
  const [phase, setPhase] = useState("practice");
  const [checked, setChecked] = useState([]);
  const [output, setOutput] = useState("");
  const [reflection, setReflection] = useState("");
  const [rating, setRating] = useState("just-right");
  const [seconds, setSeconds] = useState(skill.minutes * 60);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let live = true;
    const controller = new AbortController();
    fetch("/api/plan", {
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
        if (live) setPlan(p);
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
        <Leaf size={16} />
        {skill.name.toUpperCase()}
      </span>
      <h2>
        {phase === "practice"
          ? "One little step."
          : phase === "reflect"
            ? "What did you notice?"
            : "A little more rooted."}
      </h2>
      {!plan ? (
        <div className="loading">
          <span className="loading-sprout">
            <Sprout size={30} />
          </span>
          <p>Finding a comfortable place to begin…</p>
        </div>
      ) : phase === "practice" ? (
        <>
          <div className="session-title">
            <h3>{plan.title}</h3>
            <span className="tag">
              {plan.source === "ai" ? "AI GUIDE" : "CURATED GUIDE"}
            </span>
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
        </>
      ) : phase === "reflect" ? (
        <>
          <p>A little reflection helps your next step feel right.</p>
          <label className="input-label">How did that feel?</label>
          <div className="rating-options">
            {[
              { id: "stretch", label: "A bit of a stretch", emoji: "🌱" },
              { id: "just-right", label: "Just right", emoji: "🌿" },
              { id: "comfortable", label: "Feeling confident", emoji: "🌳" },
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
            Save this little win <Sprout size={17} />
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
          <Plant variant={rating === "comfortable" ? 1 : 0} />
          <h3>You showed up. That counts.</h3>
          <p>
            {rating === "stretch"
              ? "Next time, we’ll make space for a smaller, gentler step."
              : rating === "comfortable"
                ? "One confident practice, one little root a bit deeper."
                : "Your next step will build on what you noticed today."}
          </p>
          <button className="button primary" onClick={onClose}>
            Back to my garden <ArrowRight size={16} />
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
    a.download = "my-breadcrumbs.json";
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
                : "Database connection pending"}
          </strong>
          <p>PostgreSQL · Private browser session · No account required</p>
        </div>
      </div>
      <div className="settings-section">
        <h3>Your progress belongs to you.</h3>
        <p>
          Skills and field notes are saved in the server’s PostgreSQL database,
          with a backup in this browser. Your private browser session keeps your
          garden separate. Clearing cookies removes your access; export a copy
          to keep it. Practice details reach the AI provider only when an API
          key is configured.
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
              : "AI API integration is ready; a server API key is needed to activate it."}
          </p>
        </div>
      </div>
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
