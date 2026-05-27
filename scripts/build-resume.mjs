#!/usr/bin/env node
/**
 * build-resume.mjs
 *
 * Converts assets/resume/Edward_Kubiak_Resume.docx → public/Edward_Kubiak_Resume.pdf
 * using LibreOffice (soffice), then copies CAST_Portfolio_OnePager.pdf into public/.
 *
 * Usage:
 *   npm run build-resume
 *   npm run build-resume -- --force   # bypass mtime check
 *
 * Requires: LibreOffice installed at /Applications/LibreOffice.app/Contents/MacOS/soffice
 *   or `soffice` on PATH.
 *   Install: brew install --cask libreoffice
 */

import { execFileSync } from "node:child_process";
import { copyFileSync, statSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const SOFFICE_APP_PATH =
  "/Applications/LibreOffice.app/Contents/MacOS/soffice";

const SOURCE_DOCX = path.join(ROOT, "assets", "resume", "Edward_Kubiak_Resume.docx");
const SOURCE_PDF = path.join(ROOT, "assets", "resume", "CAST_Portfolio_OnePager.pdf");
const OUT_PDF = path.join(ROOT, "public", "Edward_Kubiak_Resume.pdf");
const OUT_ONEPAGER = path.join(ROOT, "public", "CAST_Portfolio_OnePager.pdf");
const PUBLIC_DIR = path.join(ROOT, "public");

const args = process.argv.slice(2);
const force = args.includes("--force");

function findSoffice() {
  if (existsSync(SOFFICE_APP_PATH)) {
    return SOFFICE_APP_PATH;
  }
  // Try PATH fallback
  try {
    execFileSync("which", ["soffice"], { stdio: "pipe" });
    return "soffice";
  } catch {
    // not on PATH
  }
  console.error(
    "Error: LibreOffice not found.\n" +
      "  Tried: " + SOFFICE_APP_PATH + "\n" +
      "  Tried: soffice on PATH\n\n" +
      "  Install: brew install --cask libreoffice"
  );
  process.exit(1);
}

function shouldConvert() {
  if (force) return true;
  if (!existsSync(OUT_PDF)) return true;
  try {
    const srcMtime = statSync(SOURCE_DOCX).mtimeMs;
    const outMtime = statSync(OUT_PDF).mtimeMs;
    return srcMtime > outMtime;
  } catch {
    return true;
  }
}

function main() {
  // 1. Locate soffice
  const soffice = findSoffice();

  // 2. Convert .docx → .pdf (idempotent via mtime check)
  if (shouldConvert()) {
    console.log("Converting Edward_Kubiak_Resume.docx → public/Edward_Kubiak_Resume.pdf ...");
    try {
      execFileSync(
        soffice,
        ["--headless", "--convert-to", "pdf", SOURCE_DOCX, "--outdir", PUBLIC_DIR],
        { stdio: ["ignore", "inherit", "pipe"] }
      );
    } catch (err) {
      const stderr = err.stderr ? err.stderr.toString() : "";
      if (stderr) process.stderr.write(stderr);
      console.error("Error: soffice conversion failed (exit code " + (err.status ?? "?") + ")");
      process.exit(1);
    }
    // soffice names the output after the input basename: Edward_Kubiak_Resume.pdf
    if (!existsSync(OUT_PDF)) {
      console.error("Error: expected output not found at " + OUT_PDF);
      process.exit(1);
    }
    console.log("Resume PDF written: " + OUT_PDF);
  } else {
    console.log(
      "Skipping conversion — public/Edward_Kubiak_Resume.pdf is up to date. Pass --force to regenerate."
    );
  }

  // 3. Copy CAST one-pager (always overwrite — it's a binary copy, effectively free)
  copyFileSync(SOURCE_PDF, OUT_ONEPAGER);
  console.log("One-pager copied: " + OUT_ONEPAGER);

  console.log("Done.");
}

main();
