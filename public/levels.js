
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
      },
    ],
    // Placeholder — swap in the real message whenever you're ready.
    endingText:
      "PLACEHOLDER TEXT — replace this with the real Chapter I message whenever you're ready.",
  },
  { id: 2, name: "Chapter II", hasContent: false },
  { id: 3, name: "Chapter III", hasContent: false },
  { id: 4, name: "Chapter IV", hasContent: false },
];
