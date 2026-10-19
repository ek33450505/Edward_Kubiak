import { useEffect, useRef, useState } from "react";
import {
  mulberry32,
  fitContain,
  particleProgress,
  pulseAlpha,
  isValidPoints,
  STATUS_STYLE,
  INTRO_MS,
  PULSE_END_MS,
} from "../../lib/facilityField";

const SEED = 0x5eed;
const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

// Everything per-point is precomputed once into typed arrays, grouped by status so each
// frame switches fillStyle once per status.
function buildScene(data) {
  const n = data.count;
  const rand = mulberry32(SEED);
  const order = [...Array(n).keys()].sort((a, b) => data.pts[a * 3 + 2] - data.pts[b * 3 + 2]);
  const tx = new Float32Array(n);
  const ty = new Float32Array(n);
  const sx = new Float32Array(n);
  const sy = new Float32Array(n);
  const phase = new Float32Array(n);
  const groups = data.statuses.map(() => ({ from: 0, to: 0 }));
  order.forEach((src, i) => {
    tx[i] = data.pts[src * 3];
    ty[i] = data.pts[src * 3 + 1];
    sx[i] = rand() * data.w;
    sy[i] = rand() * data.h;
    phase[i] = rand() * Math.PI * 2;
    const g = groups[data.pts[src * 3 + 2]];
    if (g.to === g.from) g.from = i;
    g.to = i + 1;
  });
  return { tx, ty, sx, sy, phase, groups };
}

/**
 * Canvas facility field. Renders null until the points feed loads and validates, so any
 * failure leaves the parent's dot-grid placeholder in place.
 */
export default function FacilityField({ onReady }) {
  const canvasRef = useRef(null);
  const onReadyRef = useRef(onReady);
  const [data, setData] = useState(null);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    fetch(`${import.meta.env.BASE_URL}atlas-points.json`, { signal })
      .then((res) => {
        if (!res.ok) throw new Error(`atlas-points ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (!signal.aborted && isValidPoints(json)) setData(json);
      })
      .catch(() => {
        /* placeholder stays */
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    const ctx = canvas?.getContext("2d");
    if (!data || !parent || !ctx) return undefined;

    const scene = buildScene(data);
    const reducedMql = window.matchMedia?.(REDUCED_QUERY);
    const styles = data.statuses.map((name) => STATUS_STYLE[name]);
    const pulsing = data.statuses.map((name) => name === "under_construction");

    let reduced = reducedMql?.matches ?? false;
    let cw = 0;
    let ch = 0;
    let fit = { scale: 1, ox: 0, oy: 0 };
    let raf = 0;
    let t0 = null;
    let elapsed = 0;
    let done = reduced; // a load-time reduced-motion visit never animates, even if the preference flips
    let visible = true;
    let ready = false;
    let dprMql = null;

    // t is ms since the intro began; Infinity renders the settled, non-pulsing frame.
    function draw(t) {
      if (cw === 0 || ch === 0) return false;
      ctx.clearRect(0, 0, cw, ch);
      const d = Math.max(2, cw / 220);
      const { scale, ox, oy } = fit;
      const introDone = t >= INTRO_MS;
      const pulseOn = introDone && t < PULSE_END_MS;
      for (let s = 0; s < scene.groups.length; s++) {
        const { from, to } = scene.groups[s];
        if (from === to) continue;
        const { color, alpha } = styles[s];
        ctx.fillStyle = color;
        const animatePulse = pulsing[s] && pulseOn;
        if (introDone && !animatePulse) ctx.globalAlpha = alpha;
        for (let i = from; i < to; i++) {
          let x = scene.tx[i];
          let y = scene.ty[i];
          if (!introDone) {
            const p = particleProgress(t, x, data.w);
            x = scene.sx[i] + (x - scene.sx[i]) * p;
            y = scene.sy[i] + (y - scene.sy[i]) * p;
            ctx.globalAlpha = alpha * p;
          } else if (animatePulse) {
            ctx.globalAlpha = alpha * pulseAlpha(t, scene.phase[i]);
          }
          ctx.fillRect(ox + x * scale - d / 2, oy + y * scale - d / 2, d, d);
        }
      }
      ctx.globalAlpha = 1;
      return true;
    }

    function markReady() {
      if (ready) return;
      ready = true;
      onReadyRef.current?.();
    }

    function redraw() {
      if (draw(reduced || done ? Infinity : elapsed)) markReady();
    }

    function tick(now) {
      raf = 0;
      if (!visible || document.hidden || reduced || done) return;
      if (t0 === null) t0 = now;
      elapsed = now - t0;
      if (elapsed >= PULSE_END_MS) {
        done = true; // one settled frame, then the loop stops for good
        redraw();
        return;
      }
      redraw(); // draw before scheduling: a throw cannot repeat every frame
      raf = requestAnimationFrame(tick);
    }

    function start() {
      if (reduced || done || raf || !visible || document.hidden) return;
      raf = requestAnimationFrame(tick);
    }

    function stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    function applySize() {
      if (cw === 0 || ch === 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(cw * dpr);
      canvas.height = Math.round(ch * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      fit = fitContain(data.w, data.h, cw, ch);
      if (reduced || done || t0 !== null) redraw();
    }

    const ro = new ResizeObserver((entries) => {
      const box = entries[entries.length - 1]?.contentRect;
      if (!box) return;
      cw = Math.round(box.width);
      ch = Math.round(box.height);
      applySize();
    });
    ro.observe(parent); // fires once on observe, which sizes the first frame

    // A DPR change (zoom, moving between displays) leaves the backing store stale.
    function watchDpr() {
      dprMql?.removeEventListener?.("change", onDprChange);
      dprMql = window.matchMedia?.(`(resolution: ${window.devicePixelRatio || 1}dppx)`) ?? null;
      dprMql?.addEventListener?.("change", onDprChange);
    }
    function onDprChange() {
      applySize();
      watchDpr();
    }
    watchDpr();

    function onReducedChange(e) {
      reduced = e.matches;
      if (reduced) {
        stop();
        redraw();
      } else if (!done) {
        start();
      }
    }
    reducedMql?.addEventListener?.("change", onReducedChange);

    const io = new IntersectionObserver((entries) => {
      visible = entries[entries.length - 1]?.isIntersecting ?? true;
      if (visible) start();
      else stop();
    });
    io.observe(parent);

    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };
    document.addEventListener("visibilitychange", onVisibility);

    start(); // no-op under reduced motion: the ResizeObserver's first callback draws the static frame

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      dprMql?.removeEventListener?.("change", onDprChange);
      reducedMql?.removeEventListener?.("change", onReducedChange);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [data]);

  if (!data) return null;
  return <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 block h-full w-full" />;
}
