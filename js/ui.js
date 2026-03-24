import { musicOn, sfxOn, setMusicOn, setSfxOn, startBgMusic, stopBgMusic, playSound } from './audio.js';
import { state } from './gameState.js';
import { createTileElement } from './tray.js';
import { HEX_SIZE } from './config.js';

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

export function updateTutorialUI() {
  if (!state.isTutorial) return;
  const seq = state.tutorialSequence[state.tutorialStep];
  if (!seq) return;

  const tile = state.trayTiles[seq.trayIdx];
  if (!tile || !tile.el) {
    clearTutorialUI();
    return;
  }

  let hand = document.getElementById('tutorial-hand');
  if (!hand) {
    hand = document.createElement('img');
    hand.id = 'tutorial-hand';
    hand.src = 'assets/images/hand.png';
    hand.style.position = 'fixed';
    hand.style.left = '0px';
    hand.style.top = '0px';
    hand.style.width = '60px';
    hand.style.height = '60px';
    hand.style.pointerEvents = 'none';
    hand.style.zIndex = '9900';
    hand.style.transition = 'transform 1s ease-in-out';
    document.body.appendChild(hand);
  }

  const rectStart = tile.el.getBoundingClientRect();
  const startX = rectStart.left + rectStart.width / 2;
  const startY = rectStart.top + rectStart.height / 2;

  const cell = state.cellElements[seq.targetKey];
  if (!cell) return;

  let offsetX = 0;
  let offsetY = 0;
  if (tile.double) {
    if (tile.orientation === 'H') {
      offsetX = (HEX_SIZE * Math.sqrt(3)) / 2;
    } else {
      offsetX = -(HEX_SIZE * Math.sqrt(3) / 2) / 2;
      offsetY = (HEX_SIZE * 1.5) / 2;
    }
  }

  const ghostGridX = cell.cx + offsetX;
  const ghostGridY = cell.cy + offsetY;

  let ghost = document.getElementById('tutorial-ghost');
  if (ghost) ghost.remove();
  
  ghost = createTileElement(tile, -1);
  ghost.id = 'tutorial-ghost';
  ghost.style.position = 'absolute';
  ghost.style.pointerEvents = 'none';
  ghost.style.opacity = '0.4';
  ghost.style.zIndex = '40';
  ghost.style.left = (ghostGridX - 60) + 'px';
  ghost.style.top = (ghostGridY - 60) + 'px';
  document.getElementById('hex-grid').appendChild(ghost);
  
  const gridEl = document.getElementById('hex-grid');
  const gridRect = gridEl.getBoundingClientRect();
  const scale = state.gridScale || 1;
  const endX = gridRect.left + (ghostGridX * scale);
  const endY = gridRect.top + (ghostGridY * scale) + 10;

  if (hand.animInterval) clearInterval(hand.animInterval);
  
  // Set initial position immediately without transition
  hand.style.transition = 'none';
  hand.style.transform = `translate(${startX}px, ${startY}px)`;
  
  // Force reflow
  void hand.offsetWidth;
  hand.style.transition = 'transform 1s ease-in-out';
  
  let moveToTarget = true;
  hand.animInterval = setInterval(() => {
    if (moveToTarget) {
      hand.style.transform = `translate(${endX}px, ${endY}px)`;
    } else {
      hand.style.transform = `translate(${startX}px, ${startY}px)`;
    }
    moveToTarget = !moveToTarget;
  }, 1200);

  // Trigger first move immediately
  setTimeout(() => {
    hand.style.transform = `translate(${endX}px, ${endY}px)`;
  }, 50);
}

export function clearTutorialUI() {
  const hand = document.getElementById('tutorial-hand');
  if (hand) {
    if (hand.animInterval) clearInterval(hand.animInterval);
    hand.remove();
  }
  const ghost = document.getElementById('tutorial-ghost');
  if (ghost) ghost.remove();
}
