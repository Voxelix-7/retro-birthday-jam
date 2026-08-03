// Versioned app-shell + runtime cache.
//
// Bump CACHE_VERSION on every deploy that changes any cached asset. The new
// worker installs quietly alongside whatever is currently controlling the
// page, precaches fresh copies of the shell under a new cache name, and
// only takes over — deleting old cache versions — once every open
// instance of the app has been fully closed and relaunched. There's no
// prompt and no forced reload: updates just apply the next time the game
// is opened, which is what makes this safe to do silently.
const CACHE_VERSION = "wanwan-v1";
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

// The static app shell — everything needed to run the game once it's
// cached. Audio files under /audio/ are deliberately NOT listed here (see
// album.js — they may not be uploaded yet); they get picked up
// automatically by the runtime cache below the first time they're
// successfully fetched, whenever they do exist.
const PRECACHE_URLS = [
  "/app.html",
  "/app.css",
  "/app.js",
  "/game.js",
  "/levels.js",
  "/chess-cutscene.js",
  "/music-player.js",
  "/finale.js",
  "/album.js",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/sprites/bat.png",
  "/sprites/boy_run.png",
  "/sprites/boy_stand.png",
  "/sprites/boy_idle.png",
  "/sprites/cat_run.png",
  "/sprites/cat_blink.png",
  "/sprites/cake_target.png",
  "/sprites/cake_sheet.png",
  "/sprites/cd.png",
  "/sprites/album_art.png",
  "/sprites/chess_cutscene.png",
  "/sprites/aya_grass.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      // Each file is fetched and cached independently (not cache.addAll,
      // which aborts the ENTIRE install if even one request fails) so a
      // missing/renamed asset can't break the whole precache step.
      await Promise.allSettled(
        PRECACHE_URLS.map(async (url) => {
          const response = await fetch(url, { cache: "no-cache" });
          if (response.ok) await cache.put(url, response);
        }),
      );
    })(),
  );
  // Deliberately no self.skipWaiting() here — see the note at the top of
  // this file. The new worker waits its turn instead of forcing an update
  // mid-session.
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("wanwan-") && !key.startsWith(CACHE_VERSION))
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  event.respondWith(
    (async () => {
      const cached = await caches.match(request);
      if (cached) return cached;

      try {
        const response = await fetch(request);
        // Cache successful same-origin responses, and opaque cross-origin
        // ones too (e.g. the Google Fonts CSS/font files) so everything
        // that's actually been used once keeps working offline from then
        // on — this is what picks up the not-yet-uploaded audio tracks
        // automatically as soon as they exist.
        if (response.ok || response.type === "opaque") {
          const cache = await caches.open(RUNTIME_CACHE);
          cache.put(request, response.clone());
        }
        return response;
      } catch (err) {
        // Offline and not already cached — nothing more we can do for
        // this particular request.
        throw err;
      }
    })(),
  );
});
