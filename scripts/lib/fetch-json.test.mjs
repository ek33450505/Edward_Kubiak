import http from "node:http";

import { describe, it, expect, afterEach } from "vitest";

import { fetchJson } from "./fetch-json.mjs";

describe("fetchJson", () => {
  let server;
  const serve = async (handler) => {
    server = http.createServer(handler);
    await new Promise((r) => server.listen(0, "127.0.0.1", r));
    return `http://127.0.0.1:${server.address().port}/`;
  };
  afterEach(async () => {
    if (!server) return;
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
    server = null;
  });

  it("parses a 200 JSON body", async () => {
    const url = await serve((_, res) => res.end(JSON.stringify([{ a: 1 }])));
    expect(await fetchJson(url)).toEqual([{ a: 1 }]);
  });

  it("resolves null on a non-200", async () => {
    const url = await serve((_, res) => {
      res.statusCode = 503;
      res.end("[]");
    });
    expect(await fetchJson(url)).toBeNull();
  });

  it("resolves null on invalid JSON", async () => {
    const url = await serve((_, res) => res.end("not json"));
    expect(await fetchJson(url)).toBeNull();
  });

  it("resolves null (and settles) on a truncated body", async () => {
    const url = await serve((_, res) => {
      res.writeHead(200, { "Content-Length": 5000 });
      res.write("[1,2,");
      setTimeout(() => res.socket.destroy(), 20);
    });
    const t0 = Date.now();
    expect(await fetchJson(url, { idleMs: 5000, deadlineMs: 5000 })).toBeNull();
    expect(Date.now() - t0).toBeLessThan(2000);
  });

  it("resolves null when a slow drip outlasts the overall deadline", async () => {
    let timer;
    const url = await serve((_, res) => {
      res.writeHead(200);
      res.write("[");
      timer = setInterval(() => res.write("1,"), 30);
      res.on("close", () => clearInterval(timer));
    });
    const t0 = Date.now();
    expect(await fetchJson(url, { idleMs: 5000, deadlineMs: 200 })).toBeNull();
    expect(Date.now() - t0).toBeLessThan(1500);
  });

  it("resolves null when the body exceeds the byte cap", async () => {
    const url = await serve((_, res) => res.end(JSON.stringify(Array(500).fill(7))));
    expect(await fetchJson(url, { maxBytes: 100 })).toBeNull();
  });

  it("passes custom headers through", async () => {
    let seen;
    const url = await serve((req, res) => {
      seen = req.headers["x-test"];
      res.end("[]");
    });
    await fetchJson(url, { headers: { "X-Test": "yes" } });
    expect(seen).toBe("yes");
  });

  it("resolves null when the connection is refused", async () => {
    expect(await fetchJson("http://127.0.0.1:1/")).toBeNull();
  });
});
