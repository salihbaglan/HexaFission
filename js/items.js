// ==================== ITEMS LOGIC ====================
import { state } from './gameState.js';
import { updateGridDisplay } from './grid.js';
import { playSound } from './audio.js';
import { doMerges } from './merge.js';

const STORAGE_KEY_CHANGE = 'hex2048_itemChange';
const STORAGE_KEY_REMOVE = 'hex2048_itemRemove';

// Which item type triggered the ad (used in callback)
let _pendingAdItem = null;

// ── Init ────────────────────────────────────────────────────────────────
export function initItems() {
  // Load persisted counts
  const savedChange = parseInt(localStorage.getItem(STORAGE_KEY_CHANGE));
  const savedRemove = parseInt(localStorage.getItem(STORAGE_KEY_REMOVE));
  if (!isNaN(savedChange)) state.itemChangeCount = savedChange;
  if (!isNaN(savedRemove)) state.itemRemoveCount = savedRemove;

  document.getElementById('item-change-btn').addEventListener('click', () => onItemBtnClick('CHANGE'));
  document.getElementById('item-remove-btn').addEventListener('click', () => onItemBtnClick('REMOVE'));

  // Rewarded ad callback hook – bridge calls window.SPlay.onRewardedComplete(state)
  const _origOnRewarded = window.SPlay?.onRewardedComplete;
  if (window.SPlay) {
    window.SPlay.onRewardedComplete = function(adState) {
      if (adState === 'rewarded' && _pendingAdItem) {
        _grantAdReward(_pendingAdItem);
      }
      _pendingAdItem = null;
      // Call original if existed
      if (typeof _origOnRewarded === 'function') _origOnRewarded(adState);
    };
  }

  initAdOfferModal();
  updateItemUI();
}

// ── Button click ─────────────────────────────────────────────────────────
function onItemBtnClick(itemType) {
  if (state.gameOver) return;
  playSound('ClickTile', false, 0.5);

  const count = itemType === 'CHANGE' ? state.itemChangeCount : state.itemRemoveCount;

  if (count <= 0) {
    // Offer ad instead of activating
    _showAdOffer(itemType);
    return;
  }

  if (state.activeItem === itemType) {
    // Cancel
    state.activeItem = null;
    state.changeSourceKey = null;
    clearSourceHighlight();
  } else {
    state.activeItem = itemType;
    state.changeSourceKey = null;
    clearSourceHighlight();
  }
  updateItemUI();
}

// ── Ad offer modal ───────────────────────────────────────────────────────
function _showAdOffer(itemType) {
  _pendingAdItem = itemType;
  const label = itemType === 'CHANGE' ? 'Mover' : 'Eraser'; // user-friendly english names
  const modal = document.getElementById('ad-offer-modal');
  document.getElementById('ad-offer-text').textContent =
    `You're out of ${label} uses! Watch a short ad to get +3 free uses.`;
  modal.classList.add('show');
}

function initAdOfferModal() {
  document.getElementById('ad-offer-watch').addEventListener('click', () => {
    document.getElementById('ad-offer-modal').classList.remove('show');
    // Trigger rewarded ad via bridge
    if (typeof window.showRewarded === 'function') {
      window.showRewarded();
    } else {
      // fallback: simulate reward in dev
      console.log('No native bridge found, simulating reward...');
      _grantAdReward(_pendingAdItem);
      _pendingAdItem = null;
    }
  });
  document.getElementById('ad-offer-cancel').addEventListener('click', () => {
    document.getElementById('ad-offer-modal').classList.remove('show');
    _pendingAdItem = null;
  });
}

function _grantAdReward(itemType) {
  if (itemType === 'CHANGE') {
    state.itemChangeCount += 3;
    localStorage.setItem(STORAGE_KEY_CHANGE, state.itemChangeCount);
  } else if (itemType === 'REMOVE') {
    state.itemRemoveCount += 3;
    localStorage.setItem(STORAGE_KEY_REMOVE, state.itemRemoveCount);
  }
  updateItemUI();
}

// ── Persist and UI ───────────────────────────────────────────────────────
function _saveItemCounts() {
  localStorage.setItem(STORAGE_KEY_CHANGE, state.itemChangeCount);
  localStorage.setItem(STORAGE_KEY_REMOVE, state.itemRemoveCount);
}

export function updateItemUI() {
  document.getElementById('count-change').textContent = state.itemChangeCount;
  document.getElementById('count-remove').textContent = state.itemRemoveCount;

  const btnChange = document.getElementById('item-change-btn');
  const btnRemove = document.getElementById('item-remove-btn');

  btnChange.classList.toggle('active-item', state.activeItem === 'CHANGE');
  btnRemove.classList.toggle('active-item', state.activeItem === 'REMOVE');

  // Remove totally disabled visuals if they can watch an ad, 
  // but if 0 count, we just show 0 and disable the hover scale until they get more
  btnChange.style.opacity = (state.itemChangeCount <= 0 && state.activeItem !== 'CHANGE') ? '0.6' : '1';
  btnRemove.style.opacity = (state.itemRemoveCount <= 0 && state.activeItem !== 'REMOVE') ? '0.6' : '1';
}

export function clearSourceHighlight() {
  Object.values(state.cellElements).forEach(cell => {
    cell.div.classList.remove('item-source-highlight');
  });
}

// ── Grid click handler ───────────────────────────────────────────────────
export async function handleItemClick(key) {
  if (!state.activeItem || state.gameOver) return;

  const cellVal = state.grid[key];

  if (state.activeItem === 'REMOVE') {
    if (cellVal === 0) return;

    state.grid[key] = 0;
    state.itemRemoveCount--;
    state.activeItem = null;

    _saveItemCounts();
    playSound('ClickTile', false, 0.8);
    updateItemUI();
    updateGridDisplay();
  }
  else if (state.activeItem === 'CHANGE') {
    if (!state.changeSourceKey) {
      if (cellVal === 0) return;
      state.changeSourceKey = key;
      state.cellElements[key].div.classList.add('item-source-highlight');
      playSound('ClickTile', false, 0.8);
    } else {
      const srcKey = state.changeSourceKey;
      if (srcKey === key) {
        state.changeSourceKey = null;
        clearSourceHighlight();
        playSound('ClickTile', false, 0.5);
        return;
      }

      const tgtVal = state.grid[key];
      const srcVal = state.grid[srcKey];
      state.grid[key] = srcVal;
      state.grid[srcKey] = tgtVal;

      state.itemChangeCount--;
      state.activeItem = null;
      state.changeSourceKey = null;

      _saveItemCounts();
      clearSourceHighlight();
      playSound('TilePlaced', false, 0.8);
      updateItemUI();
      updateGridDisplay();

      setTimeout(async () => {
        await doMerges([srcKey, key]);
        _updateMaxGridVal();
      }, 300);
    }
  }
}

function _updateMaxGridVal() {
  let max = 2;
  Object.values(state.grid).forEach(v => { if (v > max) max = v; });
  state.maxGridVal = max;
}
