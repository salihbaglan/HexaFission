// ==================== GAME FLOW (ENTRY POINT) ====================
import { MAX_LIVES } from './config.js';
import { state } from './gameState.js';
import { hexNeighbors } from './hexMath.js';
import { initAudio, resumeAudioCtx, playSound, startBgMusic } from './audio.js';
import { initGrid, updateGridDisplay, scaleGridToContainer } from './grid.js';
import { generateTray, renderTray } from './tray.js';
import { initDrag } from './drag.js';
import { doMerges } from './merge.js';
import { initUI } from './ui.js';
import { initItems, updateItemUI } from './items.js';

// Setup image assets once
document.getElementById('crown-img').src = 'assets/images/king_icon.png';

// Drag drop handler
function onHexDrop(keys, tile, slotIdx) {
  placeTileOnGrid(keys, tile, slotIdx);
}

function placeTileOnGrid(keys, tile, slotIdx) {
  const mainKey = keys[0];
  state.grid[mainKey] = tile.value;
  updateGridDisplay();
  playSound('TilePlaced', false, 0.8);

  // Animate main tile
  const mainDiv = state.cellElements[mainKey].div;
  mainDiv.classList.add('tile-place-anim');
  setTimeout(() => mainDiv.classList.remove('tile-place-anim'), 300);

  // Handle double tile
  if (keys.length > 1 && tile.secondValue) {
    const secKey = keys[1];
    state.grid[secKey] = tile.secondValue;
    updateGridDisplay();
    setTimeout(() => {
      const secDiv = state.cellElements[secKey].div;
      secDiv.classList.add('tile-place-anim');
      setTimeout(() => secDiv.classList.remove('tile-place-anim'), 300);
    }, 100);
  }

  // Remove from tray
  state.trayTiles[slotIdx] = null;
  const slot = document.getElementById(`slot-${slotIdx}`);
  slot.innerHTML = '';

  // Run merge chain
  setTimeout(async () => {
    await doMerges(keys);
    updateMaxGridVal();

    const allEmpty = state.trayTiles.every(t => t === null);
    if (allEmpty) {
      generateTray();
    } else {
      checkCanPlace();
    }
  }, 350);
}

function updateMaxGridVal() {
  let max = 2;
  Object.values(state.grid).forEach(v => { if (v > max) max = v; });
  state.maxGridVal = max;
}

function checkCanPlace() {
  const emptyCells = Object.keys(state.grid).filter(k => state.grid[k] === 0);
  if (emptyCells.length === 0) {
    triggerGameOver();
  }
}

function triggerGameOver() {
  state.gameOver = true;
  playSound('GameOver', false, 1.0);
  document.getElementById('modal-score').textContent = state.score;
  document.getElementById('overlay').classList.add('show');
}

function restartGame() {
  state.score = 0;
  state.lives = MAX_LIVES;
  state.gameOver = false;
  state.maxGridVal = 2;
  state.trayTiles = [null, null, null];
  
  state.itemChangeCount = 5;
  state.itemRemoveCount = 5;
  state.activeItem = null;
  state.changeSourceKey = null;

  document.getElementById('score-display').textContent = '0';
  document.getElementById('best-val').textContent = state.bestScore;

  state.hexPositions.forEach(([q, r]) => { state.grid[`${q},${r}`] = 0; });
  updateGridDisplay();
  updateItemUI();

  for (let i = 0; i < 3; i++) {
    document.getElementById(`slot-${i}`).innerHTML = '';
  }

  playSound('GameStart', false, 0.8);
  generateTray();
  setTimeout(startBgMusic, 500);
}

// ==================== INITIALIZATION ====================
async function init() {
  await initAudio();
  document.getElementById('best-val').textContent = state.bestScore;
  initGrid();
  requestAnimationFrame(() => scaleGridToContainer());
  initDrag(onHexDrop);
  initUI(restartGame);
  initItems();
  
  // Resize: grid'i yeniden oluştur
  window.addEventListener('resize', () => {
    initGrid();
    updateGridDisplay();
    requestAnimationFrame(() => scaleGridToContainer());
    renderTray();
  });

  // First interaction starts audio (NOT tray generation)
  const startAudio = () => {
    resumeAudioCtx();
    playSound('GameStart', false, 0.8);
    startBgMusic();
    document.removeEventListener('click', startAudio);
    document.removeEventListener('touchstart', startAudio);
  };
  document.addEventListener('click', startAudio);
  document.addEventListener('touchstart', startAudio);

  generateTray(); // Generate tray once on load
}

// Start game
init();
