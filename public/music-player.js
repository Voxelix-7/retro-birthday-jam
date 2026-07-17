// Real-audio music player shown after level 3. Plain DOM + <audio> — no
// canvas here, since a clickable track list and a seekable progress bar are
// far simpler (and more accessible) as real HTML elements.

import { TRACKS } from "/album.js";

let initialized = false;
let currentIndex = 0;

let audioEl, progressBar, progressFill, elapsedEl, durationEl, titleEl, playPauseBtn, tracklistEl;

function formatTime(seconds) {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function renderTrackList() {
  tracklistEl.innerHTML = TRACKS.map(
    (t, i) => `
      <li class="player-track" data-index="${i}">
        <span class="player-track-title">${t.title}</span>
        <span class="player-track-duration">${t.duration}</span>
      </li>`,
  ).join("");

  tracklistEl.querySelectorAll(".player-track").forEach((li) => {
    li.addEventListener("click", () => {
      loadTrack(Number(li.dataset.index), { autoplay: true });
    });
  });
}

function updateActiveHighlight() {
  tracklistEl.querySelectorAll(".player-track").forEach((li) => {
    li.classList.toggle("player-track--active", Number(li.dataset.index) === currentIndex);
  });
}

function updatePlayPauseIcon() {
  const playing = !audioEl.paused && !audioEl.ended;
  playPauseBtn.textContent = playing ? "\u23F8" : "\u25B6";
  playPauseBtn.setAttribute("aria-label", playing ? "Pause" : "Play");
}

function loadTrack(index, { autoplay = false } = {}) {
  currentIndex = ((index % TRACKS.length) + TRACKS.length) % TRACKS.length;
  const track = TRACKS[currentIndex];

  titleEl.textContent = track.title;
  durationEl.textContent = track.duration;
  elapsedEl.textContent = "0:00";
  progressFill.style.width = "0%";
  updateActiveHighlight();

  audioEl.src = track.file;
  if (autoplay) {
    audioEl.play().catch(() => {
      // Autoplay blocked, or the mp3 just isn't uploaded yet — fine, the UI
      // stays in a correct paused state either way.
    });
  }
  updatePlayPauseIcon();
}

function togglePlayPause() {
  if (audioEl.paused) {
    audioEl.play().catch(() => {});
  } else {
    audioEl.pause();
  }
}

function seekFromClick(e) {
  if (!audioEl.duration) return;
  const rect = progressBar.getBoundingClientRect();
  const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
  audioEl.currentTime = frac * audioEl.duration;
}

export function initMusicPlayer() {
  audioEl = document.getElementById("player-audio");
  progressBar = document.getElementById("player-progress");
  progressFill = document.getElementById("player-progress-fill");
  elapsedEl = document.getElementById("player-elapsed");
  durationEl = document.getElementById("player-duration");
  titleEl = document.getElementById("player-tracktitle");
  playPauseBtn = document.getElementById("player-playpause");
  tracklistEl = document.getElementById("player-tracklist");

  if (initialized) {
    // Re-entering the screen on a later playthrough — just reset to track 1,
    // paused, rather than re-attaching every listener again.
    loadTrack(0);
    return;
  }
  initialized = true;

  renderTrackList();
  loadTrack(0);

  playPauseBtn.addEventListener("click", togglePlayPause);
  document.getElementById("player-prev").addEventListener("click", () => loadTrack(currentIndex - 1, { autoplay: true }));
  document.getElementById("player-next").addEventListener("click", () => loadTrack(currentIndex + 1, { autoplay: true }));
  progressBar.addEventListener("click", seekFromClick);

  audioEl.addEventListener("play", updatePlayPauseIcon);
  audioEl.addEventListener("pause", updatePlayPauseIcon);
  audioEl.addEventListener("ended", () => loadTrack(currentIndex + 1, { autoplay: true }));
  audioEl.addEventListener("timeupdate", () => {
    elapsedEl.textContent = formatTime(audioEl.currentTime);
    if (audioEl.duration) {
      progressFill.style.width = `${(audioEl.currentTime / audioEl.duration) * 100}%`;
    }
  });
}

// Called when leaving the screen (Ok button) so audio doesn't keep playing
// in the background.
export function stopMusicPlayer() {
  if (audioEl) audioEl.pause();
                                                    }
