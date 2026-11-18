import test from "node:test";
import assert from "node:assert/strict";
import { buildFramework, normalizeRanking } from "../shared/learning.js";
import {
  generatePlan,
  hasValidPreferenceRanking,
  preparePlanInput,
} from "../client/src/planner.js";

const ids = ["doing", "watching", "reading", "talking"];

test("provider preparation recomputes the canonical framework and drops caller-supplied framework data", () => {
  const ranking = ["talking", "reading", "watching", "doing"];
  const prepared = preparePlanInput({
    skill: "Biology",
    minutes: 5,
    preference: "doing",
    ranking,
    track: "academic",
    level: "some",
    framework: { phases: [{ instruction: "untrusted caller content" }] },
  });
  assert.deepEqual(prepared.ranking, ranking);
  assert.deepEqual(
    prepared.framework,
    buildFramework({
      ranking,
      preference: "talking",
      skill: "Biology",
      track: "academic",
      level: "some",
    }),
  );
  assert.doesNotMatch(JSON.stringify(prepared), /untrusted caller content/);
  assert.equal(prepared.preference, "talking");
});

test("ranking validation requires exactly four unique known ids while legacy scalar preferences normalize", () => {
  assert.equal(hasValidPreferenceRanking(ids), true);
  assert.equal(
    hasValidPreferenceRanking(["doing", "doing", "reading", "talking"]),
    false,
  );
  assert.equal(
    hasValidPreferenceRanking(["doing", "watching", "reading"]),
    false,
  );
  assert.equal(
    hasValidPreferenceRanking(["doing", "watching", "reading", "other"]),
    false,
  );
  const legacy = preparePlanInput({ preference: "reading", skill: "History" });
  assert.deepEqual(legacy.ranking, normalizeRanking([], "reading"));
  assert.equal(legacy.preference, "reading");
});

test("prior practice is reduced to three bounded title and response objects", () => {
  const history = Array.from({ length: 4 }, (_, index) => ({
    title: `${index}${"t".repeat(120)}`,
    response: `${index}${"r".repeat(320)}`,
    ignored: "not forwarded",
  }));
  const prepared = preparePlanInput({
    skill: "History",
    prior_practice: history,
  });
  assert.equal(prepared.prior_practice.length, 3);
  assert.deepEqual(Object.keys(prepared.prior_practice[0]), [
    "title",
    "response",
  ]);
  assert.equal(prepared.prior_practice[0].title.length, 100);
  assert.equal(prepared.prior_practice[0].response.length, 300);
  assert.equal(prepared.prior_practice[2].title[0], "2");
});

test("curated plans use ranked presentation for the first two phases and retrieval for the third", () => {
  const ranking = ["reading", "watching", "talking", "doing"];
  for (const skill of [
    "Acoustic guitar",
    "Everyday Spanish",
    "Sketching",
    "Biology",
    "Woodworking",
  ]) {
    const plan = generatePlan({
      skill,
      track: skill === "Biology" ? "academic" : "hobby",
      ranking,
    });
    assert.match(plan.steps[0], /^Read this written cue carefully:/);
    assert.match(
      plan.steps[1],
      /^Picture the action as a short demonstration:/,
    );
    assert.match(plan.steps[2], /from memory|remember/i);
    assert.doesNotMatch(
      plan.steps.join(" "),
      /find an example|trusted beginner guide|search for/i,
    );
  }
});
