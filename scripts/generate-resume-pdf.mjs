#!/usr/bin/env node
/**
 * generate-resume-pdf.mjs
 *
 * Renders the live resume page in print mode via Puppeteer and saves the
 * result to public/Edward_Kubiak_Resume.pdf.
 *
 * Usage:
 *   npm run generate-pdf
 *
 * Expects: `vite preview` to be running (or spawns it internally).
 * The script builds the site, starts vite preview on port 4173, renders
 * /resume?print=1, writes the PDF, then tears down.
 */

import { execSync, spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import path from "node:path";
import http from "node:http";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PDF_PATH = path.join(ROOT, "public", "Edward_Kubiak_Resume.pdf");
const PREVIEW_PORT = 4173;
const PREVIEW_URL = `http://localhost:${PREVIEW_PORT}`;
const RESUME_URL = `${PREVIEW_URL}/resume?print=1`;

// Resolve puppeteer relative to the project root so it works regardless of cwd.
const require = createRequire(import.meta.url);

async function waitForPort(port, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const ok = await new Promise((resolve) => {
      const req = http.get(`http://localhost:${port}`, (res) => {
        res.destroy();
        resolve(true);
      });
      req.on("error", () => resolve(false));
      req.setTimeout(500, () => {
        req.destroy();
        resolve(false);
      });
    });
    if (ok) return;
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`Port ${port} did not become ready within ${timeoutMs}ms`);
}

async function main() {
  // 1. Build the site so vite preview has fresh assets.
  console.log("Building site...");
  execSync("npm run build", { cwd: ROOT, stdio: "inherit" });

  // 2. Spawn vite preview.
  console.log(`Starting vite preview on port ${PREVIEW_PORT}...`);
  const preview = spawn("npx", ["vite", "preview", "--port", String(PREVIEW_PORT)], {
    cwd: ROOT,
    stdio: ["ignore", "pipe", "pipe"],
    detached: false,
  });

  const cleanup = () => {
    try { preview.kill("SIGTERM"); } catch {}
  };
  process.on("exit", cleanup);
  process.on("SIGINT", () => { cleanup(); process.exit(1); });
  process.on("SIGTERM", () => { cleanup(); process.exit(1); });

  try {
    // 3. Wait for preview to be ready.
    console.log("Waiting for preview server...");
    await waitForPort(PREVIEW_PORT);
    console.log("Preview server ready.");

    // 4. Launch Puppeteer.
    let puppeteer;
    try {
      puppeteer = require("puppeteer");
    } catch {
      // Fallback: try the ESM import path
      const mod = await import("puppeteer");
      puppeteer = mod.default;
    }

    // Use a fresh temp dir for each run to avoid Chrome singleton lock conflicts.
    const userDataDir = mkdtempSync(`${tmpdir()}/puppeteer-resume-`);

    // Puppeteer resolves executablePath to ~/.cache/puppeteer by default.
    // When PUPPETEER_CACHE_DIR is set to a non-default path, we must resolve
    // the executable ourselves so Chrome can actually be found.
    const cacheDir = process.env.PUPPETEER_CACHE_DIR || `${process.env.HOME}/.cache/puppeteer`;
    let executablePath;
    try {
      // Try the default resolution first (works when ~/.cache/puppeteer exists).
      executablePath = puppeteer.executablePath();
      // Verify it exists.
      const { statSync } = await import("node:fs");
      statSync(executablePath);
    } catch {
      // Fall back to locating Chrome in the custom cache dir.
      const { readdirSync: rds } = await import("node:fs");
      const platform = process.platform === "darwin"
        ? (process.arch === "arm64" ? "mac_arm" : "mac")
        : process.platform === "win32" ? "win64" : "linux64";
      const chromeDir = `${cacheDir}/chrome`;
      const versions = rds(chromeDir).filter((d) => d.startsWith(platform));
      if (!versions.length) throw new Error(`No Chrome found in ${chromeDir}`);
      const latest = versions.sort().at(-1);
      if (process.platform === "darwin") {
        executablePath = `${chromeDir}/${latest}/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;
      } else {
        executablePath = `${chromeDir}/${latest}/chrome-linux64/chrome`;
      }
    }

    const browser = await puppeteer.launch({
      headless: true,
      executablePath,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--no-first-run",
        "--disable-default-apps",
        "--disable-background-networking",
      ],
    });

    try {
      const page = await browser.newPage();

      // 5. Navigate to the print-mode resume.
      console.log(`Navigating to ${RESUME_URL}...`);
      await page.goto(RESUME_URL, { waitUntil: "networkidle0", timeout: 30_000 });

      // Allow fonts and animations to settle.
      await new Promise((r) => setTimeout(r, 1500));

      // 6. Generate PDF.
      console.log(`Writing PDF to ${PDF_PATH}...`);
      await page.pdf({
        path: PDF_PATH,
        format: "Letter",
        printBackground: false,
        margin: {
          top: "0.5in",
          bottom: "0.5in",
          left: "0.5in",
          right: "0.5in",
        },
      });

      console.log("PDF generated successfully.");
    } finally {
      await browser.close();
      // Clean up the temp user data dir.
      try { rmSync(userDataDir, { recursive: true, force: true }); } catch {}
    }
  } finally {
    cleanup();
  }
}

main().catch((err) => {
  console.error("PDF generation failed:", err.message);
  process.exit(1);
});
