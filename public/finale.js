// Level-4 finale screen helpers. Screen navigation / replay logic lives in
// app.js (it already owns all the screen-state); this file just handles the
// two self-contained visual bits: the cake's flicker loop, and drawing the
// two canvas icons.

import { drawEnvelope, drawChessPiece } from "/game.js";

// -------- Cake animation --------
// Idle loop: cake_idle.png is 384x128 — 3 equal 128x128 frames, looping
// continuously at 250ms/frame.
const CAKE_IDLE_SRC = "/sprites/cake_idle.png";
const CAKE_IDLE_CELLS = 3;
const CAKE_IDLE_FRAME_MS = 250;

// Blow animation: cake_blow.png is 256x128 — 2 equal 128x128 frames, played
// ONCE then frozen on the last frame (same one-shot/freeze pattern used by
// the bat intro sprite: show frame 1, wait, show frame 2, stop — no loop).
const CAKE_BLOW_SRC = "/sprites/cake_blow.png";
const CAKE_BLOW_CELLS = 2;
const CAKE_BLOW_FRAME_MS = 300;

// Kick off both loads the moment this module is imported (page load time,
// via app.js's static import) — long before the player could ever actually
// reach the finale screen. Without this, switching background-image to a
// not-yet-fetched file causes a visible blink while it downloads/decodes.
[CAKE_IDLE_SRC, CAKE_BLOW_SRC].forEach((src) => {
  const img = new Image();
  img.src = src;
});

let cakeTimer = null;

// Both sheets use equal-width cells, so this same percentage formula works
// for either one — just pass its own total cell count.
function cellPositionX(cellIndex, totalCells) {
  return totalCells > 1 ? `${(cellIndex * 100) / (totalCells - 1)}%` : "0%";
}

export function startCakeFlicker() {
  stopCakeFlicker();
  const el = document.getElementById("finale-cake");
  if (!el) return;

  // Re-assert the idle sheet in case a previous visit blew the candle out
  // (blowOutCandle swaps these to the 2-frame blow sheet).
  el.style.backgroundImage = `url("${CAKE_IDLE_SRC}")`;
  el.style.backgroundSize = `${CAKE_IDLE_CELLS * 100}% 100%`;

  let i = 0;
  const step = () => {
    el.style.backgroundPositionX = cellPositionX(i, CAKE_IDLE_CELLS);
    cakeTimer = setTimeout(() => {
      i = (i + 1) % CAKE_IDLE_CELLS;
      step();
    }, CAKE_IDLE_FRAME_MS);
  };
  step();
}

export function stopCakeFlicker() {
  if (cakeTimer) clearTimeout(cakeTimer);
  cakeTimer = null;
}

// Swaps in the 2-frame blow sheet, plays it once, then freezes on the last
// frame. Both sheets render at identical on-screen dimensions (set by
// .finale-cake in CSS), so there's no visual size change on swap.
export function blowOutCandle() {
  stopCakeFlicker();
  const el = document.getElementById("finale-cake");
  if (!el) return;

  el.style.backgroundImage = `url("${CAKE_BLOW_SRC}")`;
  el.style.backgroundSize = `${CAKE_BLOW_CELLS * 100}% 100%`;
  el.style.backgroundPositionX = cellPositionX(0, CAKE_BLOW_CELLS); // frame 1

  cakeTimer = setTimeout(() => {
    el.style.backgroundPositionX = cellPositionX(1, CAKE_BLOW_CELLS); // frame 2, freeze here
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
  const chessCanvas = document.getElementById("finale-canvas-chess");

  if (envelopeCanvas) {
    const ctx = envelopeCanvas.getContext("2d");
    ctx.clearRect(0, 0, envelopeCanvas.width, envelopeCanvas.height);
    drawEnvelope(ctx, (envelopeCanvas.width - 40) / 2, (envelopeCanvas.height - 28) / 2);
  }

  if (chessCanvas) {
    const ctx = chessCanvas.getContext("2d");
    ctx.clearRect(0, 0, chessCanvas.width, chessCanvas.height);
    drawChessPiece(ctx, (chessCanvas.width - 22) / 2, (chessCanvas.height - 34) / 2);
  }
}
