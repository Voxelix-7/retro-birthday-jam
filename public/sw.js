// Versioned app-shell + runtime cache.
//
// IMPORTANT LESSON BAKED INTO THIS DESIGN: a service worker only updates
// when THIS FILE's bytes change — editing app.css/app.js alone does
// nothing, the browser has no way to know to re-check them. That bit us
// once already (v1 kept serving stale files indefinitely). So the shell
// (HTML/CSS/JS — anything that defines how the game behaves) now uses a
// network-first strategy: it's always fetched fresh when online, and the
// cache is only ever a fallback for offline play. That means forgetting to
// bump CACHE_VERSION can no longer cause gameplay code to get stuck stale
// — only this file's own logic needs a version bump when ITS list of
// cached URLs changes.
const CACHE_VERSION = "wanwan-v2";
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

// Anything that defines behavior/appearance — network-first, cache is just
// the offline fallback.
const SHELL_URLS = [
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
];

// Static binary assets — these almost never change once drawn, so
// cache-first (instant, saves bandwidth) is the right call for them.
const STATIC_URLS = [
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
      // Each file fetched/cached independently (Promise.allSettled, not
      // cache.addAll) so one missing/renamed asset — e.g. the /audio/
      // tracks that may not be uploaded yet — can't abort the whole
      // precache step.
      await Promise.allSettled(
        [...SHELL_URLS, ...STATIC_URLS].map(async (url) => {
          const response = await fetch(url, { cache: "no-store" });
          if (response.ok) await cache.put(url, response);
        }),
      );
      // Take over immediately instead of waiting for every open
      // tab/instance to close first — combined with network-first below,
      // this is what makes an update actually visible right away, still
      // with zero prompts or interruptions.
      await self.skipWaiting();
    })(),
  );
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

function isShellUrl(url) {
  return url.origin === self.location.origin && SHELL_URLS.includes(url.pathname);
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (isShellUrl(url)) {
    event.respondWith(
      (async () => {
        try {
          // no-store bypasses any HTTP-level Cache-Control caching too —
          // not just the Cache Storage API — so this is genuinely always
          // fresh whenever there's a connection.
          const response = await fetch(request, { cache: "no-store" });
          if (response.ok) {
            const cache = await caches.open(SHELL_CACHE);
            cache.put(request, response.clone());
          }
          return response;
        } catch {
          const cached = await caches.match(request);
          if (cached) return cached;
          throw new Error("Offline and no cached copy of this file yet.");
        }
      })(),
    );
    return;
  }

  // Everything else (sprites, fonts, audio once uploaded, etc.):
  // cache-first, populating the runtime cache the first time each asset is
  // actually requested.
  event.respondWith(
    (async () => {
      const cached = await caches.match(request);
      if (cached) return cached;

      try {
        const response = await fetch(request);
        if (response.ok || response.type === "opaque") {
          const cache = await caches.open(RUNTIME_CACHE);
          cache.put(request, response.clone());
        }
        return response;
      } catch (err) {
        throw err;
      }
    })(),
  );
});
