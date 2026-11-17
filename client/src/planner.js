export function generatePlan({
  skill,
  minutes = 5,
  preference = "doing",
  track = "hobby",
  level = "beginner",
  feedback = "",
}) {
  const s = skill.toLowerCase();
  const gentle = /stretch|hard|difficult/i.test(feedback);
  const recall = track === "academic";
  let plan;
  if (/guitar|ukulele/.test(s))
    plan = {
      title: gentle
        ? "One chord, a little clearer"
        : "Make your first chord change",
      description:
        "A little rhythm goes a long way. Give two simple chords a few unhurried minutes.",
      steps: [
        "Place your fingers for an E minor chord. Pluck each string slowly and adjust until it rings clearly.",
        "Move to A minor. Look at which fingers move and which can stay close to the strings.",
        `Switch between the two ${gentle ? "very slowly, four times" : "slowly for one minute"}. Finish by playing one clear change without looking at your notes.`,
      ],
      method: "Deliberate practice",
      reflection: "Which finger movement could feel a little easier next time?",
    };
  else if (/spanish|french|language|japanese|italian|german/.test(s))
    plan = {
      title: "A tiny conversation, all yours",
      description:
        "Turn a few familiar words into something you could actually say.",
      steps: [
        `Choose three useful phrases in ${skill}. Read their meanings and say each phrase slowly.`,
        `Cover the phrases. Recall a greeting and introduce yourself from memory. Check and correct one detail.`,
        `Make a two-line conversation using the phrases. ${preference === "reading" ? "Write it down" : "Say it aloud"}, then try once more without looking.`,
      ],
      method: "Active recall",
      reflection:
        "Which phrase came back easily, and which needs another visit?",
    };
  else if (/draw|sketch|art|paint/.test(s))
    plan = {
      title: "See the shapes in something ordinary",
      description:
        "A mug, a leaf, a little moment. You already have everything you need to begin.",
      steps: [
        "Choose a small object nearby. Look for the three biggest shapes before making a mark.",
        "Sketch just those shapes, using light lines. Add one area of shadow.",
        "Look back at the object. Adjust one proportion, then make a second tiny sketch from memory.",
      ],
      method: "Observation & deliberate practice",
      reflection:
        "What did you notice the second time that you missed the first?",
    };
  else if (recall)
    plan = {
      title: `Make one idea in ${skill} stick`,
      description:
        "One concept, a fresh explanation, and a quick check. That is enough for today.",
      steps: [
        `Choose one ${level === "beginner" ? "introductory" : "challenging"} concept in ${skill}. Read a short explanation or worked example.`,
        `Close your source. ${preference === "talking" ? "Explain aloud" : "Write in your own words"} what it means and why it works. Include one example.`,
        "Reopen the source and compare. Correct one gap, then explain the corrected idea again without looking.",
      ],
      method: "Retrieval & explanation",
      reflection:
        "What could you explain without help, and what is still a little fuzzy?",
    };
  else
    plan = {
      title: `One small experiment in ${skill}`,
      description: `Make a little space to explore ${skill}. Today is about one useful attempt.`,
      steps: [
        `Choose one ${gentle ? "very simple" : level === "beginner" ? "basic" : "challenging"} technique in ${skill}. Find an example ${preference === "watching" ? "you can watch" : preference === "reading" ? "you can read" : "from a trusted beginner guide"}.`,
        `Try the smallest version of that technique for ${Math.max(1, minutes - 2)} minutes. Focus on just one part of the process.`,
        "Compare your attempt with the example. Change one thing and try again. Save or describe what you made.",
      ],
      method: "Deliberate practice",
      reflection: "What changed between your first and second attempt?",
    };
  return {
    ...plan,
    description: gentle
      ? "Let’s make this gentler. Work on just one part, at a pace that feels comfortable."
      : plan.description,
  };
}
