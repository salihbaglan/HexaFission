// ==================== AUDIO ====================
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
const audioBuffers = {};
let bgMusicSource = null;

export let musicOn = true;
export let sfxOn = true;

export function setMusicOn(val) { musicOn = val; }
export function setSfxOn(val)   { sfxOn = val; }

function getAudioCtx() {
  if (!audioCtx) audioCtx = new AudioCtx();
  return audioCtx;
}

export function resumeAudioCtx() {
  getAudioCtx().resume();
}

async function loadAudio(name, url) {
  try {
    const ctx = getAudioCtx();
    const res = await fetch(url);
    const ab  = await res.arrayBuffer();
    audioBuffers[name] = await ctx.decodeAudioData(ab);
  } catch (e) {}
}

export function playSound(name, loop = false, volume = 1) {
  if (!sfxOn   && name !== 'bg') return;
  if (!musicOn && name === 'bg') return;
  try {
    const ctx = getAudioCtx();
    const buf = audioBuffers[name];
    if (!buf) return;
    const src  = ctx.createBufferSource();
    src.buffer = buf;
    src.loop   = loop;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    src.connect(gain);
    gain.connect(ctx.destination);
    src.start();
    return src;
  } catch (e) {}
}

// Merge sound pool – pick a random sound, avoid repeating last
const mergeSoundNames = ['Merged', 'Merged2', 'Merged3', 'Merged4', 'Mrged5', 'Merged6', 'Merged7'];
let lastMergeIdx = -1;

export function playMergeSound() {
  let idx;
  do {
    idx = Math.floor(Math.random() * mergeSoundNames.length);
  } while (idx === lastMergeIdx && mergeSoundNames.length > 1);
  lastMergeIdx = idx;
  playSound(mergeSoundNames[idx], false, 0.7);
}

export async function initAudio() {
  const files = {
    'GameStart':  'assets/sounds/GameStart.mp3',
    'GameOver':   'assets/sounds/GameOver.mp3',
    'TilePlaced': 'assets/sounds/TilePlaced.mp3',
    'ClickTile':  'assets/sounds/ClickTile.mp3',
    'uiClick':    'assets/sounds/uiClick.mp3',
    'bg':         'assets/sounds/dacad8b5-1bf4-40f1-864c-93f23c487aaf.mp3',
    'Merged':     'assets/sounds/Merged.mp3',
    'Merged2':    'assets/sounds/Merged2.mp3',
    'Merged3':    'assets/sounds/Merged3.mp3',
    'Merged4':    'assets/sounds/Merged4.mp3',
    'Mrged5':     'assets/sounds/Mrged5.mp3',
    'Merged6':    'assets/sounds/Merged6.mp3',
    'Merged7':    'assets/sounds/Merged7.mp3',
  };
  await Promise.all(Object.entries(files).map(([n, u]) => loadAudio(n, u)));
}

export function startBgMusic() {
  if (!musicOn) return;
  try {
    const ctx = getAudioCtx();
    if (bgMusicSource) { try { bgMusicSource.stop(); } catch (e) {} }
    const buf = audioBuffers['bg'];
    if (!buf) return;
    bgMusicSource = ctx.createBufferSource();
    bgMusicSource.buffer = buf;
    bgMusicSource.loop   = false;  // Loop kapatıldı
    const gain = ctx.createGain();
    gain.gain.value = 0.35;
    bgMusicSource.connect(gain);
    gain.connect(ctx.destination);
    bgMusicSource.start();
  } catch (e) {}
}

export function stopBgMusic() {
  if (bgMusicSource) {
    try { bgMusicSource.stop(); } catch (e) {}
    bgMusicSource = null;
  }
}
