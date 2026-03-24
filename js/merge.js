// ==================== MERGE LOGIC ====================
import { HEX_SIZE } from './config.js';
import { hexNeighbors } from './hexMath.js';
import { state } from './gameState.js';
import { updateGridDisplay } from './grid.js';
import { playMergeSound } from './audio.js';

export function doMerges() {
  let merged = true;
  while (merged) {
    merged = false;
    for (const key of Object.keys(state.grid)) {
      if (!state.grid[key]) continue;
      const [q, r] = key.split(',').map(Number);
      const neighbors = hexNeighbors(q, r);
      for (const [nq, nr] of neighbors) {
        const nkey = `${nq},${nr}`;
        if (state.grid[nkey] && state.grid[nkey] === state.grid[key]) {
          // Merge!
          const newVal = state.grid[key] * 2;
          state.grid[key] = newVal;
          state.grid[nkey] = 0;
          addScore(newVal);
          playMergeSound();
          showMergeBurst(key);
          showScorePop(newVal, state.cellElements[key]);
          merged = true;
          break;
        }
      }
      if (merged) break;
    }
  }
  updateGridDisplay();
}

export function addScore(val) {
  state.score += val;
  document.getElementById('score-display').textContent = state.score;
  if (state.score > state.bestScore) {
    state.bestScore = state.score;
    localStorage.setItem('hex2048best', state.bestScore);
    document.getElementById('best-val').textContent = state.bestScore;
  }
}

export function showMergeBurst(key) {
  const { cx, cy } = state.cellElements[key];
  const gridEl = document.getElementById('hex-grid');
  const rect = gridEl.getBoundingClientRect();

  const burst = document.createElement('div');
  burst.className = 'merge-burst';
  const bSize = HEX_SIZE * 2;
  burst.style.cssText = `
    width:${bSize}px; height:${bSize}px;
    border-radius:50%;
    background: radial-gradient(circle, rgba(255,255,180,0.9), transparent 70%);
    left:${rect.left + cx - bSize / 2}px;
    top:${rect.top + cy - bSize / 2}px;
    position:fixed;
  `;
  document.body.appendChild(burst);
  setTimeout(() => burst.remove(), 500);
}

export function showScorePop(val, cellInfo) {
  const gridEl = document.getElementById('hex-grid');
  const rect = gridEl.getBoundingClientRect();
  const pop = document.createElement('div');
  pop.className = 'score-pop';
  pop.textContent = '+' + val;
  pop.style.left = (rect.left + cellInfo.cx - 20) + 'px';
  pop.style.top = (rect.top + cellInfo.cy - 20) + 'px';
  pop.style.fontSize = val >= 512 ? '24px' : '18px';
  document.body.appendChild(pop);
  setTimeout(() => pop.remove(), 1000);
}
