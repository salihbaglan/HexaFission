// ==================== TRAY ====================
import { HEX_SIZE, getTileColor, get3DTileBackground } from './config.js';
import { state } from './gameState.js';
import { startDrag, startDragTouch } from './drag.js';
import { updateTutorialUI } from './ui.js';

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
  if (state.isTutorial) {
    if (state.tutorialStep === 0) {
      state.trayTiles[0] = { value: 2, double: false, secondValue: null, orientation: null };
      state.trayTiles[1] = { value: 2, double: false, secondValue: null, orientation: null };
      state.trayTiles[2] = { value: 2, double: true, secondValue: 2, orientation: 'H' };
    } else if (state.tutorialStep === 3) {
      state.trayTiles[0] = null; 
      state.trayTiles[1] = { value: 2, double: false, secondValue: null, orientation: null };
      state.trayTiles[2] = { value: 2, double: true, secondValue: 2, orientation: 'H' };
    }
  } else {
    for (let i = 0; i < 3; i++) {
      if (state.trayTiles[i] !== null) continue;
      const vals        = getMaxTileValue();
      const value       = randomTileValue(vals);
      const isDouble    = Math.random() < 0.3;
      const secondValue = isDouble ? randomTileValue(vals) : null;
      const orientation = isDouble ? (Math.random() < 0.5 ? 'H' : 'V') : null;
      state.trayTiles[i] = { value, double: isDouble, secondValue, orientation };
    }
  }
  renderTray();

  if (state.isTutorial && typeof updateTutorialUI === 'function') {
    updateTutorialUI();
  }
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

// Tek hex parçası: dış koyu çerçeve + iç bevel yüzey
// R = hex circumradius, cx/cy = merkez (px, wrapper içi)
function buildHexPiece(col, R, cx, cy, fontSize, val) {
  const INSET = 3;
  const Ri = R - INSET;

  // Polygon points helper
  const pts = (radius) =>
    Array.from({ length: 6 }, (_, i) => {
      const a = Math.PI / 180 * (60 * i - 30); // pointy-top
      return `${(50 + radius / (2 * R) * 100 * Math.cos(a)).toFixed(2)}% ${(50 + radius / (2 * R) * 100 * Math.sin(a)).toFixed(2)}%`;
    }).join(',');

  const w = R * Math.sqrt(3); // hex width for pointy-top
  const h = R * 2;            // hex height

  const group = document.createElement('div');
  group.style.cssText = `position:absolute; left:0; top:0; width:0; height:0;`;

  const frame = document.createElement('div');
  frame.style.cssText = `
    position:absolute;
    width:${w}px; height:${h}px;
    left:${cx - w/2}px; top:${cy - h/2}px;
    background:${col.shadow};
    clip-path:polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%);
  `;
  group.appendChild(frame);

  const wi = Ri * Math.sqrt(3);
  const hi = Ri * 2;
  const face = document.createElement('div');
  face.className = 'tile-piece';
  face.style.cssText = `
    position:absolute;
    width:${wi}px; height:${hi}px;
    left:${cx - wi/2}px; top:${cy - hi/2}px;
    background:${get3DTileBackground(col.bg, col.shadow)};
    clip-path:polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%);
    display:flex; align-items:center; justify-content:center;
    font-weight:900; font-size:${fontSize}; color:white;
    z-index:1; pointer-events:none;
  `;
  face.textContent = val;
  group.appendChild(face);
  return group;
}

export function createTileElement(tile, slotIdx) {
  const SLOT = 120;
  const CX   = SLOT / 2;
  const CY   = SLOT / 2;

  const wrapper = document.createElement('div');
  wrapper.style.cssText = `
    position:relative;
    width:${SLOT}px; height:${SLOT}px;
    cursor:grab;
  `;

  if (tile.double) {
    const R      = HEX_SIZE; // always use grid hex size
    const hDist  = R * Math.sqrt(3);   // horizontal neighbor center distance
    const vDistY = R * 1.5;            // diagonal neighbor Y distance
    const vDistX = R * Math.sqrt(3)/2; // diagonal neighbor X distance

    const values = [tile.value, tile.secondValue];
    let positions;

    if (tile.orientation === 'H') {
      positions = [
        { cx: CX - hDist / 2, cy: CY },
        { cx: CX + hDist / 2, cy: CY },
      ];
    } else {
      // V = diagonal: top-right + bottom-left
      positions = [
        { cx: CX + vDistX / 2, cy: CY - vDistY / 2 },
        { cx: CX - vDistX / 2, cy: CY + vDistY / 2 },
      ];
    }

    values.forEach((v, i) => {
      const col = getTileColor(v);
      const fs  = v >= 1000 ? '10px' : v >= 100 ? '12px' : '14px';
      wrapper.appendChild(buildHexPiece(col, R, positions[i].cx, positions[i].cy, fs, v));
    });
  } else {
    const R   = HEX_SIZE;
    const col = getTileColor(tile.value);
    const fs  = tile.value >= 1000 ? '12px' : tile.value >= 100 ? '14px' : '17px';
    wrapper.appendChild(buildHexPiece(col, R, CX, CY, fs, tile.value));
  }

  wrapper.addEventListener('mousedown',  (e) => startDrag(e, slotIdx, wrapper));
  wrapper.addEventListener('touchstart', (e) => startDragTouch(e, slotIdx, wrapper), { passive: false });
  return wrapper;
}
