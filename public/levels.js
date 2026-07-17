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
    name: "Chapter I",
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
      // Placeholder — swap in the real message whenever you're ready.
      text: "PLACEHOLDER TEXT — replace this with the real Chapter I message whenever you're ready.",
    },
  },
  {
    id: 2,
    name: "Chapter II",
    hasContent: true,
    length: 5400,
    winType: "chesspiece",
    // No `slides` — instructions were a level-1-only thing. Levels without
    // slides skip straight into the (frozen-until-first-move) game.
    ending: {
      type: "cutscene",
      confirm: { text: "You won...play chess?", yes: "YES!" },
    },
  },
  {
    id: 3,
    name: "Chapter III",
    hasContent: true,
    length: 5400,
    winType: "cd",
    ending: {
      type: "musicplayer",
      confirm: {
        text: "You like my tasts in music right? :D",
        yes: "Yes",
        no: "No",
        noShrinks: true,
      },
    },
  },
  { id: 4, name: "Chapter IV", hasContent: false },
];
