// Level configuration.
//
// Add new levels here as they're built. Each level with `hasContent: true`
// needs slides for the instructions modal, a length for the game world, and
// a win condition. Levels with `hasContent: false` are placeholders — if a
// player reaches them via the map (because a previous level was completed)
// they'll see a "coming soon" message instead of a broken game.

export const LEVELS = [
  {
    id: 1,
    name: "Level I",
    hasContent: true,
    length: 5400,
    winType: "envelope",
    slides: [
      {
        text: "This is (Idk), she's a female character based on me. She wants Chibi Marwan gone. Run and don't look back.",
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
    length: 5400,
    winType: "chesspiece",
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
    length: 5400,
    winType: "cd",
    ending: {
      type: "musicplayer",
      confirm: {
        text: "You like my tasts in music right? :D",
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
    length: 5400,
    winType: "cake",
    // No `confirm` — winning goes straight to the fade-to-black + finale.
    ending: { type: "finale" },
  },
];
