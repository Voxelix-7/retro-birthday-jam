// Retro side-scroll chase game
const CONFIG = {
  width: 960,
  height: 360,
  gravity: 0.6,
  jump: -11,
  playerSpeed: 3.4,
  catBaseSpeed: 3.1,
  catGain: 0.00012, // px/frame^2, ramps up over time
  levelLength: 5400,
  groundY: 300,
  frameMs: 125,
};

function loadImg(src) {
  return new Promise((res) => {
    const i = new Image();
    i.onload = () => res(i);
    i.src = src;
  });
}

let running = false;

export async function startGame({ canvas, progressEl, onLose, onWin, startPaused }) {
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const [boyRun, boyStand, catRun, cake] = await Promise.all([
    loadImg("/sprites/boy_run.png"),
    loadImg("/sprites/boy_stand.png"),
    loadImg("/sprites/cat_run.png"),
    loadImg("/sprites/cake.png"),
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
  const enemyXs = [700, 1150, 1600, 2100, 2650, 3200, 3800, 4400, 5000];
  enemyXs.forEach((x) => enemies.push({
    x, baseY: CONFIG.groundY - 24, y: CONFIG.groundY - 24, w: 28, h: 24, phase: Math.random() * Math.PI * 2, amp: 10 + Math.random() * 6,
  }));

  // Stars parallax
  const stars = Array.from({ length: 60 }, () => ({
    x: Math.random() * CONFIG.levelLength,
    y: Math.random() * (CONFIG.groundY - 40),
    s: Math.random() < 0.7 ? 2 : 3,
    p: 0.3 + Math.random() * 0.4,
  }));

  const cakeX = CONFIG.levelLength - 80;

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
    if (player.x > CONFIG.levelLength) player.x = CONFIG.levelLength;

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

    // camera
    camera = Math.max(0, Math.min(player.x - 200, CONFIG.levelLength - CONFIG.width));

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
      // cake
      if (player.x + player.w > cakeX) return finish(true);
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
      const sx = ((s.x - camera * s.p) % CONFIG.levelLength + CONFIG.width) % (CONFIG.width + 200) - 100;
      ctx.fillRect(sx, s.y, s.s, s.s);
    });

    // ground
    ctx.fillStyle = "#2d1a2e";
    ctx.fillRect(0, CONFIG.groundY, CONFIG.width, CONFIG.height - CONFIG.groundY);
    ctx.fillStyle = "#e94f8a";
    ctx.fillRect(0, CONFIG.groundY, CONFIG.width, 3);

    // cake at end
    const cakeScreenX = cakeX - camera;
    if (cakeScreenX > -160 && cakeScreenX < CONFIG.width + 20) {
      // pedestal
      ctx.fillStyle = "#7a3f8a";
      ctx.fillRect(cakeScreenX - 20, CONFIG.groundY - 12, 120, 12);
      const scale = 1.2;
      const cw = cake.width * scale, ch = cake.height * scale;
      ctx.drawImage(cake, cakeScreenX - 20, CONFIG.groundY - 12 - ch, cw, ch);
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
    const prog = Math.min(100, (player.x / cakeX) * 100);
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
