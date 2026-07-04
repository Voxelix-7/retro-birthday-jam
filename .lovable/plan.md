## Problem

The intro slides, easier gameplay, and redesigned game-over window are already written into `public/app.html`, `public/app.css`, `public/app.js`, and `public/game.js`. The preview still shows the old version because the PWA service worker (`public/sw.js`) cached the previous asset bundle on your first visit and is serving those stale files instead of the updated ones.

## Fix

Bump the service worker cache version so browsers evict the old cache and fetch the new HTML/CSS/JS.

1. In `public/sw.js`, increment the cache name constant (e.g. `birthday-v1` → `birthday-v2`) and make the `activate` handler delete any cache whose name doesn't match the current one.
2. That's the only code change needed — the app source itself is already up to date.

## After the change

On your side, do one of these once so the new service worker takes over:
- Hard-refresh the preview (Cmd/Ctrl+Shift+R), or
- Open DevTools → Application → Service Workers → Unregister, then reload.

From then on the version bump alone will invalidate the cache automatically.
