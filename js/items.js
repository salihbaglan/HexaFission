// ==================== ITEMS LOGIC ====================
import { state } from './gameState.js';
import { updateGridDisplay } from './grid.js';
import { playSound } from './audio.js';
import { doMerges } from './merge.js';


export function initItems() {
  const btnChange = document.getElementById('item-change-btn');
  const btnRemove = document.getElementById('item-remove-btn');

  btnChange.addEventListener('click', () => toggleItem('CHANGE', btnChange));
  btnRemove.addEventListener('click', () => toggleItem('REMOVE', btnRemove));
  
  updateItemUI();
}

function toggleItem(itemType, btnEl) {
  if (state.gameOver) return;
  playSound('ClickTile', false, 0.5);

  if (state.activeItem === itemType) {
    // Cancel the current item
    state.activeItem = null;
    state.changeSourceKey = null;
    clearSourceHighlight();
  } else {
    // Ensure the item has uses left
    if (itemType === 'CHANGE' && state.itemChangeCount <= 0) return;
    if (itemType === 'REMOVE' && state.itemRemoveCount <= 0) return;

    // Activate item
    state.activeItem = itemType;
    state.changeSourceKey = null;
    clearSourceHighlight();
  }
  updateItemUI();
}

export function updateItemUI() {
  const btnChange = document.getElementById('item-change-btn');
  const countChange = document.getElementById('count-change');
  const btnRemove = document.getElementById('item-remove-btn');
  const countRemove = document.getElementById('count-remove');

  countChange.textContent = state.itemChangeCount;
  countRemove.textContent = state.itemRemoveCount;

  // Toggle active styling
  btnChange.classList.toggle('active-item', state.activeItem === 'CHANGE');
  btnRemove.classList.toggle('active-item', state.activeItem === 'REMOVE');

  // Toggle disabled state if 0 uses left
  btnChange.classList.toggle('disabled', state.itemChangeCount <= 0 && state.activeItem !== 'CHANGE');
  btnRemove.classList.toggle('disabled', state.itemRemoveCount <= 0 && state.activeItem !== 'REMOVE');
}

function clearSourceHighlight() {
  Object.values(state.cellElements).forEach(cell => {
    cell.div.classList.remove('item-source-highlight');
  });
}

export async function handleItemClick(key) {
  if (!state.activeItem || state.gameOver) return;

  const cellVal = state.grid[key];

  if (state.activeItem === 'REMOVE') {
    // Can only remove filled cells
    if (cellVal === 0) return;
    
    state.grid[key] = 0;
    state.itemRemoveCount--;
    state.activeItem = null;
    
    playSound('ClickTile', false, 0.8);
    updateItemUI();
    updateGridDisplay();
    
    // We don't trigger cascade for removal in this logic unless required by specific variant.
    // If we have to, we just rely on grid updates.

    // Import hack: just trigger custom event or callback?
  } 
  else if (state.activeItem === 'CHANGE') {
    if (!state.changeSourceKey) {
      // Step 1: Select source
      if (cellVal === 0) return; // must select a filled hex
      state.changeSourceKey = key;
      state.cellElements[key].div.classList.add('item-source-highlight');
      playSound('ClickTile', false, 0.8);
    } 
    else {
      // Step 2: Select target
      const srcKey = state.changeSourceKey;
      if (srcKey === key) {
        // Clicked same hex - unselect
        state.changeSourceKey = null;
        clearSourceHighlight();
        playSound('ClickTile', false, 0.5);
        return;
      }

      // Swap the values
      const tgtVal = state.grid[key];
      const srcVal = state.grid[srcKey];
      
      state.grid[key] = srcVal;
      state.grid[srcKey] = tgtVal;
      
      state.itemChangeCount--;
      state.activeItem = null;
      state.changeSourceKey = null;
      
      clearSourceHighlight();
      playSound('TilePlaced', false, 0.8);
      
      updateItemUI();
      updateGridDisplay();
      
      // Trigger a merge check asynchronously!
      // Provide the newly modified keys so that merges can be computed accurately
      setTimeout(async () => {
        await doMerges([srcKey, key]);
        updateMaxGridVal();
      }, 300);
    }
  }
}

// Simple helper to update max grid val since we can't easily import it without circular dependencies.
function updateMaxGridVal() {
  let max = 2;
  Object.values(state.grid).forEach(v => { if (v > max) max = v; });
  state.maxGridVal = max;
}
