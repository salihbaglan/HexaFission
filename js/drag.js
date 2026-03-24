// ==================== DRAG & DROP ====================
import { HEX_SIZE } from './config.js';
import { state } from './gameState.js';
import { playSound } from './audio.js';
import { hexNeighbors } from './hexMath.js';

let isDragging      = false;
let dragInfo        = null;
let highlightedKeys = [];
let _onDrop         = null;

const ghostEl = document.getElementById('drag-ghost');

/** Call once from game.js to register the drop handler. */
export function initDrag(onDropCallback) {
  _onDrop = onDropCallback;
}

export function startDrag(e, slotIdx, el) {
  if (state.gameOver || !state.trayTiles[slotIdx]) return;
  e.preventDefault();
  playSound('ClickTile', false, 0.8);
  _beginDrag(slotIdx, el);
  positionGhost(e.clientX, e.clientY);
  document.addEventListener('mousemove', onDragMove);
  document.addEventListener('mouseup',   onDragEnd);
}

export function startDragTouch(e, slotIdx, el) {
  if (state.gameOver || !state.trayTiles[slotIdx]) return;
  e.preventDefault();
  playSound('ClickTile', false, 0.8);
  const touch = e.touches[0];
  _beginDrag(slotIdx, el);
  positionGhost(touch.clientX, touch.clientY);
  document.addEventListener('touchmove', onDragMoveTouch, { passive: false });
  document.addEventListener('touchend',  onDragEndTouch);
}

function _beginDrag(slotIdx, el) {
  isDragging = true;
  dragInfo   = { slotIdx, el };
  ghostEl.innerHTML         = el.innerHTML;
  ghostEl.style.display     = 'block';
  ghostEl.style.width       = el.offsetWidth  + 'px';
  ghostEl.style.height      = el.offsetHeight + 'px';
  ghostEl.style.opacity     = '0.9';
  ghostEl.style.transform   = 'scale(1.15) translateY(-8px)';
  el.style.opacity = '0.3';
}

function positionGhost(x, y) {
  ghostEl.style.left = (x - ghostEl.offsetWidth  / 2) + 'px';
  ghostEl.style.top  = (y - ghostEl.offsetHeight / 2) + 'px';
}

function onDragMove(e) {
  if (!isDragging) return;
  positionGhost(e.clientX, e.clientY);
  highlightHexUnder(e.clientX, e.clientY);
}

function onDragMoveTouch(e) {
  if (!isDragging) return;
  e.preventDefault();
  const touch = e.touches[0];
  positionGhost(touch.clientX, touch.clientY);
  highlightHexUnder(touch.clientX, touch.clientY);
}

function onDragEnd(e) {
  if (!isDragging) return;
  finishDrop(e.clientX, e.clientY);
  cleanupDrag();
  document.removeEventListener('mousemove', onDragMove);
  document.removeEventListener('mouseup',   onDragEnd);
}

function onDragEndTouch(e) {
  if (!isDragging) return;
  const touch = e.changedTouches[0];
  finishDrop(touch.clientX, touch.clientY);
  cleanupDrag();
  document.removeEventListener('touchmove', onDragMoveTouch);
  document.removeEventListener('touchend',  onDragEndTouch);
}

function cleanupDrag() {
  isDragging = false;
  ghostEl.style.display = 'none';
  clearHighlights();
  for (let i = 0; i < 3; i++) {
    const child = document.getElementById(`slot-${i}`)?.firstChild;
    if (child) child.style.opacity = '1';
  }
  dragInfo = null;
}

function highlightHexUnder(x, y) {
  clearHighlights();
  
  const key = getHexKeyAtScreen(x, y);
  if (!key || state.grid[key] !== 0 || !dragInfo) return;

  const { slotIdx } = dragInfo;
  const tile = state.trayTiles[slotIdx];
  if (!tile) return;

  highlightedKeys.push(key);

  if (tile.double && tile.secondValue) {
    const [q, r] = key.split(',').map(Number);
    const neighbors = hexNeighbors(q, r);
    for (const [nq, nr] of neighbors) {
      const nkey = `${nq},${nr}`;
      if (state.grid[nkey] === 0) {
        highlightedKeys.push(nkey);
        break;
      }
    }
    // Cannot fit the second piece anywhere? Deny placement.
    if (highlightedKeys.length === 1) {
      highlightedKeys = [];
      return;
    }
  }

  highlightedKeys.forEach(k => {
    state.cellElements[k].div.classList.add('drop-target');
  });
}

function clearHighlights() {
  highlightedKeys.forEach(k => {
    state.cellElements[k]?.div.classList.remove('drop-target');
  });
  highlightedKeys = [];
}

function getHexKeyAtScreen(x, y) {
  const gridEl = document.getElementById('hex-grid');
  const rect   = gridEl.getBoundingClientRect();
  const lx = x - rect.left;
  const ly = y - rect.top;

  let bestKey = null, bestDist = Infinity;
  Object.entries(state.cellElements).forEach(([key, { cx, cy }]) => {
    const d = Math.hypot(lx - cx, ly - cy);
    if (d < bestDist) { bestDist = d; bestKey = key; }
  });
  return bestDist < HEX_SIZE ? bestKey : null;
}

function finishDrop(x, y) {
  if (highlightedKeys.length === 0 || !dragInfo) return;
  const { slotIdx } = dragInfo;
  const tile = state.trayTiles[slotIdx];
  if (!tile) return;
  if (_onDrop) _onDrop(highlightedKeys, tile, slotIdx);
}
