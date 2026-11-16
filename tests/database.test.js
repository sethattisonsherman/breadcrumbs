import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import pg from "pg";
import { randomBytes } from "node:crypto";

let server, admin;
const schema = "bc_test_" + randomBytes(6).toString("hex");
const origin = "http://127.0.0.1:3107";
const initial = {
  version: 1,
  skills: [],
  notes: [],
  profile: { preference: "doing", minutes: 5 },
  onboarded: false,
};
test.before(async () => {
  admin = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  await admin.query(`CREATE SCHEMA ${schema}`);
  server = spawn(process.execPath, ["server.js"], {
    env: {
      ...process.env,
      PORT: "3107",
      DATABASE_SCHEMA: schema,
      OPENAI_API_KEY: "",
      NODE_ENV: "production",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(Error("Server did not start")),
      15000,
    );
    server.stdout.on("data", (b) => {
      if (b.toString().includes("Breadcrumbs is ready")) {
        clearTimeout(timeout);
        resolve();
      }
    });
    server.on("error", reject);
  });
});
test.after(async () => {
  server?.kill();
  await new Promise((r) => server?.once("exit", r));
  await admin.query(`DROP SCHEMA ${schema} CASCADE`);
  await admin.end();
});
async function session() {
  const r = await fetch(origin + "/api/user");
  const cookie = r.headers.get("set-cookie").split(";")[0];
  return { cookie, body: await r.json(), headers: r.headers };
}
async function save(cookie, state, revision) {
  return fetch(origin + "/api/user", {
    method: "PUT",
    headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify({ state, revision }),
  });
}
test("private sessions isolate user data and persist a garden", async () => {
  const alice = await session(),
    bob = await session();
  assert.match(alice.headers.get("set-cookie"), /HttpOnly; SameSite=Lax/);
  assert.equal(alice.body.storage, "postgresql");
  const state = {
    ...initial,
    onboarded: true,
    skills: [
      {
        id: "a",
        name: "Sketching",
        sessions: 1,
        confidence: 1,
        track: "hobby",
      },
    ],
  };
  assert.equal((await save(alice.cookie, state, 0)).status, 200);
  const a = await (
    await fetch(origin + "/api/user", { headers: { cookie: alice.cookie } })
  ).json();
  assert.equal(a.state.skills[0].name, "Sketching");
  assert.equal(a.revision, 1);
  const b = await (
    await fetch(origin + "/api/user", { headers: { cookie: bob.cookie } })
  ).json();
  assert.equal(b.state, null);
});
test("stale updates cannot overwrite a more recent save", async () => {
  const a = await session();
  assert.equal((await save(a.cookie, initial, 0)).status, 200);
  assert.equal((await save(a.cookie, initial, 0)).status, 409);
});
test("invalid state and cross-site writes are rejected", async () => {
  const a = await session();
  assert.equal(
    (await save(a.cookie, { ...initial, skills: "bad" }, 0)).status,
    400,
  );
  const r = await fetch(origin + "/api/user", {
    method: "PUT",
    headers: {
      Origin: "https://other-site.example",
      "Content-Type": "application/json",
      cookie: a.cookie,
    },
    body: JSON.stringify({ state: initial, revision: 0 }),
  });
  assert.equal(r.status, 403);
});
test("AI-free mode gives usable tasks and validates requests", async () => {
  const r = await fetch(origin + "/api/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      skill: "Biology",
      track: "academic",
      preference: "reading",
      minutes: 2,
      level: "beginner",
    }),
  });
  const plan = await r.json();
  assert.equal(plan.source, "curated");
  assert.equal(plan.steps.length, 3);
  assert.match(plan.method, /Retrieval/);
  const bad = await fetch(origin + "/api/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ skill: "", minutes: -1 }),
  });
  assert.equal(bad.status, 400);
});
test("simultaneous first saves allow exactly one writer", async () => {
  const a = await session();
  const writes = await Promise.all([
    save(a.cookie, initial, 0),
    save(a.cookie, { ...initial, onboarded: true }, 0),
  ]);
  assert.deepEqual(writes.map((r) => r.status).sort(), [200, 409]);
});
