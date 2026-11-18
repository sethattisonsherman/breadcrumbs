import test from "node:test";
import assert from "node:assert/strict";
import { withAbort } from "../shared/async.js";

test("cancellation rejects a verification wait even before a network request begins", async () => {
  const controller = new AbortController();
  const waiting = withAbort(new Promise(() => {}), controller.signal);
  controller.abort();
  await assert.rejects(waiting, { name: "AbortError" });
});
test("timeout rejects an unfinished authentication operation", async () => {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(new DOMException("Timed out", "TimeoutError")),
    10,
  );
  try {
    await assert.rejects(withAbort(new Promise(() => {}), controller.signal), {
      name: "TimeoutError",
    });
  } finally {
    clearTimeout(timeout);
  }
});
test("successful operations preserve their result and already aborted signals reject", async () => {
  const controller = new AbortController();
  assert.equal(
    await withAbort(Promise.resolve("session"), controller.signal),
    "session",
  );
  controller.abort();
  await assert.rejects(
    withAbort(Promise.resolve("late session"), controller.signal),
    { name: "AbortError" },
  );
});
