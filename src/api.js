import { generatePlan } from "./planner";

const base = (import.meta.env.VITE_API_BASE_URL || "")
  .trim()
  .replace(/\/+$/, "");
const staticHost =
  import.meta.env.MODE === "pages" ||
  window.location.hostname.endsWith(".github.io");
export const hasBackend = Boolean(base) || !staticHost;

export async function apiFetch(path, options = {}) {
  if (!hasBackend) {
    const body =
      path === "/api/status"
        ? { aiConfigured: false, localOnly: true }
        : path === "/api/user"
          ? { state: null, revision: 0, localOnly: true }
          : null;
    if (body)
      return new Response(JSON.stringify(body), {
        headers: { "Content-Type": "application/json" },
      });
    if (path === "/api/plan") {
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

// A missing server should never block onboarding or a small practice.
export async function planFetch(path, options = {}) {
  try {
    const response = await apiFetch(path, options);
    if (!response.ok) throw Error();
    const data = await response.clone().json();
    if (
      typeof data.title !== "string" ||
      !Array.isArray(data.steps) ||
      data.steps.length !== 3
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
