## Replace sprite assets

Overwrite the existing sprite PNGs in `public/sprites/` with the newly uploaded spritesheets:

1. `public/sprites/bat.png` ← `user-uploads://pixil-frame-0_13.png` (bat spritesheet)
2. `public/sprites/cat_run.png` ← `user-uploads://pixil-frame-0_8-2.png` (female/Aya idle — note: currently this file drives the chasing cat character; will replace it here)
3. `public/sprites/boy_idle.png` ← `user-uploads://pixil-frame-0_14.png` (Marwan idle)
4. `public/sprites/boy_run.png` ← `user-uploads://pixil-frame-0_11.png` (Marwan running spritesheet)

Also bump the service worker cache version in `public/sw.js` so browsers pick up the new images instead of serving cached copies.

No code/logic changes — same filenames, same frame layouts assumed.

### Question
For #2 (female idle), the current "Aya" character in the codebase is `cat_run.png` (a 3-frame running spritesheet used for the chaser). Your upload looks like a single idle frame. Should I:
- (a) Just overwrite `cat_run.png` with the new image (the chase animation will become a static idle), or
- (b) Only use it as the idle preview on the intro slide and keep the existing running spritesheet for gameplay?
