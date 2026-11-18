import { generatePlan } from "./planner";
import { withAbort } from "../../shared/async.js";

const base = (import.meta.env.VITE_API_BASE_URL || "")
  .trim()
  .replace(/\/+$/, "");
const staticHost =
  import.meta.env.MODE === "pages" ||
  window.location.hostname.endsWith(".github.io");
export const hasBackend = Boolean(base) || !staticHost;

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || "").trim();
const supabasePublishableKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ""
).trim();
const supabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);
const turnstileSiteKey = (import.meta.env.VITE_TURNSTILE_SITE_KEY || "").trim();
let supabaseClientPromise;
let captchaRequest;

export function completeCaptchaChallenge(token) {
  captchaRequest?.resolve(token);
  captchaRequest = undefined;
}

export function cancelCaptchaChallenge() {
  captchaRequest?.reject(new Error("CAPTCHA check was cancelled."));
  captchaRequest = undefined;
  window.dispatchEvent(new Event("constellations:captcha-dismissed"));
}

function requestCaptchaToken(signal) {
  signal?.throwIfAborted();
  if (!turnstileSiteKey) return Promise.resolve(undefined);
  if (captchaRequest) return captchaRequest.promise;

  let resolve;
  let reject;
  const promise = new Promise((done, fail) => {
    resolve = done;
    reject = fail;
  });
  captchaRequest = { promise, resolve, reject };
  window.dispatchEvent(new Event("constellations:captcha-required"));
  const abort = () => {
    if (captchaRequest?.promise === promise) cancelCaptchaChallenge();
  };
  signal?.addEventListener("abort", abort, { once: true });
  return withAbort(promise, signal).finally(() =>
    signal?.removeEventListener("abort", abort),
  );
}

function getSupabaseClient() {
  if (!supabaseConfigured) throw new Error("Supabase is not configured.");
  if (!supabaseClientPromise) {
    supabaseClientPromise = import("@supabase/supabase-js").then(
      ({ createClient }) => createClient(supabaseUrl, supabasePublishableKey),
    );
  }
  return supabaseClientPromise;
}

async function ensureAnonymousSession(signal) {
  const supabase = await getSupabaseClient();
  signal?.throwIfAborted();
  const { data: current, error: sessionError } =
    await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  signal?.throwIfAborted();
  if (current.session) return current.session;

  const captchaToken = await requestCaptchaToken(signal);
  signal?.throwIfAborted();
  const { data, error } = await supabase.auth.signInAnonymously({
    options: captchaToken ? { captchaToken } : {},
  });
  if (error) throw error;
  if (!data.session) throw new Error("Could not start a Supabase session.");
  return data.session;
}

async function callSupabaseGemini(options = {}) {
  const supabase = await getSupabaseClient();
  await withAbort(ensureAnonymousSession(options.signal), options.signal);
  options.signal?.throwIfAborted();
  const input = JSON.parse(options.body || "{}");
  const { data, error } = await supabase.functions.invoke("gemini-learning", {
    body: input,
    signal: options.signal,
  });
  if (error) {
    const response = error.context;
    if (response && typeof response.clone === "function") {
      try {
        const details = await response.clone().json();
        if (details.code === "daily_limit") {
          return new Response(
            JSON.stringify({
              source: "pause",
              title: "A good place to pause.",
              description:
                "You took a thoughtful step with your learning today. Nice work. Take a little break and let those ideas settle; we’ll be here when you’re ready for another.",
              steps: [],
              method: "Rest is part of learning, too.",
              reflection: "What is one thing you feel proud of today?",
            }),
            { headers: { "Content-Type": "application/json" } },
          );
        }
      } catch {
        // The normal offline fallback below handles other function errors.
      }
    }
    throw error;
  }
  return new Response(JSON.stringify({ ...data, source: "ai" }), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function apiFetch(path, options = {}) {
  if (!hasBackend) {
    if (path === "/api/status")
      return new Response(
        JSON.stringify({ aiConfigured: supabaseConfigured, localOnly: true }),
        { headers: { "Content-Type": "application/json" } },
      );
    if (path === "/api/user")
      return new Response(
        JSON.stringify({ state: null, revision: 0, localOnly: true }),
        { headers: { "Content-Type": "application/json" } },
      );
    if (path === "/api/plan") {
      if (supabaseConfigured) return callSupabaseGemini(options);
      const input = JSON.parse(options.body || "{}");
      return new Response(
        JSON.stringify({ ...generatePlan(input), source: "curated" }),
        { headers: { "Content-Type": "application/json" } },
      );
    }
    throw Error("This feature needs a connected server.");
  }
  return fetch(base + path, {
    ...options,
    credentials: "include",
    signal: options.signal || AbortSignal.timeout(12000),
  });
}

// A missing server or unavailable AI should never block a small practice.
export async function planFetch(path, options = {}) {
  // A missing network response must not leave an empty sky indefinitely.
  const signal = options.signal
    ? AbortSignal.any([options.signal, AbortSignal.timeout(30000)])
    : AbortSignal.timeout(30000);
  try {
    const response = await withAbort(
      apiFetch(path, { ...options, signal }),
      signal,
    );
    if (!response.ok) throw Error();
    const data = await response.clone().json();
    if (data.source === "pause") return response;
    if (
      !["title", "description", "method", "reflection"].every(
        (key) =>
          typeof data[key] === "string" &&
          data[key].trim().length > 0 &&
          data[key].length < 600,
      ) ||
      !Array.isArray(data.steps) ||
      data.steps.length !== 3 ||
      !data.steps.every(
        (step) =>
          typeof step === "string" &&
          step.trim().length > 0 &&
          step.length < 600,
      )
    )
      throw Error();
    return response;
  } catch (error) {
    if (options.signal?.aborted) throw error;
    const input = JSON.parse(options.body || "{}");
    return new Response(
      JSON.stringify({
        ...generatePlan(input),
        source: "curated",
        notice: "Your guide is offline. Here is a practice you can use now.",
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  }
}
