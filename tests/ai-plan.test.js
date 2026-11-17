import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validateAIPlan } from "../ai/plan-contract.js";
const examples = JSON.parse(
  await readFile(new URL("../ai/examples.json", import.meta.url), "utf8"),
);
test("documented task examples satisfy the real API output contract", () => {
  for (const example of examples.filter((e) => e.input.action === "task"))
    assert.deepEqual(validateAIPlan(example.output), example.output);
});
test("malformed, long, or out-of-budget AI tasks are rejected for a curated fallback", () => {
  const plan = examples[0].output;
  for (const change of [
    { estimated_seconds: 180 },
    { steps: ["one", "two"] },
    { description: "word ".repeat(25) },
    { unexpected: "provider data" },
    { expected_answer: "An answer in a practical task" },
    { title: null },
  ])
    assert.throws(() => validateAIPlan({ ...plan, ...change }));
});
test("retrieval answer is distinct from visible task fields", () => {
  const plan = validateAIPlan(examples[1].output);
  assert(plan.expected_answer.includes("background-color"));
  const visible = [
    plan.title,
    plan.description,
    ...plan.steps,
    plan.reflection,
  ].join(" ");
  assert(!visible.includes("background-color"));
});
