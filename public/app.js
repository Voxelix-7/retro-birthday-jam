// PWA + screen state machine + bat intro + level map + game + game over + level end
import { startGame } from "/game.js";
import { LEVELS } from "/levels.js";
import { createChessCutscene } from "/chess-cutscene.js";
import { initMusicPlayer, stopMusicPlayer, startAyaIdle, stopAyaIdle } from "/music-player.js";
import { startCakeFlicker, stopCakeFlicker, drawFinaleIcons, blowOutCandle, startConfetti, stopConfetti } from "/finale.js";

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

  // Only level 4's HUD shows a target label ("Cake") — every other level
  // leaves the right side of the progress bar blank.
  document.getElementById("hud-target-label").textContent = level.id === 4 ? "Cake" : "";

  if (level.slides && level.slides.length) {
    show("intro");
    initIntro(level);
  } else {
    // No instructions for this level — go straight into the (frozen until
    // first move) game.
    show("game");
    runGame({ startPaused: true });
  }
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

// -------- Level end (win -> [confirm] -> fade to black -> ending -> map) --------
const gameFade = document.getElementById("game-fade");
const FADE_MS = 1500;
let activeCutscene = null;
// Where "Ok"/"Exit" sends the player back to once they're done with an
// ending. Normally "map"; replaying an ending from the finale screen (see
// replayEnding below) sets this to "finale" instead.
let returnTarget = "map";

const winConfirmOverlay = document.getElementById("win-confirm-overlay");
const winConfirmText = document.getElementById("win-confirm-text");
const winConfirmYesBtn = document.getElementById("win-confirm-yes");
const winConfirmNoBtn = document.getElementById("win-confirm-no");
let noShrinkLevel = 0;

function handleLevelWin() {
  const ending = currentLevel.ending;

  if (ending.confirm) {
    // Game stays frozen on its last frame behind this overlay until the
    // player opts in.
    noShrinkLevel = 0;
    winConfirmNoBtn.style.transform = "";
    winConfirmText.textContent = ending.confirm.text;
    winConfirmYesBtn.textContent = ending.confirm.yes || "Yes";
    if (ending.confirm.no) {
      winConfirmNoBtn.textContent = ending.confirm.no;
      winConfirmNoBtn.classList.remove("hidden");
    } else {
      winConfirmNoBtn.classList.add("hidden");
    }
    winConfirmOverlay.classList.remove("hidden");
    return;
  }

  fadeToEnding();
}

winConfirmYesBtn.addEventListener("click", () => {
  winConfirmOverlay.classList.add("hidden");
  fadeToEnding();
});

winConfirmNoBtn.addEventListener("click", () => {
  // Decorative only — shrinks a bit more each click, does nothing else.
  if (!currentLevel.ending.confirm?.noShrinks) return;
  noShrinkLevel++;
  const scale = Math.max(0.12, 1 - noShrinkLevel * 0.12);
  winConfirmNoBtn.style.transform = `scale(${scale})`;
});

