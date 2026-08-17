// Level-4 finale screen helpers. Screen navigation / replay logic lives in
// app.js (it already owns all the screen-state); this file just handles the
// two self-contained visual bits: the cake's flicker loop, and drawing the
// two canvas icons.

import { drawEnvelope } from "/game.js";

// -------- Cake animation --------
// One sheet, one row: cake_sheet.png is 640x128 — 5 equal 128x128 frames.
// Frames 0-2 are the idle loop (looped until "Blow?" is clicked); frames 3-4
// are the blow animation (played once, then frozen on frame 4). Everything
// stays on this single image the whole time — the background-image never
// changes, only background-position-x moves within it. Same technique as
// every other multi-frame sprite in this project (Aya's idle loop, the run
// cycles, etc.) — one axis, one formula, nothing to swap or preload.
const CAKE_SRC = "/sprites/cake_sheet.png";
const CAKE_TOTAL_CELLS = 5;

const CAKE_IDLE_FRAMES = [0, 1, 2];
const CAKE_IDLE_FRAME_MS = 250;

const CAKE_BLOW_FRAMES = [3, 4];
const CAKE_BLOW_FRAME_MS = 300;

let cakeTimer = null;

function cellPositionX(cellIndex) {
  return `${(cellIndex * 100) / (CAKE_TOTAL_CELLS - 1)}%`;
}

function setCakeBackground(el) {
  el.style.backgroundImage = `url("${CAKE_SRC}")`;
  el.style.backgroundSize = `${CAKE_TOTAL_CELLS * 100}% 100%`;
}

export function startCakeFlicker() {
  stopCakeFlicker();
  const el = document.getElementById("finale-cake");
  if (!el) return;

  setCakeBackground(el);

  let i = 0;
  const step = () => {
    el.style.backgroundPositionX = cellPositionX(CAKE_IDLE_FRAMES[i]);
    cakeTimer = setTimeout(() => {
      i = (i + 1) % CAKE_IDLE_FRAMES.length;
      step();
    }, CAKE_IDLE_FRAME_MS);
  };
  step();
}

export function stopCakeFlicker() {
  if (cakeTimer) clearTimeout(cakeTimer);
  cakeTimer = null;
}

// Plays the 2-frame blow animation once, then freezes on the last frame —
// same one-shot/freeze pattern as the bat intro sprite. No image swap here
// at all, just moving further along the same already-loaded sheet.
export function blowOutCandle() {
  stopCakeFlicker();
  const el = document.getElementById("finale-cake");
  if (!el) return;

  setCakeBackground(el);
  el.style.backgroundPositionX = cellPositionX(CAKE_BLOW_FRAMES[0]);

  cakeTimer = setTimeout(() => {
    el.style.backgroundPositionX = cellPositionX(CAKE_BLOW_FRAMES[1]); // freeze here, forever
    cakeTimer = null;
  }, CAKE_BLOW_FRAME_MS);
}

// -------- Confetti (starts when the candle is blown out) --------
const CONFETTI_COLORS = ["#e94f8a", "#f0e6f0", "#7a3f8a", "#ffd166", "#06d6a0"];

let confettiRunning = false;
let confettiParticles = [];
let confettiResizeHandler = null;

function spawnConfettiParticle(canvas) {
  return {
    x: Math.random() * canvas.width,
    y: -20 - Math.random() * canvas.height,
    s: 4 + Math.random() * 4,
    vx: -0.3 + Math.random() * 0.6,
    vy: 0.4 + Math.random() * 0.5, // slow, gentle fall
    col: CONFETTI_COLORS[(Math.random() * CONFETTI_COLORS.length) | 0],
    r: Math.random() * Math.PI,
    vr: -0.04 + Math.random() * 0.08,
  };
}

export function startConfetti() {
  const canvas = document.getElementById("finale-confetti");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const resize = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  };
  resize();
  window.removeEventListener("resize", confettiResizeHandler);
  confettiResizeHandler = resize;
  window.addEventListener("resize", confettiResizeHandler);

  confettiParticles = Array.from({ length: 70 }, () => spawnConfettiParticle(canvas));
  confettiRunning = true;

  function loop() {
    if (!confettiRunning) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    confettiParticles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.r += p.vr;
      if (p.y > canvas.height + 10) Object.assign(p, spawnConfettiParticle(canvas), { y: -10 });
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.fillStyle = p.col;
      ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s);
      ctx.restore();
    });
    requestAnimationFrame(loop);
  }
  loop();
}

export function stopConfetti() {
  confettiRunning = false;
  const canvas = document.getElementById("finale-confetti");
  if (canvas) canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
}

// -------- Canvas-drawn icons (envelope + chess piece) --------
// Static, no animation needed — just centers each drawing function's shape
// in its small canvas. CD reuses the existing cd.png directly as an <img>,
// wired up alongside these in app.html/app.js.
export function drawFinaleIcons() {
  const envelopeCanvas = document.getElementById("finale-canvas-envelope");

  if (envelopeCanvas) {
    const ctx = envelopeCanvas.getContext("2d");
    ctx.clearRect(0, 0, envelopeCanvas.width, envelopeCanvas.height);
    drawEnvelope(ctx, (envelopeCanvas.width - 40) / 2, (envelopeCanvas.height - 28) / 2);
  }


}
