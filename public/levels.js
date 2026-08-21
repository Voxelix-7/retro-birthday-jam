// Level configuration.
//
// Add new levels here as they're built. Each level with `hasContent: true`
// needs slides for the instructions modal, a length for the game world, and
// a win condition. Levels with `hasContent: false` are placeholders — if a
// player reaches them via the map (because a previous level was completed)
// they'll see a "coming soon" message instead of a broken game.
//
// Difficulty ramp (Dino-game style): `length` grows level to level, and so
// do `baseSpeedMultiplier` (how fast things already are at the very start
// of the level) and `speedRampPerSecond` (how quickly that pace climbs the
// longer you survive). `catGain` is the cat's own slow independent
// speed-up on top of that shared pace, and `catGainCap` is a hard ceiling
// on how much that independent speed-up can ever add.
//
// IMPORTANT for winnability: catGainCap must stay below
// (playerSpeed - catBaseSpeed) from game.js, currently (3.4 - 2.7 = 0.7).
// As long as it does, the cat's effective speed can never permanently
// exceed the player's — the chase gets tighter at higher levels (a smaller
// margin, so mistakes are costlier) without ever becoming impossible to
// outrun. All of these are easy to retune if a level feels too easy/hard
// after playtesting.

export const LEVELS = [
  {
    id: 1,
    name: "Level I",
    hasContent: true,
    length: 4000,
    winType: "envelope",
    baseSpeedMultiplier: 1.0,
    speedRampPerSecond: 0.045,
    catGain: 0.00004,
    catGainCap: 0.25,
    slides: [
      {
        text: "This is Aya, she's a female character based on me. She wants Chibi Marwan gone. Run and don't look back.",
        char: "aya",
      },
      {
        text: "This is chibi Marwan, your non brunette character. You'll control him using either your keyboard arrows (if you're using your PC) or the arrows on screen (if you're using your phone) to run from Aya.",
        char: "marwan",
      },
      {
        text: "Your goal is to reach the floating envelope, the game should take you 40 seconds if you're good enough.",
        char: null,
      },
      {
        text: "Aya likes cubes, touch them and you lose, Loser",
        char: null,
        image: "/sprites/loser-panel.jpg",
      },
    ],
    // `ending` describes what happens after a win.
    // type: "text" shows a message + Ok button (levelend screen).
    // type: "cutscene" plays a full-screen animation once + Ok/Again? buttons.
    // type: "musicplayer" shows a real, playable album UI + Ok button.
    //
    // `confirm` (optional) shows a popup over the frozen game right after
    // winning, before anything else happens. `yes` proceeds to the ending;
    // `no` (optional) does nothing except, if `noShrinks` is set, visibly
    // shrink a little on every click.
    ending: {
      type: "text",
      text: "You won, you must be a true hero to win this kindergarten kids' challenge, you deserve an applause.Each level has its own ending, you reach THE CAKE at the end of the last level so, good luck on winning this EXTREME game.Have fun",
    },
  },
  {
    id: 2,
    name: "Level II",
    hasContent: true,
    length: 5000,
    winType: "chess",
    baseSpeedMultiplier: 1.05,
    speedRampPerSecond: 0.055,
    catGain: 0.00005,
    catGainCap: 0.35,
    // The chess cutscene is no longer shown as a reward for beating this
    // level — it now only plays when replayed from the finale screen's
    // chess-piece icon (see replayEnding() in app.js, which still looks up
    // `ending.type === "cutscene"` on this level to know what to play).
    // `skipOnWin: true` tells fadeToEnding() in app.js to skip straight back
    // to the map on a normal win instead of showing the cutscene.
    ending: {
      type: "cutscene",
      skipOnWin: true,
    },
  },
  {
    id: 3,
    name: "Level III",
    hasContent: true,
    length: 6000,
    winType: "cd",
    baseSpeedMultiplier: 1.1,
    speedRampPerSecond: 0.065,
    catGain: 0.00006,
    catGainCap: 0.45,
    ending: {
      type: "musicplayer",
      confirm: {
        text: "You like my taste in music right? :D",
        yes: "OMG YES!",
        no: "I prefer knife fights",
        noShrinks: true,
      },
    },
  },
  {
    id: 4,
    name: "Level IV",
    hasContent: true,
    length: 7000,
    winType: "cake",
    baseSpeedMultiplier: 1.15,
    speedRampPerSecond: 0.075,
    catGain: 0.00007,
    catGainCap: 0.55,
    warningText: "The cake is close. Don’t embarrass yourself",
    warningDistance: 3500,
    enemyJumpHeight: 50,
    // No `confirm` — winning goes straight to the fade-to-black + finale.
    ending: { type: "finale" },
  },
];