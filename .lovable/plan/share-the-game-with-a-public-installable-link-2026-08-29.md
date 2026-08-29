# Share the game with a public, installable link

Yes — this works with no login and no permission prompts. The app is already a static PWA (`public/app.html`, manifest, service worker, icons), so publishing makes it open to anyone with the link.

## Steps

1. Confirm publish visibility is set to **public** (anyone with the link, no workspace login).
2. Run a quick security scan (required before publishing) and publish the project.
3. Give you the live link plus the direct game URL (`/app.html`; `/` already redirects there).
4. Verify on the live URL: page loads without any sign-in, manifest + icons resolve, service worker registers, and the game is installable ("Add to Home Screen" on iOS Safari, "Install app" on Android Chrome).

## Notes

- Only the password gate (`Jan30*026`) stands between your friend and the game — that's your own screen, not an account login.
- Install prompt: Android/Chrome shows an install banner or menu item; iOS requires Share > Add to Home Screen (no way to force a prompt there).
- The service worker caches the game for offline play after the first load.
- Optional slug rename (e.g. `wanwan-birthday`) if you want a nicer link — tell me the wording you'd like.
