# Changes to Marwan's Birthday PWA

## 1. New 4-page intro sequence

After the bat's "Get started" button is clicked, insert 4 slide pages before the game starts. Each page has a "Next" button (bottom-right); page 4 has a "Start!" button.

**Page 1** — split layout: left = black text, right = large idle Aya (cat) sprite.
Text: *"This is Aya, she's a female character based on me. She wants Chibi Marwan gone. Run and don't look back."*

**Page 2** — split layout: left = black text, right = large idle Chibi Marwan (boy) sprite.
Text: *"This is chibi Marwan, your non brunette character. You'll control him using either your keyboard arrows (if you're using your PC) or the arrows on screen (if you're using your phone) to run from Aya."*

**Page 3** — centered black text only.
Text: *"Your goal is to get the cake, the game should take you 40 seconds if you're good enough"*

**Page 4** — centered black text + "Start!" button.
Text: *"Aya likes cubes, touch them and you lose, Loser"*

**Page styling** (also used for the game-over window):
- Background: warm dark orange that harmonizes with the app palette (e.g. `#7a3a1a`)
- Border: ~4px solid white, generously rounded corners (~18px)
- Text color: black
- Character images on pages 1–2: large (~256px on desktop, scaled down on mobile), idle frame only

**Start! behavior**: dismiss the intro overlay and reveal the game canvas, but keep the game **frozen** (player, cat, enemies, timer all paused). The chase begins only when the player first presses left/right/jump.

## 2. Easier gameplay

Tune `public/game.js` `CONFIG` and enemy setup so a 5-year-old can win:
- Lower the bouncing cubes' amplitude significantly (e.g. `amp` ~10–16px instead of 40–70) so they hop only slightly above the ground and are trivial to jump.
- Slow the cubes' bounce phase (`e.phase += 0.03` instead of `0.06`).
- Reduce cat base speed and ramp-up (`catBaseSpeed` ~1.8, `catGain` ~0.00005).
- Keep player speed/jump as-is (already comfortable).

## 3. Game-over window redesign

- Content: only the blinking Aya sprite + the words **"Try again"** + a single button that retries. Remove the "Give up" button and the "Try again?" title.
- Window style matches the new intro pages (dark-orange bg, thick white rounded border, black text).
- Make the window larger and the blinking cat sprite larger (~192px on desktop) with the same 2-blink @ 3 FPS + 2s pause pattern.

## Technical notes

- Add a new `<section class="screen" data-screen="intro">` in `public/app.html` containing 4 `.slide` divs, with Next/Start buttons.
- Add a `.intro-panel`, `.slide`, `.slide.split`, and `.orange-panel` style block in `public/app.css`. Reuse `.orange-panel` for `[data-screen="gameover"] .panel`.
- Idle sprites reuse `/sprites/boy_idle.png` and frame-0 of `/sprites/cat_blink.png` (or `cat_run.png` frame 0) at large CSS sizes.
- In `public/app.js`: after `get-started` click, `show("intro")` and run a small slide state machine; the final Start! handler calls `show("game")` then `runGame({ startPaused: true })`.
- In `public/game.js`: add `startPaused` option — skip physics/AI updates until the first input event; still render the initial frame so the scene is visible while frozen. Also apply the easier tuning values.
- Keep all other flow (password, bat intro, finale, confetti, blink pattern) unchanged.
