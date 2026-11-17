import { readFile } from "node:fs/promises";
import express from "express";
import { generatePlan } from "./client/src/planner.js";
import { validateAIPlan } from "./ai/plan-contract.js";
import {
  identity,
  sameOrigin,
  getUser,
  saveUser,
  initializeDatabase,
  closeDatabase,
} from "./database.js";
const AI_SYSTEM_PROMPT = await readFile(
  new URL("./ai/system-prompt.txt", import.meta.url),
  "utf8",
);
const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));
app.use("/api", sameOrigin);
app.get("/api/user", identity, getUser);
app.put("/api/user", identity, saveUser);
const hasGeminiFunction = Boolean(process.env.SUPABASE_GEMINI_FUNCTION_URL && process.env.SUPABASE_GEMINI_FUNCTION_TOKEN);
app.get("/api/status", (_, res) =>
  res.json({ aiConfigured: hasGeminiFunction || Boolean(process.env.OPENAI_API_KEY) }),
);
app.post("/api/plan", async (req, res) => {
  const { skill, minutes, preference, track, level, feedback, learning_mode } =
    req.body || {};
  if (
    typeof skill !== "string" ||
    !skill.trim() ||
    skill.length > 100 ||
    ![2, 5, 10, 15].includes(minutes) ||
    !["hobby", "academic"].includes(track) ||
    !["doing", "watching", "reading", "talking"].includes(preference) ||
    !["beginner", "some", "confident"].includes(level) ||
    (learning_mode !== undefined &&
      !["practical", "retrieval", "mind_mapping", "elaborative"].includes(
        learning_mode,
      ))
  )
    return res
      .status(400)
      .json({ error: "Please check your skill and learning preferences." });
  const input = {
    action: "task",
    ...(learning_mode ? { learning_mode } : {}),
    skill: skill.trim(),
    minutes,
    preference,
    track,
    level,
    feedback: typeof feedback === "string" ? feedback.slice(0, 600) : "",
  };
  const fallback = generatePlan(input);
  if (!hasGeminiFunction && !process.env.OPENAI_API_KEY)
    return res.json({ ...fallback, source: "curated" });
  try {
    let plan;
    if (hasGeminiFunction) {
      const response=await fetch(process.env.SUPABASE_GEMINI_FUNCTION_URL,{
        method:'POST',signal:AbortSignal.timeout(25000),headers:{'Content-Type':'application/json','x-gemini-proxy-token':process.env.SUPABASE_GEMINI_FUNCTION_TOKEN},body:JSON.stringify(input)
      });
      if(!response.ok)throw new Error('Gemini provider');
      plan=await response.json();
      // Preserve the Edge Function's existing five-field response contract.
      if(!plan||!['title','description','method','reflection'].every(k=>typeof plan[k]==='string'&&plan[k].length<600)||!Array.isArray(plan.steps)||plan.steps.length!==3||!plan.steps.every(step=>typeof step==='string'&&step.length<600))throw new Error('Invalid Gemini task');
    } else {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(20000),
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        response_format: { type: "json_object" },
        max_completion_tokens: 650,
        messages: [
          {
            role: "system",
            content: AI_SYSTEM_PROMPT,
          },
          { role: "user", content: JSON.stringify(input) },
        ],
      }),
    });
    if (!response.ok) throw new Error("provider");
    const body = await response.json();
    plan = validateAIPlan(JSON.parse(body.choices[0].message.content));
    }
    res.json({ ...plan, source: "ai" });
  } catch {
    res.json({
      ...fallback,
      source: "curated",
      notice:
        "Your AI guide is taking a breather. Here is a practice task you can use now.",
    });
  }
});
if (process.env.NODE_ENV === "production") {
  app.use(express.static("dist"));
  app.get("/{*path}", (_, res) =>
    res.sendFile(`${process.cwd()}/dist/index.html`),
  );
} else {
  const { createServer } = await import("vite");
  const vite = await createServer({
    server: { middlewareMode: true, allowedHosts: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
}
app.use((error, req, res, next) =>
  res
    .status(400)
    .json({ error: "That request could not be read. Please try again." }),
);
await initializeDatabase();
const server = app.listen(
  Number(process.env.PORT) || 3000,
  "0.0.0.0",
  (error) => {
    if (error) {
      console.error("Breadcrumbs could not bind its port.");
      process.exit(1);
    }
    console.log("Breadcrumbs is ready on port " + (process.env.PORT || 3000));
  },
);
async function shutdown() {
  server.close();
  await closeDatabase();
  process.exit(0);
}
process.once("SIGTERM", shutdown);
process.once("SIGINT", shutdown);
