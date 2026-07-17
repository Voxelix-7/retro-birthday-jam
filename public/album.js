// Track data for the "Who Really Cares" music player shown after level 3.
//
// Audio files aren't included yet — drop the actual mp3s into public/audio/
// using the exact filenames below, and playback will just work. Until then,
// the player UI still works fine; a missing file just fails to play silently.

export const ALBUM = {
  artist: "TV Girl",
  title: "Who Really Cares",
  art: "/sprites/album_art.png",
};

export const TRACKS = [
  { title: "Taking What's Not Yours", file: "/audio/01-taking-whats-not-yours.mp3", duration: "3:25" },
  { title: "Song About Me", file: "/audio/02-song-about-me.mp3", duration: "4:03" },
  { title: "Cigarettes Out The Window", file: "/audio/03-cigarettes-out-the-window.mp3", duration: "3:18" },
  { title: "Till You Tell Me To Leave", file: "/audio/04-till-you-tell-me-to-leave.mp3", duration: "3:26" },
  { title: "Not Allowed", file: "/audio/05-not-allowed.mp3", duration: "2:47" },
  { title: "(Do The) Act Like You Never Met Me", file: "/audio/06-act-like-you-never-met-me.mp3", duration: "4:14" },
  { title: "Safe Word", file: "/audio/07-safe-word.mp3", duration: "3:36" },
  { title: "For You", file: "/audio/08-for-you.mp3", duration: "3:35" },
  { title: "Loving Machine", file: "/audio/09-loving-machine.mp3", duration: "3:47" },
  { title: "Heaven Is A Bedroom", file: "/audio/10-heaven-is-a-bedroom.mp3", duration: "4:38" },
];
