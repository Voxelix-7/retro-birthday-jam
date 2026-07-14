// PWA + screen state machine + bat intro + level map + game + game over + level end
import { startGame } from "/game.js";
import { LEVELS } from "/levels.js";
import { startChessCutscene } from "/chess-cutscene.js";

const PASSWORD = "wanwan";
const PROGRESS_KEY = "wanwan-progress";

const screens = Array.from(document.querySelectorAll(".screen"));
function show(name) {
  screens.forEach((s) => s.classList.toggle("active", s.dataset.screen === name));
}

// -------- Progress (persisted) --------
function loadProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return { unlocked: 1, completed: [] };
    const parsed = JSON.parse(raw);
    return {
      unlocked: typeof parsed.unlocked === "number" ? parsed.unlocked : 1,
      completed: Array.isArray(parsed.completed) ? parsed.completed : [],
    };
  } catch {
    return { unlocked: 1, completed: [] };
  }
}
function saveProgress(progress) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // localStorage unavailable (private mode, etc) — progress just won't persist.
  }
}
function getLevelState(id) {
  const progress = loadProgress();
  if (progress.completed.includes(id)) return "completed";
  if (id <= progress.unlocked) return "unlocked";
  return "locked";
}
function completeLevel(id) {
  const progress = loadProgress();
  if (!progress.completed.includes(id)) progress.completed.push(id);
  progress.unlocked = Math.max(progress.unlocked, id + 1);
  saveProgress(progress);
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
  show("map");
  renderMap();
  startMapStars();
});

// -------- Level map --------
const ROMAN = { 1: "I", 2: "II", 3: "III", 4: "IV" };
function toRoman(num) {
  return ROMAN[num] || String(num);
}

function renderMap() {
  const container = document.getElementById("level-path");
  container.innerHTML = "";
  LEVELS.forEach((level) => {
    const state = getLevelState(level.id);
    const node = document.createElement("button");
    node.type = "button";
    node.className = `level-node level-node--${state}`;
    node.disabled = state === "locked";
    node.innerHTML = `
      <span class="level-node-frame">
        <span class="level-node-num">${toRoman(level.id)}</span>
        ${state === "locked" ? '<span class="level-node-lock"></span>' : ""}
        ${state === "completed" ? '<span class="level-node-check">&#10003;</span>' : ""}
      </span>
      <span class="level-node-label">${level.name}</span>
    `;
    if (state !== "locked") {
      node.addEventListener("click", () => enterLevel(level.id));
    }
    container.appendChild(node);
  });
}

const comingSoonOverlay = document.getElementById("comingsoon-overlay");
document.getElementById("comingsoon-close").addEventListener("click", () => {
  comingSoonOverlay.classList.add("hidden");
});

function enterLevel(id) {
  const level = LEVELS.find((l) => l.id === id);
  if (!level) return;
  if (!level.hasContent) {
    comingSoonOverlay.classList.remove("hidden");
    return;
  }
  currentLevel = level;
  show("intro");
  initIntro(level);
}

// Starfield background for the map screen. Cheap no-op when the map isn't
// the active screen, so a single loop can just keep running.
let mapStarsStarted = false;
function startMapStars() {
  if (mapStarsStarted) return;
  mapStarsStarted = true;

  const canvas = document.getElementById("map-stars");
  const ctx = canvas.getContext("2d");
  const resize = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  };
  resize();
  window.addEventListener("resize", resize);

  const stars = Array.from({ length: 130 }, () => ({
    x: Math.random(),
    y: Math.random(),
    s: Math.random() < 0.8 ? 1 : 2,
    phase: Math.random() * Math.PI * 2,
    speed: 0.015 + Math.random() * 0.03,
  }));

  function loop() {
    const mapScreen = document.querySelector('[data-screen="map"]');
    if (mapScreen.classList.contains("active")) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach((st) => {
        st.phase += st.speed;
        const alpha = 0.3 + 0.7 * Math.abs(Math.sin(st.phase));
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fillRect(st.x * canvas.width, st.y * canvas.height, st.s, st.s);
      });
    }
    requestAnimationFrame(loop);
  }
  loop();
}

// -------- Instructions (per level) --------
let currentLevel = null;
let currentSlide = 0;

const introSlidesEl = document.getElementById("intro-slides");
const introDotsEl = document.getElementById("intro-dots");
const introPrevBtn = document.getElementById("intro-prev");
const introNextBtn = document.getElementById("intro-next");
const introStartBtn = document.getElementById("intro-start");

