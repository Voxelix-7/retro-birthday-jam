// PWA + screen state machine + bat intro + game over + finale
import { startGame } from "/game.js";

const PASSWORD = "wanwan";

const screens = Array.from(document.querySelectorAll(".screen"));
function show(name) {
  screens.forEach((s) => s.classList.toggle("active", s.dataset.screen === name));
}

// -------- Password --------
const form = document.getElementById("password-form");
const input = document.getElementById("password-input");
const hint = document.getElementById("password-hint");
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const val = input.value.trim().toLowerCase();
  if (val === PASSWORD) {
    hint.textContent = "";
    show("bat");
    playBatIntro();
  } else {
    hint.textContent = "nope. try again.";
    input.value = "";
    input.focus();
  }
});

// -------- Bat intro --------
const batSprite = document.getElementById("bat-sprite");
const batMessage = document.getElementById("bat-message");
const batText = document.getElementById("bat-text");
const getStarted = document.getElementById("get-started");

const BAT_TEXT =
  "Hello, this website was designed by me, the honored one, for Mr Batman of Helwan or so called _by me_, WanWan. If you're reading this then congrats you've accessed the top secret territory (enemy's territory). Should we get started?";

let batIntroDone = false;
function playBatIntro() {
  batSprite.classList.remove("in");
  batSprite.style.backgroundPosition = "0 0";
  batMessage.classList.add("hidden");
  getStarted.classList.add("hidden");
  batText.textContent = "";
  batIntroDone = false;

  // Smooth fade + scale in
  requestAnimationFrame(() => {
    setTimeout(() => batSprite.classList.add("in"), 30);
  });

  // 2-frame one-shot animation, freeze on frame 2
  const FRAME_MS = 250;
  setTimeout(() => {
    batSprite.style.backgroundPosition = "0 0"; // frame 1
    setTimeout(() => {
      batSprite.style.backgroundPosition = "-288px 0"; // frame 2, freeze
      batIntroDone = true;
    }, FRAME_MS);
  }, 800);
}

function openBatMessage() {
  if (!batIntroDone) return;
  if (!batMessage.classList.contains("hidden")) return;
  batMessage.classList.remove("hidden");
  typeText(batText, BAT_TEXT, 22, () => {
    getStarted.classList.remove("hidden");
  });
}

batSprite.addEventListener("click", openBatMessage);
batSprite.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") openBatMessage();
});

getStarted.addEventListener("click", () => {
  show("intro");
  initIntro();
});

// -------- Intro slides --------
let currentSlide = 0;
function initIntro() {
  currentSlide = 0;
  updateSlides();
}
function updateSlides() {
  document.querySelectorAll(".slide").forEach((s) => {
    s.classList.toggle("active", Number(s.dataset.slide) === currentSlide);
  });
}
document.querySelectorAll(".slide-next").forEach((btn) => {
  btn.addEventListener("click", () => {
    currentSlide = Math.min(currentSlide + 1, 3);
    updateSlides();
  });
});
document.getElementById("intro-start").addEventListener("click", () => {
  show("game");
  runGame({ startPaused: true });
});

// -------- Typewriter --------
function typeText(el, text, speed, cb) {
  el.textContent = "";
  let i = 0;
  const tick = () => {
    el.textContent = text.slice(0, ++i);
    if (i < text.length) setTimeout(tick, speed);
    else if (cb) cb();
  };
  tick();
}

// -------- Game --------
function runGame(opts = {}) {
  startGame({
    canvas: document.getElementById("game"),
    progressEl: document.getElementById("hud-progress"),
    startPaused: !!opts.startPaused,
    onLose: () => {
      show("gameover");
      startBlinkPattern();
    },
    onWin: () => {
      show("finale");
      startFinale();
    },
  });
}

document.getElementById("retry").addEventListener("click", () => {
  stopBlinkPattern();
  show("game");
  runGame();
});
document.getElementById("giveup").addEventListener("click", () => {
  stopBlinkPattern();
  show("bat");
  playBatIntro();
});

// -------- Cat blink pattern (2 blinks @ 3fps, pause 2s, repeat) --------
const blinkEl = document.getElementById("blink-sprite");
let blinkTimer = null;
function startBlinkPattern() {
  stopBlinkPattern();
  const F0 = "0 0";
  const F1 = "-128px 0";
  const FRAME_MS = 333; // 3 fps
  const PAUSE_MS = 2000;
  // Sequence: F0->F1->F0->F1->F0 (2 blinks) then hold F0 for 2s
  const seq = [
    { p: F1, wait: FRAME_MS },
    { p: F0, wait: FRAME_MS },
    { p: F1, wait: FRAME_MS },
    { p: F0, wait: FRAME_MS },
    { p: F0, wait: PAUSE_MS },
  ];
  let i = 0;
  const step = () => {
    const s = seq[i % seq.length];
    blinkEl.style.backgroundPosition = s.p;
    if (finaleCat) finaleCat.style.backgroundPosition = s.p;
    i++;
    blinkTimer = setTimeout(step, s.wait);
  };
  step();
}
function stopBlinkPattern() {
  if (blinkTimer) clearTimeout(blinkTimer);
  blinkTimer = null;
}

// -------- Finale --------
const finaleCat = document.getElementById("finale-cat");
const finaleText = document.getElementById("finale-text");
const FINAL_MSG =
  "Marwan Mohamed Ezzat Emam, Dinawy. Happy 18th birthday, don't get mad at me for trying to kill you. I hope you marry by 22 years old (because 20 doesn't make sense). Bye!";

function startFinale() {
  startBlinkPattern(); // reuse pattern for finale cat too
  typeText(finaleText, FINAL_MSG, 40);
  startConfetti();
}

function startConfetti() {
  const c = document.getElementById("confetti");
  const ctx = c.getContext("2d");
  const resize = () => {
    c.width = c.clientWidth;
    c.height = c.clientHeight;
  };
  resize();
  window.addEventListener("resize", resize);
  const colors = ["#e94f8a", "#f0e6f0", "#7a3f8a", "#ffd166", "#06d6a0"];
  const parts = Array.from({ length: 80 }, () => spawn(c));
  function spawn(c) {
    return {
      x: Math.random() * c.width,
      y: -20 - Math.random() * c.height,
      s: 4 + Math.random() * 4,
      vx: -1 + Math.random() * 2,
      vy: 1 + Math.random() * 2,
      col: colors[(Math.random() * colors.length) | 0],
      r: Math.random() * Math.PI,
      vr: -0.1 + Math.random() * 0.2,
    };
  }
  function loop() {
    ctx.clearRect(0, 0, c.width, c.height);
    parts.forEach((p) => {
      p.x += p.vx; p.y += p.vy; p.r += p.vr;
      if (p.y > c.height + 10) Object.assign(p, spawn(c), { y: -10 });
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

// -------- Touch controls --------
document.querySelectorAll(".tbtn").forEach((b) => {
  const key = b.dataset.key;
  const down = (e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent("game-key", { detail: { key, down: true } })); };
  const up = (e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent("game-key", { detail: { key, down: false } })); };
  b.addEventListener("touchstart", down, { passive: false });
  b.addEventListener("touchend", up, { passive: false });
  b.addEventListener("mousedown", down);
  b.addEventListener("mouseup", up);
  b.addEventListener("mouseleave", up);
});

// -------- Service worker --------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

// Focus input on load
input.focus();