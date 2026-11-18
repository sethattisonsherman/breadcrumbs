import { normalizeRanking } from "../../shared/learning.js";

export const STORAGE_KEY = "breadcrumbs-v1";
export function migrateState(value) {
  const valid =
    value?.version === 1 &&
    Array.isArray(value.skills) &&
    Array.isArray(value.notes);
  const data = valid
    ? value
    : { version: 1, skills: [], notes: [], onboarded: false };
  const profile = { preference: "doing", minutes: 5, ...data.profile };
  profile.ranking = normalizeRanking(profile.ranking, profile.preference);
  profile.preference = profile.ranking[0];
  if (![2, 5, 10, 15].includes(profile.minutes)) profile.minutes = 5;
  return { ...data, profile };
}
export const subjectKey = (name) =>
  name.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US");

// A completion ID is also the note ID, so replaying a completion cannot add a second star.
export function finishLesson(data, lesson, now = new Date().toISOString()) {
  if (data.notes.some((note) => note.id === lesson.id)) return data;
  const current = data.skills.find(
    (skill) => subjectKey(skill.name) === subjectKey(lesson.skill.name),
  );
  const skill = current || lesson.skill;
  const updated = {
    ...skill,
    sessions: (skill.sessions || 0) + 1,
    lastPracticed: now,
    ranking: lesson.framework.ranking,
    preference: lesson.framework.ranking[0],
  };
  const note = {
    id: lesson.id,
    skillId: skill.id,
    skill: skill.name,
    date: now,
    title: lesson.plan.title,
    text: lesson.answer || "",
    answer: lesson.answer || "",
    plan: lesson.plan,
    framework: lesson.framework,
    method: lesson.plan.method,
  };
  return {
    ...data,
    skills: current
      ? data.skills.map((s) => (s.id === skill.id ? updated : s))
      : [...data.skills, updated],
    notes: [note, ...data.notes],
    activeLesson: null,
  };
}

// Each completed lesson gets a unique position; no future stars are drawn.
export function starPosition(index) {
  if (index === 0) return [100, 72];
  const angle = index * 2.399963229728653;
  const radius = 22 * Math.sqrt(index);
  return [100 + Math.cos(angle) * radius, 72 + Math.sin(angle) * radius * 0.65];
}
