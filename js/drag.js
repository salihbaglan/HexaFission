// ==================== DRAG & DROP ====================
import { HEX_SIZE } from './config.js';
import { state } from './gameState.js';
import { playSound } from './audio.js';
import { hexNeighbors } from './hexMath.js';
import { floodFill } from './merge.js';

let isDragging = false;
let dragInfo = null;
let highlightedKeys = [];
let previewActiveKeys = [];
let _onDrop = null;

const ghostEl = document.getElementById('drag-ghost');

/** Call once from game.js to register the drop handler. */
export function initDrag(onDropCallback) {
  _onDrop = onDropCallback;
}

export function startDrag(e, slotIdx, el) {
  if (state.gameOver || !state.trayTiles[slotIdx] || state.activeItem) return;
  if (state.isTutorial && state.tutorialSequence[state.tutorialStep] && state.tutorialSequence[state.tutorialStep].trayIdx !== slotIdx) return;
  e.preventDefault();
  playSound('ClickTile', false, 0.8);
  _beginDrag(slotIdx, el);
  positionGhost(e.clientX, e.clientY);
  highlightHexUnder(e.clientX, e.clientY);
  document.addEventListener('mousemove', onDragMove);
  document.addEventListener('mouseup', onDragEnd);
}

export function startDragTouch(e, slotIdx, el) {
  if (state.gameOver || !state.trayTiles[slotIdx] || state.activeItem) return;
  if (state.isTutorial && state.tutorialSequence[state.tutorialStep] && state.tutorialSequence[state.tutorialStep].trayIdx !== slotIdx) return;
  e.preventDefault();
  playSound('ClickTile', false, 0.8);
  const touch = e.touches[0];
  _beginDrag(slotIdx, el);
  positionGhost(touch.clientX, touch.clientY);
  highlightHexUnder(touch.clientX, touch.clientY);
  document.addEventListener('touchmove', onDragMoveTouch, { passive: false });
  document.addEventListener('touchend', onDragEndTouch);
}

function _beginDrag(slotIdx, el) {
  isDragging = true;
  dragInfo = { slotIdx, el };
  ghostEl.innerHTML = el.innerHTML;
  ghostEl.style.display = 'block';
  ghostEl.style.width = el.offsetWidth + 'px';
  ghostEl.style.height = el.offsetHeight + 'px';
  ghostEl.style.opacity = '0.9';
  ghostEl.style.transition = 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)';
  ghostEl.style.transform = 'scale(1.15) translateY(-8px)';
  el.style.opacity = '0.3';
  
  const textBox = document.getElementById('tutorial-text-box');
  if (textBox) textBox.remove();
}

const DRAG_OFFSET_Y = 75; // Parmağın altında kalmaması için yukarı kaydırma

function positionGhost(x, y) {
  ghostEl.style.left = (x - ghostEl.offsetWidth / 2) + 'px';
  ghostEl.style.top = (y - DRAG_OFFSET_Y - ghostEl.offsetHeight / 2) + 'px';
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
  document.removeEventListener('mouseup', onDragEnd);
}

function onDragEndTouch(e) {
  if (!isDragging) return;
  const touch = e.changedTouches[0];
  finishDrop(touch.clientX, touch.clientY);
  cleanupDrag();
  document.removeEventListener('touchmove', onDragMoveTouch);
  document.removeEventListener('touchend', onDragEndTouch);
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
  if (!dragInfo) return;

  const { slotIdx } = dragInfo;
  const tile = state.trayTiles[slotIdx];
  if (!tile) return;

  // Tile'ın görsel merkezi parmağın DRAG_OFFSET_Y kadar üstünde
  const visualY = y - DRAG_OFFSET_Y;
  
  const scale = state.gridScale || 1;
  const newTargetKeys = findBestTargetForTile(x, visualY, tile, scale);
  const isHoveringTarget = newTargetKeys.length > 0;

  const newTargetStr = newTargetKeys.join('|');
  const currentTargetStr = highlightedKeys.join('|');

  // DOM thrashing'i önlemek için sadece hedef değiştiğinde işlemleri uygula
  if (newTargetStr !== currentTargetStr) {
    clearHighlights();
    highlightedKeys = newTargetKeys;
    
    highlightedKeys.forEach(k => {
      state.cellElements[k]?.div.classList.add('drop-target');
    });

    if (isHoveringTarget) {
      _runMergePreview(tile);
    }
  }

  if (isHoveringTarget) {
    ghostEl.style.transform = `scale(${state.gridScale || 1}) translateY(0px)`;
  } else {
    ghostEl.style.transform = 'scale(1.15) translateY(-8px)';
  }
}

