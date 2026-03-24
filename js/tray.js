// ==================== TRAY ====================
import { getTileColor } from './config.js';
import { state } from './gameState.js';
import { startDrag, startDragTouch } from './drag.js';

export function getMaxTileValue() {
  let vals = [];
  for (let v = 2; v <= state.maxGridVal; v *= 2) vals.push(v);
  return vals;
}

export function randomTileValue(vals) {
  const weights = vals.map((_, i) => Math.pow(0.6, i));
  const total   = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < vals.length; i++) {
    r -= weights[i];
    if (r <= 0) return vals[i];
  }
  return vals[0];
}

export function generateTray() {
  for (let i = 0; i < 3; i++) {
    if (state.trayTiles[i] !== null) continue;
    const vals        = getMaxTileValue();
    const value       = randomTileValue(vals);
    const isDouble    = Math.random() < 0.3;
    const secondValue = isDouble ? randomTileValue(vals) : null;
    state.trayTiles[i] = { value, double: isDouble, secondValue };
  }
  renderTray();
}

export function renderTray() {
  for (let i = 0; i < 3; i++) {
    const slot = document.getElementById(`slot-${i}`);
    slot.innerHTML = '';
    const tile = state.trayTiles[i];
    if (!tile) continue;
    const el = createTileElement(tile, i);
    slot.appendChild(el);
    state.trayTiles[i].el = el;
  }
}

export function createTileElement(tile, slotIdx) {
  const wrapper = document.createElement('div');
  wrapper.style.position       = 'relative';
  wrapper.style.width          = '100%';
  wrapper.style.height         = '100%';
  wrapper.style.display        = 'flex';
  wrapper.style.alignItems     = 'center';
  wrapper.style.justifyContent = 'center';

  const col      = getTileColor(tile.value);
  const size     = tile.double ? 38 : 48;
  const hSize    = size;
  const wSize    = size * 0.866; // Altıgen genişlik oranı (0.866)
  const fontSize = tile.value >= 1000 ? '11px' : tile.value >= 100 ? '13px' : '16px';

  if (tile.double) {
    [-1, 1].forEach((off, idx) => {
      const v    = idx === 0 ? tile.value : tile.secondValue;
      const c    = getTileColor(v);
      const piece = document.createElement('div');
      piece.className            = 'tile-piece';
      piece.style.width          = wSize + 'px';
      piece.style.height         = hSize + 'px';
      piece.style.background     = `linear-gradient(135deg, ${c.bg}, ${c.shadow})`;
      piece.style.fontSize       = fontSize;
      piece.style.position       = 'absolute';
      piece.style.left           = (50 + off * (wSize/2 + 2) - wSize/2) + 'px';
      piece.style.top            = (50 - hSize / 2) + 'px';
      piece.textContent          = v;
      wrapper.appendChild(piece);
    });
  } else {
    const piece = document.createElement('div');
    piece.className        = 'tile-piece';
    piece.style.width      = wSize + 'px';
    piece.style.height     = hSize + 'px';
    piece.style.background = `linear-gradient(135deg, ${col.bg}, ${col.shadow})`;
    piece.style.fontSize   = fontSize;
    piece.textContent      = tile.value;
    wrapper.appendChild(piece);
  }

  wrapper.addEventListener('mousedown',  (e) => startDrag(e, slotIdx, wrapper));
  wrapper.addEventListener('touchstart', (e) => startDragTouch(e, slotIdx, wrapper), { passive: false });
  return wrapper;
}
