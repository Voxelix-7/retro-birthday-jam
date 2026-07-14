// Cutscene shown after completing the chess-piece level: two characters
// playing chess at a table, looping until the player taps "Ok".
//
// TUNING: everything below is measured from the source art. If seating or
// board alignment looks slightly off once you see it running, these are the
// numbers to nudge — no other code should need to change.

const ASSET_PATHS = {
  table: "/sprites/chess_table.png",
  male: "/sprites/chess_male.png",
  female: "/sprites/chess_female.png",
  pieces: "/sprites/chess_pieces.png",
};

const MALE_FRAMES = 4; // smile, wink, reach, neutral
const FEMALE_FRAMES = 5; // normal, wink, normal, reach, normal
const PIECE_COLS = 5;
const PIECE_ROWS = 2; // row 0 = pawns, row 1 = rook/knight/bishop/queen/king

// Bounding box of the drawn (empty) board within chess_table.png's native
// 320x175 canvas.
const BOARD = { x: 130, y: 43, w: 60, h: 50, cols: 8, rows: 8 };

// Where each character sits, in chess_table.png's native coordinate space —
// this is the point their feet/seat should land on.
const SEATS = {
  male: { x: 47, y: 108 },
  female: { x: 272, y: 108 },
};
const SEAT_HEIGHT = 80; // target drawn height (px, table-native space) for a seated character

// Visible (non-transparent) content bounds measured inside a single frame of
// each sheet, used to line a character up with their seat regardless of
// whatever padding is baked into their sprite sheet.
const CONTENT = {
  male: { rowMin: 23, rowMax: 461, colMin: 29, colMax: 255 },
  female: { rowMin: 8, rowMax: 253, colMin: 24, colMax: 174 },
};

// Board col 0 = left edge (male's side), row 0 = far edge. Icon col/row
// refers to chess_pieces.png's grid, unrelated to the board coordinates.
const PIECE_A = { icon: { col: 0, row: 0 }, from: { col: 3, row: 6 }, to: { col: 3, row: 4 } }; // male's pawn, two-square advance
const PIECE_B = { icon: { col: 1, row: 1 }, from: { col: 1, row: 1 }, to: { col: 2, row: 3 } }; // female's knight

// Timeline (ms): expressions swap instantly at each step; a piece's position
// eases smoothly across its slide window instead of snapping. Loops back to
// t=0 after LOOP_MS.
const SCRIPT = [
  { t: 0, male: 0, female: 0 },
  { t: 800, male: 1, female: 0 },
  { t: 1600, male: 2, female: 0 },
  { t: 2800, male: 3, female: 0 },
  { t: 3100, male: 3, female: 1 },
  { t: 3900, male: 3, female: 3 },
  { t: 5100, male: 3, female: 4 },
];
const SLIDE_A_WINDOW = [1900, 2800]; // male's pawn slides
const SLIDE_B_WINDOW = [4200, 5100]; // female's knight slides
const LOOP_MS = 6400;

function loadImg(src) {
  return new Promise((res) => {
    const i = new Image();
    i.onload = () => res(i);
    i.src = src;
  });
}

function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function squareRect(col, row) {
  const sw = BOARD.w / BOARD.cols;
  const sh = BOARD.h / BOARD.rows;
  return { x: BOARD.x + sw * (col + 0.5), y: BOARD.y + sh * (row + 0.5), sw, sh };
}

function stepAt(elapsed) {
  let current = SCRIPT[0];
  for (const step of SCRIPT) {
    if (step.t <= elapsed) current = step;
    else break;
  }
  return current;
}

function slideProgress(window, elapsed) {
  if (elapsed <= window[0]) return 0;
  if (elapsed >= window[1]) return 1;
  return easeInOutQuad((elapsed - window[0]) / (window[1] - window[0]));
}

export async function startChessCutscene({ canvas }) {
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const [table, male, female, pieces] = await Promise.all([
    loadImg(ASSET_PATHS.table),
    loadImg(ASSET_PATHS.male),
    loadImg(ASSET_PATHS.female),
    loadImg(ASSET_PATHS.pieces),
  ]);

  canvas.width = table.width;
  canvas.height = table.height;

  function drawCharacter(img, frameCount, frameIndex, content, seat) {
    const frameW = img.width / frameCount;
    const frameH = img.height;
    const contentH = content.rowMax - content.rowMin;
    const scale = SEAT_HEIGHT / contentH;
    const contentCenterX = (content.colMin + content.colMax) / 2;
    const drawX = seat.x - contentCenterX * scale;
    const drawY = seat.y - content.rowMax * scale;
    ctx.drawImage(
      img,
      frameIndex * frameW, 0, frameW, frameH,
      drawX, drawY, frameW * scale, frameH * scale,
    );
  }

  function drawPiece(piece, progress) {
    const from = squareRect(piece.from.col, piece.from.row);
    const to = squareRect(piece.to.col, piece.to.row);
    const x = from.x + (to.x - from.x) * progress;
    const y = from.y + (to.y - from.y) * progress;
    const cellW = pieces.width / PIECE_COLS;
    const cellH = pieces.height / PIECE_ROWS;
    const scale = from.sh / cellH;
    const drawW = cellW * scale;
    const drawH = cellH * scale;
    ctx.drawImage(
      pieces,
      piece.icon.col * cellW, piece.icon.row * cellH, cellW, cellH,
      x - drawW / 2, y - drawH * 0.85, drawW, drawH,
    );
  }

  let running = true;
  const start = performance.now();

  function loop(now) {
    if (!running) return;
    const elapsed = (now - start) % LOOP_MS;
    const step = stepAt(elapsed);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(table, 0, 0);

    drawPiece(PIECE_A, slideProgress(SLIDE_A_WINDOW, elapsed));
    drawPiece(PIECE_B, slideProgress(SLIDE_B_WINDOW, elapsed));

    drawCharacter(male, MALE_FRAMES, step.male, CONTENT.male, SEATS.male);
    drawCharacter(female, FEMALE_FRAMES, step.female, CONTENT.female, SEATS.female);

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  return {
    stop() {
      running = false;
    },
  };
}