function _runMergePreview(tile) {
  if (highlightedKeys.length === 0) return;

  const [k0, k1] = highlightedKeys;
  // Geçici olarak yerleştir
  state.grid[k0] = tile.value;
  if (k1 && tile.secondValue) state.grid[k1] = tile.secondValue;

  const toPreview = new Set();
  
  // İlk parça için
  const group0 = floodFill(k0, tile.value);
  // Birleşme için en az 3 şartını (yeni yerleştirme) kontrol et
  if (group0.length >= 3) group0.forEach(k => toPreview.add(k));

  // Varsa ikinci parça için
  if (k1 && tile.secondValue) {
    const group1 = floodFill(k1, tile.secondValue);
    if (group1.length >= 3) group1.forEach(k => toPreview.add(k));
  }

  // Grid'i eski haline getir
  state.grid[k0] = 0;
  if (k1) state.grid[k1] = 0;

  // Birleşmeye dahil olacak mevcut taşları işaretle (hoverlananlar hariç)
  toPreview.forEach(k => {
    if (!highlightedKeys.includes(k)) {
      state.cellElements[k]?.div.classList.add('merge-preview');
      previewActiveKeys.push(k);
    }
  });
}

function clearHighlights() {
    highlightedKeys.forEach(k => {
      state.cellElements[k]?.div.classList.remove('drop-target');
    });
    highlightedKeys = [];

    previewActiveKeys.forEach(k => {
      state.cellElements[k]?.div.classList.remove('merge-preview');
    });
    previewActiveKeys = [];
  }

  function findBestTargetForTile(screenX, screenY, tile, scale) {
    const gridEl = document.getElementById('hex-grid');
    const rect = gridEl.getBoundingClientRect();
    const lx = (screenX - rect.left) / scale;
    const ly = (screenY - rect.top) / scale;

    let bestKeys = [];
    let bestDist = Infinity;
    // Yakalama çapını biraz daralttık (çok agresif çekmemesi için)
    const MAX_SNAP_DIST = HEX_SIZE * 1.8;

    if (!tile.double) {
      Object.entries(state.cellElements).forEach(([key, { cx, cy }]) => {
        if (state.grid[key] !== 0) return; // Dolu petekleri tamamen devredışı bırak (üstünü atla)
        if (state.isTutorial && state.tutorialSequence[state.tutorialStep] && state.tutorialSequence[state.tutorialStep].targetKey !== key) return;

        const d = Math.hypot(lx - cx, ly - cy);
        if (d < bestDist) { bestDist = d; bestKeys = [key]; }
      });
      return bestDist < MAX_SNAP_DIST ? bestKeys : [];
    } else {
      Object.entries(state.cellElements).forEach(([key0, el0]) => {
        if (state.grid[key0] !== 0) return;
        if (state.isTutorial && state.tutorialSequence[state.tutorialStep] && state.tutorialSequence[state.tutorialStep].targetKey !== key0) return;

        const [q, r] = key0.split(',').map(Number);
        let q1, r1;
        if (tile.orientation === 'H') {
          q1 = q + 1;
          r1 = r;
        } else {
          q1 = q - 1;
          r1 = r + 1; // Çift parçanın diagonal/vertical komşusu
        }
        const key1 = `${q1},${r1}`;

        if (state.grid[key1] === undefined || state.grid[key1] !== 0) return;

        const el1 = state.cellElements[key1];
        const midX = (el0.cx + el1.cx) / 2;
        const midY = (el0.cy + el1.cy) / 2;

        const d = Math.hypot(lx - midX, ly - midY);
        // Bu iki boş parçanın (merkezinin) imlece (ghost merkeze) olan mesafesi 
        if (d < bestDist) { bestDist = d; bestKeys = [key0, key1]; }
      });
      return bestDist < MAX_SNAP_DIST ? bestKeys : [];
    }
  }

  function finishDrop(x, y) {
    if (highlightedKeys.length === 0 || !dragInfo) return;
    const { slotIdx } = dragInfo;
    const tile = state.trayTiles[slotIdx];
    if (!tile) return;
    if (_onDrop) _onDrop(highlightedKeys, tile, slotIdx);
  }
