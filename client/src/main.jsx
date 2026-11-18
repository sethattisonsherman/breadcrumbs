import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { ArrowLeft, ArrowRight, ArrowUp, Settings, X } from "lucide-react";
import {
  apiFetch,
  planFetch,
  completeCaptchaChallenge,
  cancelCaptchaChallenge,
} from "./api";
import {
  METHODS,
  SURVEY_QUESTIONS,
  rankPreferences,
  normalizeRanking,
  buildFramework,
} from "../../shared/learning.js";
import {
  migrateState,
  STORAGE_KEY,
  subjectKey,
  finishLesson,
  starPosition,
} from "./journey.js";
import "./styles.css";

function readState() {
  try {
    return migrateState(JSON.parse(localStorage.getItem(STORAGE_KEY)));
  } catch {
    return migrateState(null);
  }
}
const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const methodLabel = (id) =>
  METHODS.find((method) => method.id === id)?.label || id;
const phaseLabels = [
  "Find a starting point",
  "Try it for yourself",
  "Bring it back",
];
const stars = Array.from({ length: 150 }, (_, i) => ({
  x: (i * 137.508 + 17) % 100,
  y: (i * 71.137 + 9) % 100,
  size: i % 17 === 0 ? 2 : i % 4 === 0 ? 1.5 : 1,
  opacity: 0.15 + (i % 7) * 0.085,
}));
function Starfield() {
  return (
    <div className="starfield" aria-hidden="true">
      {stars.map((s, i) => (
        <i
          key={i}
          style={{
            left: s.x + "%",
            top: s.y + "%",
            width: s.size,
            height: s.size,
            opacity: s.opacity,
          }}
        />
      ))}
    </div>
  );
}
function Constellation({
  skill,
  onSelect,
  expanded = false,
  notes = [],
  onStar,
}) {
  const count = Math.max(0, skill.sessions || 0);
  const points = Array.from({ length: count }, (_, i) => starPosition(i));
  const xs = points.map((p) => p[0]),
    ys = points.map((p) => p[1]);
  const x = Math.min(0, ...xs) - 15,
    y = Math.min(0, ...ys) - 15;
  const drawing = (
    <svg
      className="constellation-drawing"
      viewBox={[
        x,
        y,
        Math.max(200, ...xs) - x + 15,
        Math.max(144, ...ys) - y + 15,
      ].join(" ")}
      aria-hidden={!expanded}
      aria-label={expanded ? "Completed lesson stars" : undefined}
    >
      {points.slice(1).map((p, i) => (
        <line
          key={"l" + i}
          x1={points[i][0]}
          y1={points[i][1]}
          x2={p[0]}
          y2={p[1]}
        />
      ))}
      {points.map((p, i) =>
        expanded && notes[i] ? (
          <g
            key={i}
            role="button"
            tabIndex={0}
            className="lesson-star"
            aria-label={"Revisit lesson: " + notes[i].title}
            onClick={() => onStar(notes[i])}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onStar(notes[i]);
              }
            }}
          >
            <circle className="star-target" cx={p[0]} cy={p[1]} r={14} />
            <circle cx={p[0]} cy={p[1]} r={2.8} />
          </g>
        ) : (
          <circle key={i} cx={p[0]} cy={p[1]} r={expanded ? 2.8 : 2.2} />
        ),
      )}
    </svg>
  );
  if (expanded)
    return (
      <div className="subject-stars">
        {drawing}
        <ol
          className="lesson-history"
          aria-label={"Completed lessons in " + skill.name}
        >
          {notes.map((note) => (
            <li key={note.id}>
              <button className="history-entry" onClick={() => onStar(note)}>
                <span className="tiny-star" aria-hidden="true" />
                <span>
                  {note.title || "Completed lesson"}
                  <small>
                    {new Date(note.date).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </small>
                </span>
                <ArrowRight size={16} />
              </button>
            </li>
          ))}
        </ol>
        {count > notes.length && (
          <p className="quiet">
            {count - notes.length} earlier lessons saved in this constellation.
          </p>
        )}
      </div>
    );
  return (
    <button
      className="constellation"
      onClick={onSelect}
      aria-label={
        "Explore " +
        skill.name +
        " constellation, " +
        count +
        (count === 1 ? " completed lesson" : " completed lessons")
      }
    >
      {drawing}
      <span className="constellation-name">{skill.name}</span>
    </button>
  );
}

