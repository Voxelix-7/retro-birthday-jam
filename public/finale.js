// Level-4 finale screen helpers. Screen navigation / replay logic lives in
// app.js (it already owns all the screen-state); this file just handles the
// two self-contained visual bits: the cake's flicker loop, and drawing the
// two canvas icons.

import { drawEnvelope, drawChessPiece } from "/game.js";

// -------- Cake flicker (2-frame candle loop) --------
// cake_animation.png is 6400x1600 — that's 4 equal 1600x1600 cells (only
// cells 0 and 1 actually have art; 2 and 3 are blank, reserved for later).
// Same CSS sprite trick as Aya's idle loop, but sized for the sheet's real
// cell count (4), not just the 2 we currently animate through — otherwise
// the browser squeezes all 4 cells into a 2-cell-wide space and everything
// looks horizontally squished.
const CAKE_SHEET_CELLS = 4;
const CAKE_FRAMES = [0, 1]; // which cell indices to actually cycle through
const CAKE_FRAME_DURATIONS = [700, 700]; // no timing was specified — a simple even flicker

const CAKE_SHEET_SRC = "/sprites/cake_animation.png";
const CAKE_BLOWN_SRC = "/sprites/cake_blown.png";

let cakeTimer = null;

function cellPositionX(cellIndex) {
  return `${(cellIndex * 100) / (CAKE_SHEET_CELLS - 1)}%`;
}

export function startCakeFlicker() {
  stopCakeFlicker();
  const el = document.getElementById("finale-cake");
  if (!el) return;

  // Re-assert the animated sheet in case a previous visit blew the candle
  // out (blowOutCandle swaps these to the static no-candle image).
  el.style.backgroundImage = `url("${CAKE_SHEET_SRC}")`;
  el.style.backgroundSize = "400% 100%";

  let i = 0;
  const step = () => {
    el.style.backgroundPositionX = cellPositionX(CAKE_FRAMES[i]);
    cakeTimer = setTimeout(() => {
      i = (i + 1) % CAKE_FRAMES.length;
      step();
    }, CAKE_FRAME_DURATIONS[i]);
  };
  step();
}

export function stopCakeFlicker() {
  if (cakeTimer) clearTimeout(cakeTimer);
  cakeTimer = null;
}

// Swaps the animated candle sheet for the static no-candle image (same
// 1600x1600 dimensions as one cell, so it drops in with no layout shift).
export function blowOutCandle() {
  stopCakeFlicker();
  const el = document.getElementById("finale-cake");
  if (!el) return;
  el.style.backgroundImage = `url("${CAKE_BLOWN_SRC}")`;
  el.style.backgroundSize = "100% 100%";
  el.style.backgroundPositionX = "0%";
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
