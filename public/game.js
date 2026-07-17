// Retro side-scroll chase game

// Set to true while testing to skip spawning the blob obstacles (cubes).
// The cat still chases you. Flip back to false before shipping.
const DEBUG_DISABLE_ENEMIES = true;

const CONFIG = {
  width: 960,
  height: 360,
  gravity: 0.6,
  jump: -11,
  playerSpeed: 3.4,
  catBaseSpeed: 2.7,
  catGain: 0.00012, // px/frame^2, ramps up over time
  levelLength: 5400, // fallback if no level config is passed in
  groundY: 300,
  frameMs: 125,
};

// Enemy positions as fractions along the level, so they scale with whatever
// level length is passed in (defaults preserve the original layout).
const ENEMY_FRACTIONS = [
  0.1296, 0.213, 0.2963, 0.3889, 0.4907, 0.5926, 0.7037, 0.8148, 0.9259,
];

function loadImg(src) {
  return new Promise((res) => {
    const i = new Image();
    i.onload = () => res(i);
    i.src = src;
  });
}

let running = false;

export async function startGame({ canvas, progressEl, onLose, onWin, startPaused, level }) {
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const levelLength = level?.length ?? CONFIG.levelLength;
  const winType = level?.winType ?? "cake";

  const [boyRun, boyStand, catRun, cake, cd] = await Promise.all([
    loadImg("/sprites/boy_run.png"),
    loadImg("/sprites/boy_stand.png"),
    loadImg("/sprites/cat_run.png"),
    winType === "cake" ? loadImg("/sprites/cake.png") : Promise.resolve(null),
    winType === "cd" ? loadImg("/sprites/cd.png") : Promise.resolve(null),
  ]);

  const keys = { left: false, right: false, jump: false };
  const keyHandler = (down) => (e) => {
    const k = e.key;
    if (k === "ArrowLeft" || k === "a" || k === "A") { keys.left = down; e.preventDefault(); }
    if (k === "ArrowRight" || k === "d" || k === "D") { keys.right = down; e.preventDefault(); }
    if (k === "ArrowUp" || k === "w" || k === "W" || k === " ") { keys.jump = down; e.preventDefault(); }
  };
  const kd = keyHandler(true), ku = keyHandler(false);
  window.addEventListener("keydown", kd);
  window.addEventListener("keyup", ku);
  const touchHandler = (e) => { keys[e.detail.key] = e.detail.down; };
  window.addEventListener("game-key", touchHandler);

  const player = { x: 60, y: CONFIG.groundY - 64, vy: 0, w: 44, h: 60, onGround: true, facing: 1, moving: false };
  const cat = { x: -80, y: CONFIG.groundY - 64, w: 44, h: 60 };

  // Enemies: bouncing blobs at fixed x positions along level
  const enemies = [];
  if (!DEBUG_DISABLE_ENEMIES) {
    ENEMY_FRACTIONS.forEach((f) => enemies.push({
      x: f * levelLength, baseY: CONFIG.groundY - 24, y: CONFIG.groundY - 24, w: 28, h: 24, phase: Math.random() * Math.PI * 2, amp: 10 + Math.random() * 6,
    }));
  }

  // Stars parallax
  const stars = Array.from({ length: 60 }, () => ({
    x: Math.random() * levelLength,
    y: Math.random() * (CONFIG.groundY - 40),
    s: Math.random() < 0.7 ? 2 : 3,
    p: 0.3 + Math.random() * 0.4,
  }));

  const targetX = levelLength - 80;
  const envelope = { baseY: CONFIG.groundY - 90, y: CONFIG.groundY - 90, phase: 0 };

  const boyRunFrames = Math.max(1, Math.floor(boyRun.width / 64));
  const catRunFrames = Math.max(1, Math.floor(catRun.width / 64));
  let frame = 0;
  let animT = 0;
  let boyFrame = 0, catFrame = 0;
  let camera = 0;
  let elapsed = 0;
  let catSpeed = CONFIG.catBaseSpeed;
  let done = false;
  running = true;
  let paused = !!startPaused;

  let last = performance.now();
  function loop(now) {
    if (!running) return;
    const dt = Math.min(40, now - last);
    last = now;

    // input
    let dx = 0;
    if (keys.left) dx -= 1;
    if (keys.right) dx += 1;
    if (paused && (dx !== 0 || keys.jump)) paused = false;
    if (paused) {
      draw();
      requestAnimationFrame(loop);
      return;
    }
    elapsed += dt;
    player.moving = dx !== 0;
    if (dx) player.facing = dx;
    player.x += dx * CONFIG.playerSpeed;
    if (player.x < 0) player.x = 0;
    if (player.x > levelLength) player.x = levelLength;

    // jump
    if (keys.jump && player.onGround) {
      player.vy = CONFIG.jump;
      player.onGround = false;
    }
    player.vy += CONFIG.gravity;
    player.y += player.vy;
    if (player.y >= CONFIG.groundY - player.h) {
      player.y = CONFIG.groundY - player.h;
      player.vy = 0;
      player.onGround = true;
    }

    // cat AI: always chases toward player at increasing speed
    catSpeed += CONFIG.catGain * dt;
    const dir = player.x - cat.x;
    cat.x += Math.sign(dir) * Math.min(catSpeed, Math.abs(dir));

    // enemies bounce
    enemies.forEach((e) => {
      e.phase += 0.03;
      e.y = e.baseY - Math.abs(Math.sin(e.phase)) * e.amp;
    });

    // envelope gently floats/bobs in place
    envelope.phase += 0.045;
    envelope.y = envelope.baseY + Math.sin(envelope.phase) * 8;

    // camera
    camera = Math.max(0, Math.min(player.x - 200, levelLength - CONFIG.width));

    // animation frames
    animT += dt;
    if (animT >= CONFIG.frameMs) {
      animT -= CONFIG.frameMs;
      boyFrame = (boyFrame + 1) % boyRunFrames;
      catFrame = (catFrame + 1) % catRunFrames;
    }

    // collisions
    if (!done) {
      // cat catch
      if (rectHit(player, cat)) return finish(false);
      // enemies
      for (const e of enemies) {
        if (rectHit(player, e)) return finish(false);
      }
      // target (cake, envelope, chess piece, or cd)
      if (player.x + player.w > targetX) return finish(true);
    }

    draw();

    frame++;
    requestAnimationFrame(loop);
  }

  function draw() {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);

    // stars parallax
    ctx.fillStyle = "#f0e6f0";
    stars.forEach((s) => {
      const sx = ((s.x - camera * s.p) % levelLength + CONFIG.width) % (CONFIG.width + 200) - 100;
      ctx.fillRect(sx, s.y, s.s, s.s);
    });

    // ground
    ctx.fillStyle = "#2d1a2e";
    ctx.fillRect(0, CONFIG.groundY, CONFIG.width, CONFIG.height - CONFIG.groundY);
    ctx.fillStyle = "#e94f8a";
    ctx.fillRect(0, CONFIG.groundY, CONFIG.width, 3);

    // target at end of level
    const targetScreenX = targetX - camera;
    if (targetScreenX > -160 && targetScreenX < CONFIG.width + 20) {
      if (winType === "envelope") {
        drawEnvelope(ctx, targetScreenX - 20, envelope.y);
      } else if (winType === "chesspiece") {
        drawChessPiece(ctx, targetScreenX - 11, envelope.y - 20);
      } else if (winType === "cd") {
        const cdSize = 40;
        ctx.drawImage(cd, targetScreenX - cdSize / 2, envelope.y - cdSize / 2, cdSize, cdSize);
      } else {
        // pedestal
        ctx.fillStyle = "#7a3f8a";
        ctx.fillRect(targetScreenX - 20, CONFIG.groundY - 12, 120, 12);
        const scale = 1.2;
        const cw = cake.width * scale, ch = cake.height * scale;
        ctx.drawImage(cake, targetScreenX - 20, CONFIG.groundY - 12 - ch, cw, ch);
      }
    }

    // enemies
    enemies.forEach((e) => {
      const ex = e.x - camera;
      if (ex < -40 || ex > CONFIG.width + 40) return;
      drawBlob(ctx, ex, e.y, e.w, e.h);
    });

    // cat
    drawSprite(ctx, catRun, catFrame, catRunFrames, cat.x - camera - 10, cat.y - 4, 64, 64, 1);

    // player
    if (player.moving || !player.onGround) {
      drawSprite(ctx, boyRun, boyFrame, boyRunFrames, player.x - camera - 10, player.y - 4, 64, 64, player.facing);
    } else {
      drawSprite(ctx, boyStand, 0, 1, player.x - camera - 10, player.y - 4, 64, 64, player.facing);
    }

    // progress
    const prog = Math.min(100, (player.x / targetX) * 100);
    progressEl.style.width = prog + "%";
  }

  function finish(won) {
    done = true;
    running = false;
    window.removeEventListener("keydown", kd);
    window.removeEventListener("keyup", ku);
    window.removeEventListener("game-key", touchHandler);
    setTimeout(() => (won ? onWin() : onLose()), 200);
  }

  requestAnimationFrame(loop);
}

