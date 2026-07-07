## Add separate side-view idle sprite for gameplay

Currently `boy_idle.png` is used in two places:
- Intro/instructions window (front-facing portrait) — via `public/app.css`
- Gameplay when the boy stops moving — via `public/game.js`

These need to be split into two sprites.

### Changes

1. **Save new side-view idle** as `public/sprites/boy_stand.png` ← `user-uploads://pixil-frame-0_15.png` (side-view, single frame).
2. **Leave `public/sprites/boy_idle.png` untouched** — it stays the front-facing portrait for the instructions window (CSS references unchanged).
3. **`public/game.js`** — Change the third preload from `boy_idle.png` to `boy_stand.png` (rename the variable to `boyStand`) and use it in the "not moving, on ground" branch of the draw call. No other logic changes.

### Also (from previous message, still pending)

4. `public/sprites/boy_run.png` ← `user-uploads://pixil-frame-0_11-2.png` (3-frame male run)
5. `public/sprites/cat_run.png` ← `user-uploads://female_run_Spritesheet-2.png` (3-frame female run)

Frame counts derive from image width automatically, so no code change needed for #4 and #5.
