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

let cakeTimer = null;

function cellPositionX(cellIndex) {
  return `${(cellIndex * 100) / (CAKE_SHEET_CELLS - 1)}%`;
}

export function startCakeFlicker() {
  stopCakeFlicker();
  const el = document.getElementById("finale-cake");
  if (!el) return;

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
