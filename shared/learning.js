export const METHODS = Object.freeze([
  Object.freeze({ id: "doing", label: "Try it yourself" }),
  Object.freeze({ id: "watching", label: "See an example" }),
  Object.freeze({ id: "reading", label: "Read a short guide" }),
  Object.freeze({ id: "talking", label: "Explain it aloud" }),
]);

const METHOD_IDS = Object.freeze(METHODS.map(({ id }) => id));
const METHOD_SET = new Set(METHOD_IDS);

// Each option is a situational preference, not a claim about a fixed learning style.
export const SURVEY_QUESTIONS = Object.freeze([
  Object.freeze({
    id: "first_glimpse",
    prompt:
      "When a new idea catches your interest, what sounds like a good first step?",
    options: Object.freeze([
      Object.freeze({
        id: "fiddle",
        method: "doing",
        weight: 1,
        text: "Try a small version right away",
      }),
      Object.freeze({
        id: "watch",
        method: "watching",
        weight: 1,
        text: "See someone demonstrate it",
      }),
      Object.freeze({
        id: "skim",
        method: "reading",
        weight: 1,
        text: "Read a short introduction",
      }),
      Object.freeze({
        id: "say",
        method: "talking",
        weight: 1,
        text: "Talk through what you already know",
      }),
    ]),
  }),
  Object.freeze({
    id: "stuck_point",
    prompt: "If you get stuck, which kind of nudge would you reach for first?",
    options: Object.freeze([
      Object.freeze({
        id: "worked_example",
        method: "watching",
        weight: 1,
        text: "A worked example to look over",
      }),
      Object.freeze({
        id: "quick_try",
        method: "doing",
        weight: 1,
        text: "A tiny attempt with one clue",
      }),
      Object.freeze({
        id: "plain_words",
        method: "reading",
        weight: 1,
        text: "A few clear written lines",
      }),
      Object.freeze({
        id: "conversation",
        method: "talking",
        weight: 1,
        text: "A quick conversation about it",
      }),
    ]),
  }),
  Object.freeze({
    id: "remembering",
    prompt: "What would make a new detail easier to bring back later?",
    options: Object.freeze([
      Object.freeze({
        id: "write_cue",
        method: "reading",
        weight: 1,
        text: "A brief note or written cue",
      }),
      Object.freeze({
        id: "explain_cue",
        method: "talking",
        weight: 1,
        text: "Putting the idea into my own words aloud",
      }),
      Object.freeze({
        id: "repeat_action",
        method: "doing",
        weight: 1,
        text: "Repeating one small action",
      }),
      Object.freeze({
        id: "visual_recall",
        method: "watching",
        weight: 1,
        text: "Revisiting a visual example",
      }),
    ]),
  }),
  Object.freeze({
    id: "free_moment",
    prompt: "Imagine you have five unhurried minutes. What feels inviting?",
    options: Object.freeze([
      Object.freeze({
        id: "make_attempt",
        method: "doing",
        weight: 1,
        text: "Make or try one small thing",
      }),
      Object.freeze({
        id: "read_page",
        method: "reading",
        weight: 1,
        text: "Read a short passage",
      }),
      Object.freeze({
        id: "watch_clip",
        method: "watching",
        weight: 1,
        text: "Look at a short demonstration",
      }),
      Object.freeze({
        id: "voice_note",
        method: "talking",
        weight: 1,
        text: "Describe the idea in my own words",
      }),
    ]),
  }),
  Object.freeze({
    id: "check_progress",
    prompt:
      "After trying something new, how would you like to check what you noticed?",
    options: Object.freeze([
      Object.freeze({
        id: "compare_example",
        method: "watching",
        weight: 1,
        text: "Compare my attempt with an example",
      }),
      Object.freeze({
        id: "jot_note",
        method: "reading",
        weight: 1,
        text: "Write down one thing I noticed",
      }),
      Object.freeze({
        id: "try_again",
        method: "doing",
        weight: 1,
        text: "Try it once more with one change",
      }),
      Object.freeze({
        id: "say_reflection",
        method: "talking",
        weight: 1,
        text: "Say what I noticed out loud",
      }),
    ]),
  }),
  Object.freeze({
    id: "share_idea",
    prompt:
      "If you wanted to share a new idea with someone, what would feel natural?",
    options: Object.freeze([
      Object.freeze({
        id: "tell_story",
        method: "talking",
        weight: 1,
        text: "Explain it in a few spoken sentences",
      }),
      Object.freeze({
        id: "show_result",
        method: "doing",
        weight: 1,
        text: "Show a small thing I made or tried",
      }),
      Object.freeze({
        id: "draw_example",
        method: "watching",
        weight: 1,
        text: "Point to a visual example",
      }),
      Object.freeze({
        id: "write_summary",
        method: "reading",
        weight: 1,
        text: "Write a short summary",
      }),
    ]),
  }),
]);

