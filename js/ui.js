// ==================== UI & SETTINGS ====================
import { musicOn, sfxOn, setMusicOn, setSfxOn, startBgMusic, stopBgMusic, playSound } from './audio.js';

/** Call once from game.js to register the restart handler */
let _onRestart = null;

export function initUI(onRestartCallback) {
  _onRestart = onRestartCallback;

  // Settings Panel
  document.getElementById('settings-btn').addEventListener('click', () => {
    playSound('uiClick', false, 0.8);
    document.getElementById('settings-panel').classList.add('open');
  });

  document.getElementById('close-settings').addEventListener('click', () => {
    playSound('uiClick', false, 0.8);
    document.getElementById('settings-panel').classList.remove('open');
  });

  // Toggles
  document.getElementById('toggle-music').addEventListener('click', function() {
    setMusicOn(!musicOn);
    this.classList.toggle('on', musicOn);
    if (musicOn) startBgMusic();
    else stopBgMusic();
  });

  document.getElementById('toggle-sfx').addEventListener('click', function() {
    setSfxOn(!sfxOn);
    this.classList.toggle('on', sfxOn);
  });

  document.getElementById('toggle-vib').addEventListener('click', function() {
    this.classList.toggle('on');
  });

  // Restart buttons
  document.getElementById('restart-btn').addEventListener('click', () => {
    playSound('uiClick', false, 0.8);
    document.getElementById('settings-panel').classList.remove('open');
    if (_onRestart) _onRestart();
  });

  document.getElementById('play-again-btn').addEventListener('click', () => {
    document.getElementById('overlay').classList.remove('show');
    if (_onRestart) _onRestart();
  });
}
