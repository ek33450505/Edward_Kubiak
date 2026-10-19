/**
 * facilityField.js — pure helpers for the hero facility-field canvas.
 * No DOM access here, so everything is unit-testable.
 */
import { STATUS_COLORS } from "./tokens";

// Deterministic PRNG: the intro scatter is identical on every load.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Largest uniform scale that fits (w x h) inside (cw x ch), centred.
export function fitContain(w, h, cw, ch) {
  const scale = Math.min(cw / w, ch / h);
  return { scale, ox: (cw - w * scale) / 2, oy: (ch - h * scale) / 2 };
}

export function easeOutCubic(t) {
  return 1 - (1 - t) ** 3;
}

// Animation timeline (ms since the first frame). The whole thing ends at PULSE_END_MS,
// well inside WCAG 2.2.2's 5 s allowance, after which one settled frame is drawn and the loop stops.
export const INTRO_DURATION = 1600;
export const INTRO_SPREAD = 900;
export const INTRO_MS = INTRO_DURATION + INTRO_SPREAD;
export const PULSE_MS = 2600;
export const PULSE_MIN = 0.45;
export const PULSE_END_MS = 4400;
const PULSE_FADE_MS = 600; // pulse envelope ramps in after the intro and out before the end

// Intro "survey sweep": each point starts after a delay proportional to x/w
// (west -> east), then eases over `duration`. Returns eased progress, 0..1.
export function particleProgress(t, x, w, duration = INTRO_DURATION, spread = INTRO_SPREAD) {
  const delay = (x / w) * spread;
  const raw = (t - delay) / duration;
  return easeOutCubic(Math.min(1, Math.max(0, raw)));
}

const clamp01 = (v) => Math.min(1, Math.max(0, v));

// Alpha of an under-construction point: pulses between PULSE_MIN and 1, with an envelope
// that eases in after the intro and back to exactly 1 at PULSE_END_MS so nothing pops.
export function pulseAlpha(t, phase) {
  const env = Math.min(clamp01((t - INTRO_MS) / PULSE_FADE_MS), clamp01((PULSE_END_MS - t) / PULSE_FADE_MS));
  const wave = 0.5 + 0.5 * Math.sin(((t % PULSE_MS) / PULSE_MS) * Math.PI * 2 + phase);
  return 1 - (1 - PULSE_MIN) * (1 - wave) * env;
}

export function isValidPoints(p) {
  if (!p || typeof p !== "object") return false;
  const { w, h, statuses, pts, count } = p;
  if (!(typeof w === "number" && w > 0 && Number.isFinite(w))) return false;
  if (!(typeof h === "number" && h > 0 && Number.isFinite(h))) return false;
  if (!Array.isArray(statuses) || !Array.isArray(pts)) return false;
  if (pts.length % 3 !== 0 || pts.length / 3 !== count) return false;
  if (!statuses.every((name) => typeof name === "string" && Object.hasOwn(STATUS_STYLE, name))) return false;
  for (let i = 0; i < pts.length; i++) {
    if (!Number.isInteger(pts[i])) return false;
  }
  for (let i = 2; i < pts.length; i += 3) {
    if (pts[i] < 0 || pts[i] >= statuses.length) return false;
  }
  return true;
}

// Status feed names -> token colour. The feed says `under_construction`; the token is `construction`.
const TOKEN_KEY = { under_construction: "construction" };

export const STATUS_STYLE = {
  operational: { color: STATUS_COLORS.operational, alpha: 1 },
  under_construction: { color: STATUS_COLORS[TOKEN_KEY.under_construction], alpha: 1 },
  permitted: { color: STATUS_COLORS.permitted, alpha: 1 },
  proposed: { color: STATUS_COLORS.proposed, alpha: 1 },
  cancelled: { color: STATUS_COLORS.cancelled, alpha: 0.55 },
};

const LABELS = {
  operational: "Operational",
  under_construction: "Under construction",
  permitted: "Permitted",
  proposed: "Proposed",
  cancelled: "Cancelled",
};

export function statusLabel(name) {
  return LABELS[name] ?? name;
}
