// Level-4 finale screen helpers. Screen navigation / replay logic lives in
// app.js (it already owns all the screen-state); this file just handles the
// two self-contained visual bits: the cake's flicker loop, and drawing the
// two canvas icons.

import { drawEnvelope, drawChessPiece } from "/game.js";

// -------- Cake flicker (2-frame candle loop) --------
// Same CSS sprite trick as Aya's idle loop: background-size 200% (2 frames),
// background-position-x of 0%/100% lands exactly on frame 0/1.
const CAKE_FRAME_COUNT = 2;
const CAKE_FRAME_DURATIONS = [700, 700]; // no timing was specified — a simple even flicker

let cakeTimer = null;

export function startCakeFlicker() {
  stopCakeFlicker();
  const el = document.getElementById("finale-cake");
  if (!el) return;

  let index = 0;
  const step = () => {
    el.style.backgroundPositionX = index === 0 ? "0%" : "100%";
    cakeTimer = setTimeout(() => {
      index = (index + 1) % CAKE_FRAME_COUNT;
      step();
    }, CAKE_FRAME_DURATIONS[index]);
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
