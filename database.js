import pg from "pg";
import { readFile } from "node:fs/promises";
import { randomBytes, createHash } from "node:crypto";
if (!process.env.DATABASE_URL)
  throw new Error(
    "DATABASE_URL is required. Copy .env.example to .env and configure PostgreSQL.",
  );
const schema = process.env.DATABASE_SCHEMA || "public";
if (!/^[a-z][a-z0-9_]{0,62}$/.test(schema))
  throw new Error("Invalid database schema name.");
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  options: `-c search_path=${schema}`,
});
// Migrations are versioned with the application; no secrets belong in SQL files.
export async function initializeDatabase() {
  await pool.query(
    await readFile(
      new URL("./migrations/001_initial.sql", import.meta.url),
      "utf8",
    ),
  );
  await pool.query("DELETE FROM sessions WHERE expires_at < NOW()");
}
const hash = (t) => createHash("sha256").update(t).digest("hex");
export async function identity(req, res, next) {
  try {
    const token = req.headers.cookie
      ?.split(";")
      .map((x) => x.trim())
      .find((x) => x.startsWith("bc_session="))
      ?.slice(11);
    const session =
      token && /^[a-f0-9]{64}$/.test(token)
        ? (
            await pool.query(
              "SELECT user_id FROM sessions WHERE token_hash=$1 AND expires_at>NOW()",
              [hash(token)],
            )
          ).rows[0]
        : null;
    if (session) req.userId = session.user_id;
    else {
      const id = randomBytes(16).toString("hex");
      const raw = randomBytes(32).toString("hex");
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query("INSERT INTO users(id) VALUES($1)", [id]);
        await client.query(
          "INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,$3)",
          [hash(raw), id, new Date(Date.now() + 90 * 86400000)],
        );
        await client.query("COMMIT");
      } catch (e) {
        await client.query("ROLLBACK");
        throw e;
      } finally {
        client.release();
      }
      req.userId = id;
      const secure = req.secure || req.headers["x-forwarded-proto"] === "https";
      res.setHeader(
        "Set-Cookie",
        `bc_session=${raw}; HttpOnly; SameSite=Lax; Path=/; Max-Age=7776000${secure ? "; Secure" : ""}`,
      );
    }
    res.setHeader("Cache-Control", "no-store");
    next();
  } catch {
    res
      .status(503)
      .json({
        error: "Your database is taking a breather. Your browser copy is safe.",
      });
  }
}
export function sameOrigin(req, res, next) {
  try {
    const origin = req.headers.origin;
    if (
      origin &&
      new URL(origin).host !== req.headers.host &&
      new URL(origin).host !== req.headers["x-forwarded-host"]
    )
      return res
        .status(403)
        .json({ error: "This request must come from your Breadcrumbs app." });
    next();
  } catch {
    res.status(400).json({ error: "Invalid request origin." });
  }
}
function validState(s) {
  return (
    s &&
    s.version === 1 &&
    typeof s.onboarded === "boolean" &&
    s.profile &&
    ["doing", "watching", "reading", "talking"].includes(
      s.profile.preference,
    ) &&
    [2, 5, 10, 15].includes(s.profile.minutes) &&
    Array.isArray(s.skills) &&
    s.skills.length <= 100 &&
    s.skills.every(
      (k) =>
        typeof k.id === "string" &&
        k.id.length < 100 &&
        typeof k.name === "string" &&
        k.name.length > 0 &&
        k.name.length <= 100 &&
        Number.isInteger(k.sessions) &&
        k.sessions >= 0 &&
        Number.isInteger(k.confidence) &&
        k.confidence >= 0 &&
        ["hobby", "academic"].includes(k.track),
    ) &&
    Array.isArray(s.notes) &&
    s.notes.length <= 10000 &&
    s.notes.every(
      (n) =>
        typeof n.id === "string" &&
        typeof n.text === "string" &&
        n.text.length <= 5000 &&
        typeof n.skill === "string" &&
        typeof n.date === "string",
    )
  );
}
export async function getUser(req, res) {
  try {
    const row = (
      await pool.query(
        "SELECT state,revision FROM user_gardens WHERE user_id=$1",
        [req.userId],
      )
    ).rows[0];
    res.json({
      state: row?.state || null,
      revision: row?.revision || 0,
      storage: "postgresql",
    });
  } catch {
    res
      .status(503)
      .json({ error: "Your garden could not be loaded from the database." });
  }
}
export async function saveUser(req, res) {
  const { state, revision } = req.body || {};
  if (!validState(state) || !Number.isInteger(revision) || revision < 0)
    return res
      .status(400)
      .json({ error: "Your progress could not be validated." });
  const serialized = JSON.stringify(state);
  if (serialized.length > 1000000)
    return res
      .status(413)
      .json({
        error:
          "Please export your field notes; this garden is too large to save.",
      });
  try {
    // Compare-and-swap occurs inside one statement, including two simultaneous first saves.
    const result =
      revision === 0
        ? await pool.query(
            "INSERT INTO user_gardens(user_id,state,revision) VALUES($1,$2,1) ON CONFLICT DO NOTHING RETURNING revision",
            [req.userId, serialized],
          )
        : await pool.query(
            "UPDATE user_gardens SET state=$1,revision=revision+1,updated_at=NOW() WHERE user_id=$2 AND revision=$3 RETURNING revision",
            [serialized, req.userId, revision],
          );
    if (!result.rows.length)
      return res
        .status(409)
        .json({
          error:
            "This garden changed in another tab. Reload before making more changes.",
        });
    res.json({ revision: result.rows[0].revision, saved: true });
  } catch {
    res
      .status(503)
      .json({
        error:
          "Your database save did not complete. Your browser copy is safe.",
      });
  }
}
export async function closeDatabase() {
  await pool.end();
}