function rectHit(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function drawSprite(ctx, img, frame, frames, x, y, fw, fh, facing) {
  const sw = img.width / frames;
  if (facing < 0) {
    ctx.save();
    ctx.translate(x + fw, y);
    ctx.scale(-1, 1);
    ctx.drawImage(img, frame * sw, 0, sw, img.height, 0, 0, fw, fh);
    ctx.restore();
  } else {
    ctx.drawImage(img, frame * sw, 0, sw, img.height, x, y, fw, fh);
  }
}

function drawBlob(ctx, x, y, w, h) {
  ctx.fillStyle = "#e94f8a";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "#2d1a2e";
  ctx.fillRect(x + 6, y + 6, 4, 4);
  ctx.fillRect(x + w - 10, y + 6, 4, 4);
  ctx.fillRect(x + 8, y + h - 8, w - 16, 3);
}

// Pixel-drawn floating envelope, used as the level-1 win target instead of
// the cake. x/y is the top-left of a roughly 40x28 envelope body.
function drawEnvelope(ctx, x, y) {
  const w = 40, h = 28;

  // soft glow behind it
  ctx.fillStyle = "rgba(240,230,240,0.15)";
  ctx.fillRect(x - 8, y - 8, w + 16, h + 16);

  // body
  ctx.fillStyle = "#f0e6f0";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "#2d1a2e";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);

  // flap
  ctx.fillStyle = "#e94f8a";
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w / 2, y + h / 2 - 2);
  ctx.lineTo(x + w, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // wax seal
  ctx.fillStyle = "#7a3f8a";
  ctx.fillRect(x + w / 2 - 3, y + h / 2 + 2, 6, 6);
}

// Pixel-drawn black chess piece (pawn silhouette), used as the level-2 win
// target. x/y is roughly the top-left of a 22x34 box.
function drawChessPiece(ctx, x, y) {
  const w = 22, h = 34;

  // soft glow behind it — needed for contrast since the piece itself is
  // black against the black game background.
  ctx.fillStyle = "rgba(240,230,240,0.18)";
  ctx.fillRect(x - 8, y - 8, w + 16, h + 16);

  ctx.fillStyle = "#000";
  ctx.strokeStyle = "#f0e6f0";
  ctx.lineWidth = 2;

  // base
  ctx.fillRect(x + 2, y + h - 8, w - 4, 8);
  ctx.strokeRect(x + 2, y + h - 8, w - 4, 8);

  // stem
  ctx.fillRect(x + w / 2 - 4, y + 14, 8, h - 22);
  ctx.strokeRect(x + w / 2 - 4, y + 14, 8, h - 22);

  // head
  ctx.beginPath();
  ctx.arc(x + w / 2, y + 10, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}
