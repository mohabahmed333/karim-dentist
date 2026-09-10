type AudioContextCtor = new (options?: AudioContextOptions) => AudioContext;

function audioContextCtor(): AudioContextCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    AudioContext?: AudioContextCtor;
    webkitAudioContext?: AudioContextCtor;
  };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  const Ctor = audioContextCtor();
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  return ctx;
}

function tone(
  audio: AudioContext,
  frequency: number,
  start: number,
  duration: number,
) {
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = "sine";
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.08, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

export function unlockWhatsappInboundChime() {
  const audio = getContext();
  if (audio) void audio.resume();
}

/** Short two-note ping. Needs a prior user gesture to unlock AudioContext. */
export function playWhatsappInboundChime() {
  const audio = getContext();
  if (!audio) return;
  void audio.resume();
  const t = audio.currentTime;
  tone(audio, 880, t, 0.12);
  tone(audio, 1174, t + 0.11, 0.14);
}
