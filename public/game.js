// Retro side-scroll chase game

// Set to true while testing to skip spawning the blob obstacles (cubes).
// The cat still chases you. Flip back to false before shipping.
const DEBUG_DISABLE_ENEMIES = false;

// Original speed constants below were tuned as "pixels per rendered frame"
// assuming a steady ~60fps. FRAME_REF_MS converts that same tuning into a
// real-time rate so movement stays correct and in sync with the (already
// time-based) animation clock even if the actual frame rate drops — e.g.
// under device load. Without this, a slow frame would render the run-cycle
// animation ticking on schedule (it's clock based) while position updates
// stalled (they weren't), which is what caused the "legs move but the
// level doesn't" bug.
const FRAME_REF_MS = 1000 / 60;

const CONFIG = {
  width: 960,
  height: 360,
  gravity: 0.6,
  jump: -11,
  playerSpeed: 3.4,
  catBaseSpeed: 2.7,
  catGain: 0.00004, // fallback per-ms growth rate for the cat's chase speed, used if a level doesn't specify its own
  catGainCap: 0.3, // fallback ceiling on how much the cat's own growth term can add, used if a level doesn't specify its own
  speedRampPerSecond: 0.05, // fallback: how fast the overall pace multiplier grows per second of play, if a level doesn't specify its own
  maxSpeedMultiplier: 2.4, // hard cap on the pace multiplier so movement/animation never spirals into unplayable territory
  maxAnimationSpeedMultiplier: 1.65, // keep the run cycle readable after the pace reaches its cap
  levelLength: 5400, // fallback if no level config is passed in
  groundY: 300,
  frameMs: 125,
};

