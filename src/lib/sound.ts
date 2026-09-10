/**
 * One-shot sound effects over the Web Audio API.
 *
 * An <audio> element can only play one instance at a time, which is no good
 * for anything you can trigger in quick succession: each new play cuts the
 * last one off. Decoding once into a buffer and starting a fresh source node
 * per hit lets them overlap, and makes the pitch cheap to vary.
 */

type SoundOptions = {
  volume?: number;
  /**
   * Treat the file as N equal-length slots and play one per hit. Sample packs
   * ship several takes in a single recording, and slicing keeps that to one
   * request and one decode while giving every hit a different take.
   */
  slices?: number;
};

export type Sound = {
  /** Fetch and decode ahead of the first play. Safe to call repeatedly. */
  prime: () => void;
  /**
   * Play a one-shot. `rate` shifts the pitch; 1 is the recording as-is.
   * With `slices` set, a slot is picked at random, never the one just played.
   */
  play: (rate?: number) => void;
};

export function createSound(url: string, options: SoundOptions = {}): Sound {
  const { volume = 1, slices = 1 } = options;

  let context: AudioContext | null = null;
  let buffer: AudioBuffer | null = null;
  let loading = false;
  let lastSlice = -1;

  function ensureContext(): AudioContext | null {
    if (context) return context;
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    context = new Ctor();
    return context;
  }

  function prime() {
    const ctx = ensureContext();
    if (!ctx || buffer || loading) return;
    loading = true;
    fetch(url)
      .then((response) => response.arrayBuffer())
      .then((data) => ctx.decodeAudioData(data))
      .then((decoded) => {
        buffer = decoded;
      })
      .catch(() => {
        // A sound effect that fails to load is not worth an error.
      })
      .finally(() => {
        loading = false;
      });
  }

  function play(rate = 1) {
    const ctx = ensureContext();
    if (!ctx) return;
    // Browsers start a context suspended until the user interacts with the
    // page. Without this the first sound of a session is silently swallowed.
    if (ctx.state === "suspended") void ctx.resume();

    if (!buffer) {
      prime();
      return;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = rate;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    source.connect(gain).connect(ctx.destination);

    if (slices > 1) {
      let slice = Math.floor(Math.random() * slices);
      if (slice === lastSlice) slice = (slice + 1) % slices;
      lastSlice = slice;
      const slot = buffer.duration / slices;
      source.start(0, slice * slot, slot);
    } else {
      source.start(0);
    }
  }

  return { prime, play };
}