function App() {
  const [data, setData] = useState(readState),
    [ready, setReady] = useState(false),
    [sync, setSync] = useState("local");
  const [scene, setScene] = useState("home"),
    [leaving, setLeaving] = useState(false),
    [query, setQuery] = useState("");
  const [surveyIndex, setSurveyIndex] = useState(0),
    [answers, setAnswers] = useState({});
  const [lesson, setLesson] = useState(null),
    [subject, setSubject] = useState(null),
    [summary, setSummary] = useState(null);
  const [notice, setNotice] = useState(""),
    [settings, setSettings] = useState(false),
    [captcha, setCaptcha] = useState(false),
    [feedback, setFeedback] = useState("");
  const revision = useRef(0),
    backend = useRef(false),
    dirty = useRef(false),
    saving = useRef(false),
    pending = useRef(null);
  const mounted = useRef(true),
    timer = useRef(null),
    controller = useRef(null),
    generation = useRef(0),
    locked = useRef(false),
    completing = useRef(false);
  const main = useRef(null),
    currentData = useRef(data);
  currentData.current = data;
  const update = (fn) => {
    dirty.current = true;
    setData(fn);
  };
  const go = (next, effect) => {
    if (locked.current) return;
    locked.current = true;
    setLeaving(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(
      () => {
        effect?.();
        setScene(next);
        setLeaving(false);
        locked.current = false;
      },
      reducedMotion() ? 0 : 320,
    );
  };
  useEffect(() => {
    let active = true;
    apiFetch("/api/user")
      .then(async (response) => {
        if (!response.ok) throw Error();
        const result = await response.json();
        if (!active) return;
        backend.current = !result.localOnly;
        revision.current = result.revision;
        const state = result.state
          ? migrateState(result.state)
          : currentData.current;
        setData(state);
        setScene(
          !state.onboarded || !state.profile.surveyVersion ? "survey" : "home",
        );
        setSync(result.localOnly ? "local" : "saved");
      })
      .catch(() => {
        if (active) {
          const state = currentData.current;
          setScene(
            !state.onboarded || !state.profile.surveyVersion
              ? "survey"
              : "home",
          );
          setSync("offline");
        }
      })
      .finally(() => {
        if (active) setReady(true);
      });
    const show = () => setCaptcha(true);
    const hide = () => setCaptcha(false);
    window.addEventListener("constellations:captcha-required", show);
    window.addEventListener("constellations:captcha-dismissed", hide);
    return () => {
      active = false;
      mounted.current = false;
      controller.current?.abort();
      clearTimeout(timer.current);
      window.removeEventListener("constellations:captcha-required", show);
      window.removeEventListener("constellations:captcha-dismissed", hide);
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      setNotice(
        "Your browser storage is full. Open settings to export your progress before closing this page.",
      );
    }
    if (!backend.current || !dirty.current) return;
    pending.current = data;
    setSync("saving");
    const debounce = setTimeout(async () => {
      if (saving.current) return;
      saving.current = true;
      try {
        while (pending.current && backend.current) {
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
          if (!response.ok)
            throw Error(
              response.status === 409
                ? "Another tab saved newer progress. Export your browser copy, then reload to reconnect."
                : "Cloud saving is unavailable. Your progress is saved in this browser.",
            );
          revision.current = (await response.json()).revision;
          if (currentData.current === snapshot) {
            dirty.current = false;
            setSync("saved");
          }
        }
      } catch (error) {
        backend.current = false;
        setSync("offline");
        setNotice(error.message);
      } finally {
        saving.current = false;
      }
    }, 450);
    return () => clearTimeout(debounce);
  }, [data, ready]);
  useEffect(() => {
    if (!ready || leaving || scene === "home") return;
    main.current?.querySelector("h1")?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [scene, surveyIndex, lesson?.step, ready, leaving]);
  const choose = (option) => {
    if (locked.current) return;
    const next = { ...answers, [SURVEY_QUESTIONS[surveyIndex].id]: option.id };
    if (surveyIndex < SURVEY_QUESTIONS.length - 1)
      go("survey", () => {
        setAnswers(next);
        setSurveyIndex((i) => i + 1);
      });
    else
      go("home", () => {
        const ranking = rankPreferences(next);
        update((previous) => ({
          ...previous,
          onboarded: true,
          profile: {
            ...previous.profile,
            ranking,
            preference: ranking[0],
            surveyVersion: 1,
          },
          skills: previous.skills.map((s) => ({
            ...s,
            ranking,
            preference: ranking[0],
          })),
        }));
        setAnswers({});
        setSurveyIndex(0);
      });
  };
  const begin = async (existing) => {
    if (locked.current) return;
    const name = (existing?.name || query).trim().replace(/\s+/g, " ");
    if (!name) return;
    const state = currentData.current;
    const skill = state.skills.find(
      (s) => subjectKey(s.name) === subjectKey(name),
    ) || {
      id: crypto.randomUUID(),
      name,
      sessions: 0,
      confidence: 0,
      track: "hobby",
      level: "beginner",
    };
    if (
      state.activeLesson &&
      subjectKey(state.activeLesson.skill.name) === subjectKey(name)
    ) {
      completing.current = false;
      setLesson(state.activeLesson);
      go("lesson");
      return;
    }
    const ranking = normalizeRanking(
      skill.ranking || state.profile.ranking,
      state.profile.preference,
    );
    const input = {
      skill: name,
      minutes: state.profile.minutes,
      track: skill.track,
      level: skill.level || "beginner",
      preference: ranking[0],
      ranking,
      feedback: skill.feedback || "",
      prior_practice: state.notes
        .filter(
          (n) =>
            n.skillId === skill.id ||
            subjectKey(n.skill || "") === subjectKey(name),
        )
        .slice(0, 3)
        .map((n) => ({
          title: n.title,
          response: (n.answer || n.text || "").slice(0, 300),
        })),
    };
    const framework = buildFramework(input),
      requestId = ++generation.current;
    controller.current?.abort();
    const requestController = new AbortController();
    controller.current = requestController;
    const request = planFetch("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...input, framework }),
      signal: requestController.signal,
    }).then((response) => response.json());
    go("loading");
    try {
      const plan = await request;
      if (!mounted.current || generation.current !== requestId) return;
      if (locked.current)
        await new Promise((resolve) =>
          setTimeout(resolve, reducedMotion() ? 0 : 340),
        );
      if (generation.current !== requestId) return;
      if (plan.source === "pause") {
        setSummary({ pause: true, plan });
        go("summary");
        return;
      }
      const next = {
        id: crypto.randomUUID(),
        skill,
        plan,
        framework,
        step: 0,
        answer: "",
      };
      completing.current = false;
      setLesson(next);
      update((previous) => ({ ...previous, activeLesson: next }));
      setQuery("");
      go("lesson");
    } catch (error) {
      if (!requestController.signal.aborted) {
        setNotice("That lesson could not load. Try your subject again.");
        go("home");
      }
    }
  };
  const exit = () => {
    generation.current++;
    controller.current?.abort();
    if (locked.current) {
      clearTimeout(timer.current);
      locked.current = false;
      setLeaving(false);
    }
    go("home");
  };
  const changeLesson = (next) => {
    setLesson(next);
    update((previous) => ({ ...previous, activeLesson: next }));
  };
  const complete = () => {
    if (locked.current || completing.current) return;
    completing.current = true;
    const now = new Date().toISOString(),
      completed = { ...lesson, date: now };
    update((previous) => finishLesson(previous, completed, now));
    setSummary(completed);
    setFeedback("");
    setScene("completing");
    clearTimeout(timer.current);
    timer.current = setTimeout(
      () => setScene("summary"),
      reducedMotion() ? 100 : 1150,
    );
  };
  const rate = (value) => {
    setFeedback(value);
    update((previous) => ({
      ...previous,
      skills: previous.skills.map((s) => {
        if (subjectKey(s.name) !== subjectKey(summary.skill.name)) return s;
        const original = summary.framework.ranking,
          ranking =
            value === "different"
              ? [original[1], original[0], ...original.slice(2)]
              : original;
        return {
          ...s,
          ranking,
          preference: ranking[0],
          feedback:
            (value === "different"
              ? "Try a different presentation approach. "
              : "This approach worked well. ") +
            (summary.answer || "").slice(0, 450),
        };
      }),
      notes: previous.notes.map((n) =>
        n.id === summary.id ? { ...n, rating: value } : n,
      ),
    }));
  };
  const exportProgress = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "constellations-progress.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const question = SURVEY_QUESTIONS[surveyIndex],
    selected = data.skills.find((s) => s.id === subject?.id) || subject;
  const notes = selected
    ? data.notes
        .filter(
          (n) =>
            n.skillId === selected.id ||
            subjectKey(n.skill || "") === subjectKey(selected.name),
        )
        .slice()
        .reverse()
    : [];
  const showLesson = (scene === "lesson" || scene === "completing") && lesson;
  return (
    <div className={"app scene-" + scene}>
      <Starfield />
      <main
        ref={main}
        className={"scene " + (leaving ? "is-leaving" : "")}
        aria-busy={!ready || leaving || scene === "loading"}
        inert={leaving ? true : undefined}
      >
        {!ready ? (
          <span className="sr-only" role="status">
            Opening your sky
          </span>
        ) : (
          <>
            {scene === "survey" && (
              <section
                className="survey centered"
                aria-label={
                  "Learning preference question " +
                  (surveyIndex + 1) +
                  " of " +
                  SURVEY_QUESTIONS.length
                }
              >
                <h1 tabIndex={-1}>{question.prompt}</h1>
                <div className="survey-options">
                  {question.options.map((option) => (
                    <button key={option.id} onClick={() => choose(option)}>
                      {option.text}
                    </button>
                  ))}
                </div>
              </section>
            )}
            {scene === "home" && (
              <>
                <section className="home centered">
                  <h1 id="learning-prompt">What do you want to learn?</h1>
                  <form
                    className="curiosity"
                    onSubmit={(e) => {
                      e.preventDefault();
                      begin();
                    }}
                  >
                    <input
                      autoComplete="off"
                      autoFocus
                      aria-labelledby="learning-prompt"
                      value={query}
                      maxLength={100}
                      onChange={(e) => setQuery(e.target.value)}
                      spellCheck={false}
                    />
                    {query.trim() && (
                      <button
                        type="submit"
                        className="submit-curiosity"
                        aria-label={"Begin learning " + query.trim()}
                      >
                        <ArrowUp size={22} />
                      </button>
                    )}
                  </form>
                  {data.activeLesson && (
                    <button
                      className="resume-link"
                      onClick={() => {
                        setLesson(data.activeLesson);
                        completing.current = false;
                        go("lesson");
                      }}
                    >
                      Continue your lesson in {data.activeLesson.skill.name}
                      <ArrowRight size={15} />
                    </button>
                  )}
                </section>
                <nav
                  className="constellation-sky"
                  aria-label="Your subject constellations"
                >
                  {data.skills
                    .filter((s) => s.sessions > 0)
                    .map((skill) => (
                      <Constellation
                        key={skill.id}
                        skill={skill}
                        onSelect={() => {
                          setSubject(skill);
                          go("subject");
                        }}
                      />
                    ))}
                </nav>
                <button
                  className="settings-trigger"
                  aria-label="Learning settings"
                  onClick={() => setSettings(true)}
                >
                  <Settings size={18} />
                </button>
              </>
            )}
            {scene === "loading" && (
              <section className="centered loading" role="status">
                <span className="loading-star" aria-hidden="true" />
                <p>Finding a starting point.</p>
                <button className="text-button" onClick={exit}>
                  Back to your sky
                </button>
              </section>
            )}
            {showLesson && (
              <section
                className={
                  "lesson centered " +
                  (scene === "completing" ? "becoming-star" : "")
                }
              >
                <button className="back-link" onClick={exit}>
                  <ArrowLeft size={16} />
                  Back to your sky
                </button>
                <h1 tabIndex={-1}>{lesson.plan.title}</h1>
                <p className="lesson-context">{lesson.plan.description}</p>
                {lesson.plan.notice && (
                  <p className="inline-notice" role="status">
                    {lesson.plan.notice}
                  </p>
                )}
                {lesson.plan.source === "curated" && !lesson.plan.notice && (
                  <p className="quiet">
                    Offline practice · a starting point while your guide is
                    unavailable.
                  </p>
                )}
                <div className="activity" key={lesson.step}>
                  <h2>{phaseLabels[lesson.step]}</h2>
                  <p className="activity-instruction">
                    {lesson.plan.steps[lesson.step]}
                  </p>
                  {lesson.step === 2 && (
                    <label className="response-field">
                      <span>What do you remember or notice?</span>
                      <textarea
                        value={lesson.answer}
                        onChange={(e) =>
                          changeLesson({ ...lesson, answer: e.target.value })
                        }
                        maxLength={3000}
                        placeholder="A few words, in your own way."
                      />
                    </label>
                  )}
                  {lesson.step === 2 && lesson.plan.expected_answer && (
                    <AnswerReveal
                      answer={lesson.plan.expected_answer}
                      enabled={Boolean(lesson.answer.trim())}
                    />
                  )}
                </div>
                <div className="lesson-navigation">
                  {lesson.step > 0 ? (
                    <button
                      className="text-button"
                      onClick={() =>
                        go("lesson", () =>
                          changeLesson({ ...lesson, step: lesson.step - 1 }),
                        )
                      }
                    >
                      <ArrowLeft size={16} />
                      Previous
                    </button>
                  ) : (
                    <span />
                  )}
                  <span
                    className="step-count"
                    aria-label={"Activity " + (lesson.step + 1) + " of 3"}
                  >
                    {lesson.step + 1} / 3
                  </span>
                  <button
                    className="text-button next-action"
                    disabled={lesson.step === 2 && !lesson.answer.trim()}
                    onClick={() =>
                      lesson.step < 2
                        ? go("lesson", () =>
                            changeLesson({ ...lesson, step: lesson.step + 1 }),
                          )
                        : complete()
                    }
                  >
                    {lesson.step === 2 ? "Finish lesson" : "Continue"}
                    <ArrowRight size={18} />
                  </button>
                </div>
              </section>
            )}
            {scene === "completing" && (
              <span
                className="born-star"
                role="status"
                aria-label="Lesson complete. A new star in your constellation."
              />
            )}
            {scene === "summary" && summary && (
              <section className="summary centered">
                <h1 tabIndex={-1}>
                  {summary.pause
                    ? "A good place to pause."
                    : summary.history
                      ? summary.plan.title
                      : "A new star in " + summary.skill.name + "."}
                </h1>
                {summary.pause ? (
                  <p>{summary.plan.description}</p>
                ) : (
                  <>
                    {!summary.history && <h2>{summary.plan.title}</h2>}
                    <p className="summary-description">
                      {summary.plan.description}
                    </p>
                    {summary.plan.steps?.length > 0 && (
                      <ol className="summary-steps">
                        {summary.plan.steps.map((step, i) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ol>
                    )}
                    {summary.answer && (
                      <blockquote>{summary.answer}</blockquote>
                    )}
                    {summary.plan.reflection && (
                      <p className="reflection">{summary.plan.reflection}</p>
                    )}
                    {!summary.history && (
                      <fieldset className="feedback">
                        <legend>How did this approach feel?</legend>
                        <button
                          aria-pressed={feedback === "worked"}
                          onClick={() => rate("worked")}
                        >
                          Worked for me
                        </button>
                        <button
                          aria-pressed={feedback === "different"}
                          onClick={() => rate("different")}
                        >
                          Try a different approach
                        </button>
                        {feedback && (
                          <p role="status">
                            {feedback === "worked"
                              ? "We’ll keep this approach in mind."
                              : "Your next lesson will start a different way."}
                          </p>
                        )}
                      </fieldset>
                    )}
                  </>
                )}
                <button
                  className="text-button next-action summary-return"
                  onClick={() => go(summary.history ? "subject" : "home")}
                >
                  {summary.history
                    ? "Back to " + summary.skill.name
                    : "Back to your sky"}
                  <ArrowRight size={18} />
                </button>
              </section>
            )}
            {scene === "subject" && selected && (
              <section className="subject centered">
                <button className="back-link" onClick={() => go("home")}>
                  <ArrowLeft size={16} />
                  Back to your sky
                </button>
                <h1 tabIndex={-1}>{selected.name}</h1>
                <p className="quiet">
                  {selected.sessions}{" "}
                  {selected.sessions === 1
                    ? "lesson, one star."
                    : "lessons, connected."}
                </p>
                <button
                  className="text-button next-action"
                  onClick={() => begin(selected)}
                >
                  Continue learning
                  <ArrowRight size={18} />
                </button>
                <Constellation
                  skill={selected}
                  expanded
                  notes={notes}
                  onStar={(note) => {
                    setSummary({
                      history: true,
                      skill: selected,
                      plan: note.plan || {
                        title: note.title,
                        description: note.text,
                      },
                      answer: note.answer,
                    });
                    go("summary");
                  }}
                />
              </section>
            )}
          </>
        )}
      </main>
      {notice && scene !== "survey" && (
        <aside className="notice" role="status">
          <p>{notice}</p>
          <button aria-label="Dismiss notice" onClick={() => setNotice("")}>
            <X size={17} />
          </button>
        </aside>
      )}
      {settings && (
        <FocusDialog
          title="Your way of learning"
          close={() => setSettings(false)}
        >
          <p className="quiet">
            Your current preferences guide each lesson. They can change as you
            learn.
          </p>
          <ol className="ranked-methods">
            {data.profile.ranking.map((id) => (
              <li key={id}>{methodLabel(id)}</li>
            ))}
          </ol>
          <button
            className="text-button"
            onClick={() => {
              setSettings(false);
              setSurveyIndex(0);
              setAnswers({});
              go("survey");
            }}
          >
            Retake the survey
            <ArrowRight size={16} />
          </button>
          <label className="duration-setting">
            Time for a lesson
            <select
              value={data.profile.minutes}
              onChange={(e) =>
                update((previous) => ({
                  ...previous,
                  profile: {
                    ...previous.profile,
                    minutes: Number(e.target.value),
                  },
                }))
              }
            >
              {[2, 5, 10, 15].map((n) => (
                <option key={n} value={n}>
                  {n} minutes
                </option>
              ))}
            </select>
          </label>
          <p className="quiet" role="status">
            {sync === "saved"
              ? "Progress saved to your private browser session and this browser."
              : sync === "saving"
                ? "Saving progress…"
                : "Progress saved in this browser."}{" "}
            Keep this browser’s data to return to your sky.
          </p>
          <button className="text-button" onClick={exportProgress}>
            Export your progress
            <ArrowRight size={16} />
          </button>
        </FocusDialog>
      )}
      {captcha && (
        <FocusDialog
          title="One quick check"
          close={() => {
            setCaptcha(false);
            cancelCaptchaChallenge();
          }}
        >
          <p>This helps keep the learning guide available.</p>
          <CaptchaWidget
            onSuccess={(token) => {
              setCaptcha(false);
              completeCaptchaChallenge(token);
            }}
            onError={() => {
              setCaptcha(false);
              cancelCaptchaChallenge();
              setNotice(
                "The check could not load. You can use offline practice and try again later.",
              );
            }}
          />
        </FocusDialog>
      )}
    </div>
  );
}
function AnswerReveal({ answer, enabled }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="answer-check">
      <button
        className="text-button"
        disabled={!enabled}
        onClick={() => setOpen(!open)}
      >
        {open ? "Hide the example answer" : "Compare with an example answer"}
      </button>
      {open && <p>{answer}</p>}
    </div>
  );
}
function FocusDialog({ title, close, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    ref.current.showModal();
    return () => previous?.focus();
  }, []);
  return (
    <dialog
      ref={ref}
      className="focus-dialog"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      aria-labelledby="dialog-title"
    >
      <button
        className="dialog-close"
        aria-label="Close dialog"
        onClick={close}
      >
        <X size={20} />
      </button>
      <h2 id="dialog-title">{title}</h2>
      {children}
    </dialog>
  );
}
let turnstileScript;
function CaptchaWidget({ onSuccess, onError }) {
  const ref = useRef(null),
    callbacks = useRef({ onSuccess, onError });
  callbacks.current = { onSuccess, onError };
  useEffect(() => {
    let active = true,
      widget;
    if (!turnstileScript)
      turnstileScript = new Promise((resolve, reject) => {
        if (window.turnstile) {
          resolve(window.turnstile);
          return;
        }
        const script = document.createElement("script");
        script.src =
          "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.onload = () => resolve(window.turnstile);
        script.onerror = () => {
          turnstileScript = undefined;
          reject(Error("Check unavailable"));
        };
        document.head.appendChild(script);
      });
    turnstileScript
      .then((api) => {
        if (!active) return;
        widget = api.render(ref.current, {
          sitekey: import.meta.env.VITE_TURNSTILE_SITE_KEY,
          theme: "dark",
          callback: (token) => callbacks.current.onSuccess(token),
          "error-callback": () => callbacks.current.onError(),
          "expired-callback": () => api.reset(widget),
        });
      })
      .catch(() => {
        if (active) callbacks.current.onError();
      });
    return () => {
      active = false;
      if (widget !== undefined) window.turnstile?.remove(widget);
    };
  }, []);
  return <div ref={ref} />;
}
createRoot(document.getElementById("root")).render(<App />);
