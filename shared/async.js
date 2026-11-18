// Authentication and verification can wait before an HTTP request exists.
// Give that whole operation the same cancellation boundary as the request.
export function withAbort(operation, signal) {
  if (!signal) return Promise.resolve(operation);
  return new Promise((resolve, reject) => {
    const abort = () =>
      reject(signal.reason || new DOMException("Aborted", "AbortError"));
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) abort();
    Promise.resolve(operation).then(
      (value) => {
        signal.removeEventListener("abort", abort);
        resolve(value);
      },
      (error) => {
        signal.removeEventListener("abort", abort);
        reject(error);
      },
    );
  });
}
