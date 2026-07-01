const CACHE = "wanwan-v1";
const ASSETS = [
  "/app.html",
  "/app.css",
  "/app.js",
  "/game.js",
  "/manifest.webmanifest",
  "/sprites/boy_run.png",
  "/sprites/boy_idle.png",
  "/sprites/cat_run.png",
  "/sprites/cat_blink.png",
  "/sprites/bat.png",
  "/sprites/cake.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => hit))
  );
});