function initIntro(level) {
  currentSlide = 0;

  introSlidesEl.innerHTML = level.slides
    .map((slide, i) => {
      const active = i === 0 ? " active" : "";
      if (slide.char) {
        return `<div class="slide${active}" data-slide="${i}">
          <div class="slide-split">
            <p class="slide-text">${slide.text}</p>
            <div class="slide-char char-${slide.char}"></div>
          </div>
        </div>`;
      }
      return `<div class="slide${active}" data-slide="${i}">
        <p class="slide-text center">${slide.text}</p>
      </div>`;
    })
    .join("");

  introDotsEl.innerHTML = level.slides
    .map((_, i) => `<button type="button" class="intro-dot${i === 0 ? " active" : ""}" data-dot="${i}"></button>`)
    .join("");
  introDotsEl.querySelectorAll(".intro-dot").forEach((dot) => {
    dot.addEventListener("click", () => {
      currentSlide = Number(dot.dataset.dot);
      updateIntroSlide();
    });
  });

  // Set the HUD's target label to match this level's win condition.
  const targetLabel = document.getElementById("hud-target-label");
  const TARGET_LABELS = { envelope: "Envelope", chesspiece: "Chess Piece", cake: "Cake" };
  targetLabel.textContent = TARGET_LABELS[level.winType] || "Cake";

  updateIntroSlide();
}

function updateIntroSlide() {
  const total = currentLevel.slides.length;
  introSlidesEl.querySelectorAll(".slide").forEach((s) => {
    s.classList.toggle("active", Number(s.dataset.slide) === currentSlide);
  });
  introDotsEl.querySelectorAll(".intro-dot").forEach((d) => {
    d.classList.toggle("active", Number(d.dataset.dot) === currentSlide);
  });
  introPrevBtn.disabled = currentSlide === 0;
  const onLastSlide = currentSlide === total - 1;
  introNextBtn.classList.toggle("hidden", onLastSlide);
  introStartBtn.classList.toggle("hidden", !onLastSlide);
}

introPrevBtn.addEventListener("click", () => {
  currentSlide = Math.max(0, currentSlide - 1);
  updateIntroSlide();
});
introNextBtn.addEventListener("click", () => {
  currentSlide = Math.min(currentLevel.slides.length - 1, currentSlide + 1);
  updateIntroSlide();
});
introStartBtn.addEventListener("click", () => {
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
    level: currentLevel,
    onLose: () => {
      show("gameover");
      startBlinkPattern();
    },
    onWin: () => {
      handleLevelWin();
    },
  });
}

document.getElementById("retry").addEventListener("click", () => {
  stopBlinkPattern();
  show("game");
  runGame();
});

// -------- Level end (fade to black -> ending -> back to map) --------
const gameFade = document.getElementById("game-fade");
const FADE_MS = 1500;
let activeCutscene = null;

function handleLevelWin() {
  gameFade.classList.add("active");
  setTimeout(() => {
    completeLevel(currentLevel.id);
    const ending = currentLevel.ending;
    if (ending.type === "cutscene") {
      show("chesscutscene");
      const canvas = document.getElementById("chess-canvas");
      startChessCutscene({ canvas }).then((controller) => {
        activeCutscene = controller;
      });
    } else {
      document.getElementById("levelend-text").textContent = ending.text;
      show("levelend");
    }
    gameFade.classList.remove("active");
  }, FADE_MS);
}

function backToMapFromEnding() {
  if (activeCutscene) {
    activeCutscene.stop();
    activeCutscene = null;
  }
  show("map");
  renderMap();
}

document.getElementById("levelend-ok").addEventListener("click", backToMapFromEnding);
document.getElementById("chesscutscene-ok").addEventListener("click", backToMapFromEnding);

// -------- Cat blink pattern (2 blinks @ 3fps, pause 2s, repeat) --------
const blinkEl = document.getElementById("blink-sprite");
let blinkTimer = null;
function startBlinkPattern() {
  stopBlinkPattern();
  const F0 = "0 0";
  // gameover .blink-sprite renders the sheet at 384x192 (2 frames of 192w),
  // finale .cat-blink-sprite renders it at 256x128 (2 frames of 128w).
  const F1_GAMEOVER = "-192px 0";
  const F1_FINALE = "-128px 0";
  const FRAME_MS = 333; // 3 fps
  const PAUSE_MS = 2000;
  // Sequence: F0->F1->F0->F1->F0 (2 blinks) then hold F0 for 2s
  const seq = [
    { open: true,  wait: FRAME_MS },
    { open: false, wait: FRAME_MS },
    { open: true,  wait: FRAME_MS },
    { open: false, wait: FRAME_MS },
    { open: false, wait: PAUSE_MS },
  ];
  let i = 0;
  const step = () => {
    const s = seq[i % seq.length];
    blinkEl.style.backgroundPosition = s.open ? F1_GAMEOVER : F0;
    if (finaleCat) finaleCat.style.backgroundPosition = s.open ? F1_FINALE : F0;
    i++;
    blinkTimer = setTimeout(step, s.wait);
  };
  step();
}
function stopBlinkPattern() {
  if (blinkTimer) clearTimeout(blinkTimer);
  blinkTimer = null;
}

// -------- Finale (reserved for after all chapters are complete) --------
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

// Focus input on load
input.focus();
