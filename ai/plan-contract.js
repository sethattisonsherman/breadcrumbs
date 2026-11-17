const allowed = [
  "title",
  "description",
  "steps",
  "method",
  "reflection",
  "estimated_seconds",
  "expected_answer",
];
const words = (s) => s.trim().split(/\s+/).filter(Boolean).length;
export function validateAIPlan(plan) {
  if (
    !plan ||
    typeof plan !== "object" ||
    Array.isArray(plan) ||
    Object.keys(plan).some((k) => !allowed.includes(k)) ||
    allowed.some((k) => !(k in plan))
  )
    throw new Error("Invalid AI task format");
  if (
    typeof plan.title !== "string" ||
    !plan.title.trim() ||
    plan.title.length > 90 ||
    words(plan.title) > 9 ||
    typeof plan.description !== "string" ||
    plan.description.length > 300 ||
    words(plan.description) > 24 ||
    typeof plan.reflection !== "string" ||
    plan.reflection.length > 200 ||
    words(plan.reflection) > 14
  )
    throw new Error("AI task is not concise");
  if (
    !Array.isArray(plan.steps) ||
    plan.steps.length !== 3 ||
    !plan.steps.every(
      (s) =>
        typeof s === "string" && s.trim() && s.length <= 350 && words(s) <= 20,
    )
  )
    throw new Error("AI task must have three short instructions");
  if (
    !["Practical", "Retrieval", "Mind mapping", "Elaborative"].includes(
      plan.method,
    ) ||
    !Number.isInteger(plan.estimated_seconds) ||
    plan.estimated_seconds < 60 ||
    plan.estimated_seconds > 120
  )
    throw new Error("AI task has an invalid method or duration");
  if (
    plan.expected_answer !== null &&
    (typeof plan.expected_answer !== "string" ||
      plan.expected_answer.length > 600 ||
      plan.method !== "Retrieval")
  )
    throw new Error("Invalid retrieval check");
  if (
    words(
      [
        plan.title,
        plan.description,
        ...plan.steps,
        plan.method,
        plan.reflection,
      ].join(" "),
    ) > 110
  )
    throw new Error("AI task exceeds its reading budget");
  return Object.fromEntries(allowed.map((k) => [k, plan[k]]));
}