const questionById = new Map(
  SURVEY_QUESTIONS.map((question) => [question.id, question]),
);

function answerEntries(answers) {
  if (Array.isArray(answers))
    return answers.map((answer, index) => [
      SURVEY_QUESTIONS[index]?.id,
      answer,
    ]);
  if (answers && typeof answers === "object") return Object.entries(answers);
  return [];
}

function selectedOption(questionId, answer) {
  const question = questionById.get(questionId);
  if (!question) return null;
  if (typeof answer === "number" && Number.isInteger(answer))
    return question.options[answer] || null;
  if (typeof answer !== "string") return null;
  return (
    question.options.find(
      (option) => option.id === answer || option.method === answer,
    ) || null
  );
}

export function rankPreferences(answers) {
  const scores = Object.fromEntries(METHOD_IDS.map((id) => [id, 0]));
  const recency = Object.fromEntries(METHOD_IDS.map((id) => [id, -1]));
  let answerOrder = 0;
  for (const [questionId, answer] of answerEntries(answers)) {
    const option = selectedOption(questionId, answer);
    if (option) {
      scores[option.method] += 1;
      recency[option.method] = answerOrder;
    }
    answerOrder += 1;
  }
  return [...METHOD_IDS].sort(
    (left, right) =>
      scores[right] - scores[left] ||
      recency[right] - recency[left] ||
      METHOD_IDS.indexOf(left) - METHOD_IDS.indexOf(right),
  );
}

export function normalizeRanking(ranking, legacyPreference) {
  const values = Array.isArray(ranking) ? ranking : [];
  const normalized = [];
  for (const id of values) {
    if (
      typeof id === "string" &&
      METHOD_SET.has(id) &&
      !normalized.includes(id)
    )
      normalized.push(id);
  }
  if (
    normalized.length === 0 &&
    typeof legacyPreference === "string" &&
    METHOD_SET.has(legacyPreference)
  )
    normalized.push(legacyPreference);
  for (const id of METHOD_IDS)
    if (!normalized.includes(id)) normalized.push(id);
  return normalized;
}

const modality = Object.freeze({
  doing: {
    orient: "Make a small first attempt with the idea.",
    attempt: "Try one bounded variation yourself and notice what changes.",
    recall: "From memory, name one thing you tried and one thing you noticed.",
  },
  watching: {
    orient: "Study a short example or demonstration of the idea.",
    attempt:
      "Use the example as a guide for one small attempt; notice one detail.",
    recall:
      "Without reopening the example, describe one detail you remember and why it matters.",
  },
  reading: {
    orient: "Read a brief explanation or a few written cues about the idea.",
    attempt:
      "Use one written cue to make a small attempt; notice what it helps clarify.",
    recall:
      "Set the text aside and write one point you remember and one question you still have.",
  },
  talking: {
    orient: "Say what you already know about the idea in a few words.",
    attempt:
      "Talk through one small attempt or example; notice where your explanation changes.",
    recall:
      "Explain the key idea aloud from memory, then name one question to revisit.",
  },
});

function boundedText(value, limit = 100) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

/**
 * Stable shared framework schema:
 * { version, id, ranking, phases: [{ kind, intent, instruction }] }
 * Preference shapes presentation only; phase intents preserve a useful learning arc.
 */
export function buildFramework({
  ranking,
  preference,
  feedback,
  skill,
  track,
  level,
  goal,
} = {}) {
  const ordered = normalizeRanking(ranking, preference);
  const [primary, secondary, tertiary] = ordered;
  const soft = /stretch|hard|difficult/i.test(boundedText(feedback, 600));
  const subject = boundedText(skill, 80);
  const context = subject ? ` Focus on ${subject}.` : "";
  const startLevel = boundedText(level, 24);
  const aim = boundedText(goal, 120);
  const aimContext = aim ? ` Keep this small step pointed toward: ${aim}.` : "";
  const scale = soft
    ? "Keep the attempt especially small and comfortable."
    : "Keep the attempt small and easy to stop.";
  const phases = [
    {
      kind: "orient",
      intent:
        "Orient to one useful idea using the highest-ranked presentation preference.",
      instruction: `${modality[primary].orient}${context}${startLevel ? ` Start from the learner's ${startLevel} experience.` : ""}${aimContext}`,
    },
    {
      kind: "attempt",
      intent:
        "Make one bounded attempt, with the next-ranked preference shaping the support.",
      instruction: `${modality[secondary].attempt} ${scale}`,
    },
    {
      kind: "retrieve_reflect",
      intent:
        "Retrieve the idea and reflect briefly; use the third-ranked preference for the response format.",
      instruction: `${modality[tertiary].recall} This retrieval and reflection step is part of learning, not a judgment of ability.`,
    },
  ];
  return {
    version: 1,
    id: `framework-v1-${ordered.join("-")}`,
    ranking: ordered,
    phases,
  };
}
