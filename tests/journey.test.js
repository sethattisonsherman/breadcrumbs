import test from "node:test";
import assert from "node:assert/strict";
import {
  migrateState,
  finishLesson,
  subjectKey,
  starPosition,
} from "../client/src/journey.js";
import { buildFramework } from "../shared/learning.js";

test("legacy progress survives migration and keeps its selected preference", () => {
  const old = {
    version: 1,
    onboarded: true,
    skills: [{ id: "old", name: "Biology", sessions: 7 }],
    notes: [{ id: "note", text: "Remember this" }],
    profile: { preference: "talking", minutes: 10 },
  };
  const next = migrateState(old);
  assert.equal(next.skills[0].sessions, 7);
  assert.deepEqual(next.notes, old.notes);
  assert.equal(next.profile.ranking[0], "talking");
  assert.equal(next.profile.minutes, 10);
});
test("completion creates exactly one star, is idempotent, and reuses an existing subject", () => {
  const original = migrateState(null);
  const first = {
    id: "lesson-1",
    skill: {
      id: "s1",
      name: "Biology",
      sessions: 0,
      confidence: 0,
      track: "hobby",
    },
    plan: { title: "Cells", steps: ["Read", "Try", "Recall"] },
    framework: buildFramework(),
    answer: "A cell",
  };
  const once = finishLesson(original, first);
  assert.equal(original.skills.length, 0);
  assert.equal(once.skills[0].sessions, 1);
  assert.equal(once.notes.length, 1);
  assert.equal(finishLesson(once, first), once);
  const twice = finishLesson(once, {
    ...first,
    id: "lesson-2",
    skill: { ...first.skill, id: "s2", name: "  BIOLOGY " },
  });
  assert.equal(twice.skills.length, 1);
  assert.equal(twice.skills[0].sessions, 2);
  assert.equal(twice.notes[0].skillId, "s1");
  assert.equal(subjectKey(" Cell  Biology "), "cell biology");
});
test("positions do not repeat when a constellation grows beyond its old glyph size", () => {
  assert.equal(
    new Set(Array.from({ length: 200 }, (_, i) => starPosition(i).join(",")))
      .size,
    200,
  );
});