function fadeToEnding() {
  const ending = currentLevel.ending;
  gameFade.classList.add("active");
  setTimeout(() => {
    completeLevel(currentLevel.id);
    if (ending.skipOnWin) {
      // This level's `ending` config exists only so the finale screen can
      // look up how to replay it later (e.g. level 2's chess cutscene) — a
      // normal win just goes straight back to the map, no ending screen.
      show("map");
      renderMap();
    } else if (ending.type === "cutscene") {
      show("chesscutscene");
      const canvas = document.getElementById("chess-canvas");
      createChessCutscene({ canvas }).then((controller) => {
        activeCutscene = controller;
        controller.playOnce();
      });
    } else if (ending.type === "musicplayer") {
      show("musicplayer");
      mountPlayerPanel(document.querySelector(".musicplayer-container"));
      initMusicPlayer();
      startAyaIdle();
    } else if (ending.type === "finale") {
      show("finale");
      initFinale();
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
  document.getElementById("musicplayer-ok").textContent = "Ok";

  if (returnTarget === "finale") {
    returnTarget = "map";
    show("finale");
  } else {
    // Only stop the music / Aya's idle loop when we're actually leaving for
    // the map — returning to the finale screen (e.g. after closing the
    // envelope or chess replay) should let any playing track keep going.
    stopMusicPlayer();
    stopAyaIdle();
    show("map");
    renderMap();
  }
}

document.getElementById("levelend-ok").addEventListener("click", backToMapFromEnding);
document.getElementById("chesscutscene-ok").addEventListener("click", backToMapFromEnding);
document.getElementById("chesscutscene-again").addEventListener("click", () => {
  if (activeCutscene) activeCutscene.playOnce();
});
document.getElementById("musicplayer-ok").addEventListener("click", backToMapFromEnding);


// -------- Cat blink pattern (2 blinks @ 3fps, pause 2s, repeat) --------
// Used by the game-over screen only now — the finale no longer has a cat.
const blinkEl = document.getElementById("blink-sprite");
let blinkTimer = null;
function startBlinkPattern() {
  stopBlinkPattern();
  const F0 = "0 0";
  const F1 = "-192px 0"; // .blink-sprite renders the sheet at 384x192 (2 frames of 192w)
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
    blinkEl.style.backgroundPosition = s.open ? F1 : F0;
    i++;
    blinkTimer = setTimeout(step, s.wait);
  };
  step();
}
function stopBlinkPattern() {
  if (blinkTimer) clearTimeout(blinkTimer);
  blinkTimer = null;
}

// -------- Finale (Chapter IV ending) --------
let finaleInitialized = false;

function initFinale() {
  startCakeFlicker();
  stopConfetti();

  const blowBtn = document.getElementById("finale-blow-btn");
  blowBtn.disabled = false;

  if (finaleInitialized) return;
  finaleInitialized = true;

  drawFinaleIcons();

  document.getElementById("finale-icon-envelope").addEventListener("click", () => replayEnding(1));
  document.getElementById("finale-icon-chess").addEventListener("click", () => replayEnding(2));
  document.getElementById("finale-icon-cd").addEventListener("click", () => replayEnding(3));
  document.getElementById("finale-icon-map").addEventListener("click", () => {
    stopCakeFlicker();
    stopConfetti();
    stopMusicPlayer();
    document.getElementById("finale-player-window").classList.add("hidden");
    show("map");
    renderMap();
  });
  blowBtn.addEventListener("click", () => {
    blowOutCandle();
    startConfetti();
    blowBtn.disabled = true;
  });
}

// Replays a completed level's ending from within the finale screen. Unlike
// a normal win, "Ok"/"Exit" here returns to the finale instead of the map
// (see returnTarget in the level-end section above).
// Shown only when replaying Chapter I's ending from the finale screen — kept
// separate from level 1's own ending.text (used for the normal, first-time
// win) since the finale shouldn't repeat that exact message.
const FINALE_ENVELOPE_TEXT =
  "PLACEHOLDER — swap in the real finale envelope message whenever you're ready.";

function replayEnding(levelId) {
  const level = LEVELS.find((l) => l.id === levelId);
  if (!level?.ending) return;
  const ending = level.ending;

  if (ending.type === "cutscene") {
    returnTarget = "finale";
    show("chesscutscene");
    const canvas = document.getElementById("chess-canvas");
    createChessCutscene({ canvas }).then((controller) => {
      activeCutscene = controller;
      controller.playOnce();
    });
  } else if (ending.type === "musicplayer") {
    // No full-screen takeover here — just the player itself, in a small
    // draggable window over the (still fully visible) finale screen.
    toggleFinalePlayerWindow();
  } else {
    returnTarget = "finale";
    document.getElementById("levelend-text").textContent =
      levelId === 1 ? FINALE_ENVELOPE_TEXT : ending.text;
    show("levelend");
  }
}

// -------- Finale's detachable music player window --------
// Reparents the single shared #player-panel (audio element stays put and
// keeps playing regardless of where the panel visually lives) into whatever
// container currently needs it — the full-screen musicplayer-container for
// a normal level-3 win, or this floating window when opened from finale.
function mountPlayerPanel(container) {
  const panel = document.getElementById("player-panel");
  if (panel && panel.parentElement !== container) {
    container.appendChild(panel);
  }
}

let finalePlayerPositioned = false;

function toggleFinalePlayerWindow() {
  const win = document.getElementById("finale-player-window");
  const isOpen = !win.classList.contains("hidden");

  if (isOpen) {
    // Closing never touches playback — the audio element isn't part of what
    // gets hidden, so it just keeps playing.
    win.classList.add("hidden");
    return;
  }

  mountPlayerPanel(document.getElementById("finale-player-body"));
  win.classList.remove("hidden");
  initMusicPlayer();

  if (!finalePlayerPositioned) {
    // First open only — start it roughly centered near the top. After this,
    // its position is whatever the player dragged it to.
    const rect = win.getBoundingClientRect();
    win.style.left = `${Math.max(8, (window.innerWidth - rect.width) / 2)}px`;
    win.style.top = `${Math.max(8, window.innerHeight * 0.15)}px`;
    finalePlayerPositioned = true;
  }
}

document.getElementById("finale-player-close").addEventListener("click", () => {
  document.getElementById("finale-player-window").classList.add("hidden");
});

// Drag support for the floating player window — Pointer Events cover mouse,
// touch, and pen with the same code, so no separate touch handling needed.
(function makeFinalePlayerDraggable() {
  const win = document.getElementById("finale-player-window");
  const handle = document.getElementById("finale-player-titlebar");
  let dragging = false;
  let startX, startY, startLeft, startTop;

  handle.addEventListener("pointerdown", (e) => {
    dragging = true;
    handle.setPointerCapture(e.pointerId);
    const rect = win.getBoundingClientRect();
    startX = e.clientX;
    startY = e.clientY;
    startLeft = rect.left;
    startTop = rect.top;
  });

  handle.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const rect = win.getBoundingClientRect();
    const maxLeft = Math.max(0, window.innerWidth - rect.width);
    const maxTop = Math.max(0, window.innerHeight - rect.height);
    const newLeft = Math.min(maxLeft, Math.max(0, startLeft + (e.clientX - startX)));
    const newTop = Math.min(maxTop, Math.max(0, startTop + (e.clientY - startY)));
    win.style.left = `${newLeft}px`;
    win.style.top = `${newTop}px`;
  });

  const endDrag = (e) => {
    if (!dragging) return;
    dragging = false;
    if (handle.hasPointerCapture(e.pointerId)) handle.releasePointerCapture(e.pointerId);
  };
  handle.addEventListener("pointerup", endDrag);
  handle.addEventListener("pointercancel", endDrag);
})();

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