// Obstacle (cube) layout: instead of a fixed evenly-spaced list, positions
// are generated with shrinking gaps as the level progresses — so cubes
// show up more and more often the further/longer you've been running,
// mirroring the same "everything speeds up" feeling as the pace multiplier
// below. minSpacing is a floor so gaps never shrink past the player's
// maximum horizontal jump distance at the capped game speed.
function generateEnemyPositions(levelLength) {
  const positions = [];
  const startFraction = 0.12;
  const endFraction = 0.95;
  const minSpacing = 340;

  let x = levelLength * startFraction;
  let spacing = levelLength * 0.11;

  while (x < levelLength * endFraction) {
    positions.push(x);
    spacing = Math.max(minSpacing, spacing * 0.9);
    x += spacing;
  }
  return positions;
}

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

  // Per-level pace tuning, with sane fallbacks so a level missing these
  // fields still runs at the old default feel.
  const baseSpeedMultiplier = level?.baseSpeedMultiplier ?? 1;
  const speedRampPerSecond = level?.speedRampPerSecond ?? CONFIG.speedRampPerSecond;
  const catGainRate = level?.catGain ?? CONFIG.catGain;
  // Ceiling on the cat's own growth term (catGainRate * elapsed). Capped
  // strictly below CONFIG.playerSpeed - CONFIG.catBaseSpeed for every
  // level, so — as long as the player is actively moving — the cat's
  // effective speed can never permanently exceed the player's. The chase
  // still tightens the longer a level runs (harder to recover from a
  // mistake), it just can never become mathematically unwinnable.
  const catGainCap = level?.catGainCap ?? CONFIG.catGainCap;

  const [boyRun, boyStand, catRun, cake, chess, cd] = await Promise.all([
    loadImg("/sprites/boy_run.png"),
    loadImg("/sprites/boy_stand.png"),
    loadImg("/sprites/cat_run.png"),
    winType === "cake" ? loadImg("/sprites/cake_target.png") : Promise.resolve(null),
    winType === "chess" ? loadImg("/sprites/chess_piece.png") : Promise.resolve(null),
    winType === "cd" ? loadImg("/sprites/cd.png") : Promise.resolve(null)
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

  // Enemies: bouncing blobs, laid out with increasing density toward the
  // end of the level.
  const enemies = [];
  if (!DEBUG_DISABLE_ENEMIES) {
    generateEnemyPositions(levelLength).forEach((x) => enemies.push({
      x, baseY: CONFIG.groundY - 24, y: CONFIG.groundY - 24, w: 28, h: 24, phase: Math.random() * Math.PI * 2, amp: 10 + Math.random() * 6,
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
  let catSpeed = CONFIG.catBaseSpeed * baseSpeedMultiplier;
  // Overall pace multiplier — climbs with elapsed play time (Dino-game
  // style) and scales player speed, cat speed, cube bounce speed, and run
  // animation rate together, so everything visibly speeds up in lockstep.
  let speedMultiplier = baseSpeedMultiplier;
  let done = false;
  running = true;
  let paused = !!startPaused;

  let last = performance.now();
  function loop(now) {
    if (!running) return;
    const dt = Math.min(40, now - last);
    last = now;
    const dtScale = dt / FRAME_REF_MS;

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

    // Pace ramps up with elapsed time, capped at CONFIG.maxSpeedMultiplier.
    const elapsedSeconds = elapsed / 1000;
    speedMultiplier = Math.min(
      CONFIG.maxSpeedMultiplier,
      baseSpeedMultiplier + elapsedSeconds * speedRampPerSecond,
    );

    player.moving = dx !== 0;
    if (dx) player.facing = dx;
    // Time-scaled (dtScale) so real-world traversal speed stays correct
    // regardless of actual frame rate — see FRAME_REF_MS note up top.
    const previousPlayerX = player.x;
    player.x += dx * CONFIG.playerSpeed * speedMultiplier * dtScale;
    if (player.x < 0) player.x = 0;
    if (player.x > levelLength) player.x = levelLength;

    // jump
    if (keys.jump && player.onGround) {
      player.vy = CONFIG.jump;
      player.onGround = false;
    }
    player.vy += CONFIG.gravity * dtScale;
    player.y += player.vy * dtScale;
    if (player.y >= CONFIG.groundY - player.h) {
      player.y = CONFIG.groundY - player.h;
      player.vy = 0;
      player.onGround = true;
    }

    // cat AI: always chases toward player. Speed combines the cat's own
    // growth term (capped at catGainCap, see note above) with the same
    // global pace multiplier everything else uses — keeps her visible
    // right at the edge of the screen as the pace increases, without ever
    // letting her permanently out-pace the player.
    const catGrowth = Math.min(catGainRate * elapsed, catGainCap);
    catSpeed = (CONFIG.catBaseSpeed + catGrowth) * speedMultiplier;
    const dir = player.x - cat.x;
    const catStep = Math.min(catSpeed * dtScale, Math.abs(dir));
    cat.x += Math.sign(dir) * catStep;

    // enemies bounce — faster bounce cycle as the pace ramps up
    enemies.forEach((e) => {
      e.phase += 0.03 * speedMultiplier * dtScale;
      e.y = e.baseY - Math.abs(Math.sin(e.phase)) * e.amp;
    });

    // envelope gently floats/bobs in place
    envelope.phase += 0.045;
    envelope.y = envelope.baseY + Math.sin(envelope.phase) * 8;

    // camera
    camera = Math.max(0, Math.min(player.x - 200, levelLength - CONFIG.width));

    // Keep the cat visible on-screen once the camera actually starts
    // scrolling (camera > 0). While camera is still 0 — the opening
    // dead-zone before player.x > 200 — we deliberately do nothing here,
    // so cat.x stays at its off-screen starting value (-80) and she's not
    // visible yet, preserving the "she's behind you" entrance.
    //
    // Once the camera is moving, if the chase AI above has let her fall
    // behind the left edge of the screen (cat.x < camera + 10, where +10
    // matches the -10 draw offset used below so this lines her sprite's
    // left edge up with screen x = 0), ease her forward toward that edge
    // instead of snapping her there instantly. This is purely a visual
    // floor — it only ever pulls her forward when she's lagging behind the
    // camera, it never overrides catSpeed or moves her closer to the
    // player than the real chase AI already has her, so difficulty and
    // the win condition are untouched.
    if (camera > 0 && cat.x < camera + 10) {
      cat.x += (camera + 10 - cat.x) * 0.08;
    }

    // Animation gets a gentler cap than movement so the run cycle stays readable.
    const animationSpeedMultiplier = Math.min(
      speedMultiplier,
      CONFIG.maxAnimationSpeedMultiplier,
    );
    const dynamicFrameMs = CONFIG.frameMs / animationSpeedMultiplier;
    animT += dt;
    if (animT >= dynamicFrameMs) {
      animT -= dynamicFrameMs;
      boyFrame = (boyFrame + 1) % boyRunFrames;
      catFrame = (catFrame + 1) % catRunFrames;
    }

    // collisions
    if (!done) {
      // cat catch
      if (rectHit(player, cat)) return finish(false);
      for (const e of enemies) {
        if (sweptRectHit(player, e, previousPlayerX)) return finish(false);
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
      } else if (winType === "chess") {
        const chessSize = 40;
        ctx.drawImage(chess, targetScreenX - chessSize / 2, envelope.y - chessSize / 2, chessSize, chessSize);
      } else if (winType === "cd") {
        const cdSize = 40;
        ctx.drawImage(cd, targetScreenX - cdSize / 2, envelope.y - cdSize / 2, cdSize, cdSize);
      } else {
        // cake floats/bobs like the other targets
        const cakeSize = 44;
        ctx.drawImage(cake, targetScreenX - cakeSize / 2, envelope.y - cakeSize / 2, cakeSize, cakeSize);
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

function sweptRectHit(player, obstacle, previousX) {
  const sweptPlayer = {
    ...player,
    x: Math.min(previousX, player.x),
    w: player.w + Math.abs(player.x - previousX),
  };
  return rectHit(sweptPlayer, obstacle);
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
export function drawEnvelope(ctx, x, y) {
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