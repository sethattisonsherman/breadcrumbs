import test from "node:test";
import assert from "node:assert/strict";
import {
  METHODS,
  SURVEY_QUESTIONS,
  rankPreferences,
  normalizeRanking,
  buildFramework,
} from "../shared/learning.js";

const ids = METHODS.map(({ id }) => id);

test("survey has six situational forced-choice questions covering each preference", () => {
  assert.equal(SURVEY_QUESTIONS.length, 6);
  for (const question of SURVEY_QUESTIONS) {
    assert.equal(question.options.length, 4);
    assert.deepEqual(
      new Set(question.options.map((option) => option.method)),
      new Set(ids),
    );
    assert.deepEqual(
      question.options.map((option) => option.weight),
      [1, 1, 1, 1],
    );
  }
});

test("each answer counts equally; latest preference breaks score ties before stable order", () => {
  const allZero = rankPreferences([]);
  assert.deepEqual(allZero, ids);
  for (const method of ids) {
    const answers = Object.fromEntries(
      SURVEY_QUESTIONS.map((question) => [
        question.id,
        question.options.find((option) => option.method === method).id,
      ]),
    );
    assert.equal(rankPreferences(answers)[0], method);
  }
  assert.deepEqual(
    rankPreferences(["reading", "reading"]),
    rankPreferences({
      first_glimpse: "skim",
      stuck_point: "plain_words",
    }),
  );
  assert.deepEqual(rankPreferences(["doing", "watching"]), [
    "watching",
    "doing",
    "reading",
    "talking",
  ]);
  assert.deepEqual(rankPreferences(["watching", "doing"]), [
    "doing",
    "watching",
    "reading",
    "talking",
  ]);
  assert.deepEqual(
    rankPreferences(["doing", "watching", "doing", "watching"]),
    ["watching", "doing", "reading", "talking"],
  );
});

test("ranking normalization removes invalids and duplicates, then appends missing preferences", () => {
  assert.deepEqual(
    normalizeRanking(["reading", "reading", "bogus"], "talking"),
    ["reading", "doing", "watching", "talking"],
  );
  assert.deepEqual(normalizeRanking([], "talking"), [
    "talking",
    "doing",
    "watching",
    "reading",
  ]);
  assert.deepEqual(normalizeRanking(null, "unknown"), ids);
});

function permutations(values) {
  if (values.length <= 1) return [values];
  return values.flatMap((value, index) =>
    permutations([...values.slice(0, index), ...values.slice(index + 1)]).map(
      (tail) => [value, ...tail],
    ),
  );
}

test("all 24 full rankings create unique deterministic bounded three-phase frameworks", () => {
  const rankings = permutations(ids);
  const frameworks = rankings.map((ranking) =>
    buildFramework({
      ranking,
      skill: "Cell biology",
      feedback: "just-right",
      level: "beginner",
    }),
  );
  assert.equal(new Set(frameworks.map(({ id }) => id)).size, 24);
  for (const [index, framework] of frameworks.entries()) {
    assert.equal(framework.version, 1);
    assert.deepEqual(
      framework,
      buildFramework({
        ranking: framework.ranking,
        skill: "Cell biology",
        feedback: "just-right",
        level: "beginner",
      }),
    );
    assert.deepEqual(framework.ranking, rankings[index]);
    assert.equal(framework.phases.length, 3);
    assert.deepEqual(
      framework.phases.map(({ kind }) => kind),
      ["orient", "attempt", "retrieve_reflect"],
    );
    for (const phase of framework.phases) {
      assert.equal(typeof phase.intent, "string");
      assert.equal(typeof phase.instruction, "string");
      assert.ok(phase.intent.length > 0 && phase.intent.length <= 180);
      assert.ok(
        phase.instruction.length > 0 && phase.instruction.length <= 450,
      );
    }
    assert.match(framework.phases[2].intent, /retrieve/i);
    assert.match(framework.phases[2].instruction, /from memory|remember/i);
    assert.match(framework.phases[2].instruction, /reflect|question/i);
  }
  assert.match(frameworks[0].phases[0].instruction, /Focus on Cell biology\./);
});

test("each ranking order influences its corresponding phase without implying a fixed identity", () => {
  for (const ranking of permutations(ids)) {
    const framework = buildFramework({ ranking });
    assert.match(
      framework.phases[0].instruction,
      new RegExp(
        ranking[0] === "doing"
          ? "attempt"
          : ranking[0] === "watching"
            ? "example|demonstration"
            : ranking[0] === "reading"
              ? "Read|written"
              : "Say|aloud",
        "i",
      ),
    );
    assert.match(
      framework.phases[1].instruction,
      new RegExp(
        ranking[1] === "doing"
          ? "attempt"
          : ranking[1] === "watching"
            ? "example"
            : ranking[1] === "reading"
              ? "written"
              : "talk",
        "i",
      ),
    );
    assert.match(
      framework.phases[2].instruction,
      new RegExp(
        ranking[2] === "doing"
          ? "tried"
          : ranking[2] === "watching"
            ? "example"
            : ranking[2] === "reading"
              ? "write"
              : "aloud",
        "i",
      ),
    );
    assert.match(framework.phases[2].intent, /preference/i);
  }
});

test("legacy preference is accepted and difficult feedback makes the attempt gentler", () => {
  const framework = buildFramework({
    preference: "reading",
    feedback: "That felt difficult",
  });
  assert.equal(framework.ranking[0], "reading");
  assert.match(
    framework.phases[1].instruction,
    /especially small and comfortable/i,
  );
});
