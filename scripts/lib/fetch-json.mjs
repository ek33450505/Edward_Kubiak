import https from "node:https";
import http from "node:http";

// Resolves the parsed JSON body, or null on ANY failure; settles exactly once and
// never hangs: idle timeout, overall deadline, byte cap, and every abnormal close
// (truncated body, reset, error) all resolve null.
// Opt-in `withStatus`: resolves { status, body } instead (body = parsed JSON on a 200,
// null on any other status); the whole result is still null on transport-level failure.
export function fetchJson(url, { idleMs = 8000, deadlineMs = 15000, maxBytes = 5 * 1024 * 1024, headers = {}, withStatus = false } = {}) {
  return new Promise((resolve) => {
    let done = false;
    let req = null;
    let deadline = null;
    const finish = (value) => {
      if (done) return;
      done = true;
      clearTimeout(deadline);
      if (value === null) req?.destroy();
      resolve(value);
    };
    deadline = setTimeout(() => finish(null), deadlineMs);
    try {
      const { protocol } = new URL(url);
      const get = protocol.toLowerCase() === "http:" ? http.get : https.get;
      req = get(url, { headers }, (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          return finish(withStatus ? { status: res.statusCode, body: null } : null);
        }
        const chunks = [];
        let bytes = 0;
        res.on("data", (c) => {
          bytes += c.length;
          if (bytes > maxBytes) return finish(null);
          chunks.push(c);
        });
        res.on("end", () => {
          try {
            const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
            finish(withStatus ? { status: 200, body } : body);
          } catch {
            finish(null);
          }
        });
        res.on("aborted", () => finish(null));
        res.on("error", () => finish(null));
        res.on("close", () => finish(null)); // no-op after a clean 'end' (already settled)
      });
    } catch {
      return finish(null);
    }
    req.on("error", () => finish(null));
    req.on("timeout", () => finish(null));
    req.setTimeout(idleMs);
  });
}
