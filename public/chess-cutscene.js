// Level-2 win cutscene: a single pre-drawn sprite sheet (table + chairs +
// both characters + chess pieces, all baked in per frame) cycled on a timer.
// No positioning math here on purpose — the art is already correct, this
// just flips through it.

const SHEET_PATH = "/sprites/chess_cutscene.png";
const FRAME_COUNT = 6;

// How long each frame stays on screen (ms) before advancing to the next.
// The last entry is unused (nothing follows the final frame, which just
// holds), kept only so the array visually lines up 1:1 with the frames.
const FRAME_DURATIONS = [450, 400, 2000, 450, 1000, 500];

function loadImg(src) {
  return new Promise((res) => {
    const i = new Image();
    i.onload = () => res(i);
    i.src = src;
  });
}

export async function createChessCutscene({ canvas }) {
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const sheet = await loadImg(SHEET_PATH);
  const frameW = sheet.width / FRAME_COUNT;
  const frameH = sheet.height;
  canvas.width = frameW;
  canvas.height = frameH;

  let timer = null;

  function drawFrame(index) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      sheet,
      index * frameW, 0, frameW, frameH,
      0, 0, frameW, frameH,
    );
  }

  function stop() {
    if (timer) clearTimeout(timer);
    timer = null;
  }

  // Plays through the sheet once, start to finish, then holds on the last
  // frame. Safe to call again later (e.g. from an "Again?" button) — it
  // just restarts from frame 0.
  function playOnce() {
    stop();
    let index = 0;
    drawFrame(index);
    const advance = () => {
      if (index >= FRAME_COUNT - 1) return; // hold on the last frame
      timer = setTimeout(() => {
        index++;
        drawFrame(index);
        advance();
      }, FRAME_DURATIONS[index]);
    };
    advance();
  }

  return { playOnce, stop };
}
