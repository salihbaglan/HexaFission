// ==================== MERGE LOGIC ====================
import { HEX_SIZE } from './config.js';
import { hexNeighbors } from './hexMath.js';
import { state } from './gameState.js';
import { updateGridDisplay } from './grid.js';
import { playMergeSound } from './audio.js';

// Ana merge fonksiyonu — async, animasyonlu ve flood-fill tabanlı
export async function doMerges(newKeys = []) {
  let anyMerged = true;
  let isCascade = false; // İlk turda false (kullanıcı koydu), zincirlemede true
  let cascadeCenter = null; // Zincirlemede yeni taşın oluştuğu yer

  while (anyMerged) {
    anyMerged = false;

    // Her sayı değeri için komşu küme bul (flood-fill)
    const visited = new Set();

    for (const key of Object.keys(state.grid)) {
      if (!state.grid[key] || visited.has(key)) continue;

      const targetVal = state.grid[key];
      const group = floodFill(key, targetVal);

      // Kural: Kullanıcı taş koyduğunda (veya ilgisiz bir yerde) en az 3 taş yan yana olmalı.
      // SADECE bir önceki merge sonucu oluşan taşın (cascadeCenter) etrafındaysa 2 taş yetmeli.
      const isCascadeGroup = isCascade && cascadeCenter && group.includes(cascadeCenter);
      const minRequired = isCascadeGroup ? 2 : 3;

      if (group.length < minRequired) continue; // Yetersiz grup

      anyMerged = true;

      // Merkez hücre seçimi
      let targetKey = group[0];
      if (isCascade && cascadeCenter && group.includes(cascadeCenter)) {
        // Zincirlemede merkez yeni oluşan taştır
        targetKey = cascadeCenter;
      } else {
        // İlk turda kullanıcının koyduğu yeni taşlardan biri merkez olmalı
        for (const k of newKeys) {
          if (group.includes(k)) {
            targetKey = k;
            break;
          }
        }
      }

      await animateMerge(group, targetKey);

      // Skoru hesapla ve uygula — her zaman value * 2 (2048 kuralı)
      const newVal = targetVal * 2;
      group.forEach(k => {
        state.grid[k] = 0;
        visited.add(k);
      });
      state.grid[targetKey] = newVal;
      
      cascadeCenter = targetKey;

      addScore(newVal); 
      playMergeSound();
      showMergeBurst(targetKey);
      showScorePop(newVal, state.cellElements[targetKey]);

      updateGridDisplay();
      await sleep(150);
      break; 
    }

    if (anyMerged) isCascade = true;
  }
}

// Aynı değer ve bitişik hücreleri bul (BFS flood-fill)
function floodFill(startKey, val) {
  const group = [];
  const queue = [startKey];
  const seen  = new Set([startKey]);

  while (queue.length) {
    const key = queue.shift();
    if (state.grid[key] !== val) continue;
    group.push(key);

    const [q, r] = key.split(',').map(Number);
    for (const [nq, nr] of hexNeighbors(q, r)) {
      const nkey = `${nq},${nr}`;
      if (!seen.has(nkey) && state.grid[nkey] === val) {
        seen.add(nkey);
        queue.push(nkey);
      }
    }
  }
  return group;
}

// Taşların hedef hücreye doğru kayma animasyonu
function animateMerge(group, targetKey) {
  return new Promise(resolve => {
    const gridEl  = document.getElementById('hex-grid');
    const rect    = gridEl.getBoundingClientRect();
    const tCell   = state.cellElements[targetKey];
    const targetX = rect.left + tCell.cx;
    const targetY = rect.top  + tCell.cy;

    const DURATION = 200; // ms
    let done = 0;

    group.forEach(key => {
      if (key === targetKey) { done++; if (done === group.length) resolve(); return; }

      const cell = state.cellElements[key];
      const startX = rect.left + cell.cx;
      const startY = rect.top  + cell.cy;
      const size   = HEX_SIZE * 2;

      const ghost = document.createElement('div');
      ghost.style.cssText = `
        position: fixed;
        width: ${size}px; height: ${size}px;
        left: ${startX - size / 2}px;
        top:  ${startY - size / 2}px;
        background: ${cell.div.style.background};
        clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
        pointer-events: none;
        z-index: 999;
        transition: left ${DURATION}ms ease, top ${DURATION}ms ease, opacity ${DURATION}ms ease;
        opacity: 1;
      `;
      document.body.appendChild(ghost);

      // Temporarily hide source tile
      cell.div.style.opacity = '0';

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          ghost.style.left    = (targetX - size / 2) + 'px';
          ghost.style.top     = (targetY - size / 2) + 'px';
          ghost.style.opacity = '0';

          setTimeout(() => {
            ghost.remove();
            cell.div.style.opacity = '1';
            done++;
            if (done === group.length) resolve();
          }, DURATION);
        });
      });
    });
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
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
  const rect   = gridEl.getBoundingClientRect();

  const burst = document.createElement('div');
  burst.className = 'merge-burst';
  const bSize = HEX_SIZE * 2.5;
  burst.style.cssText = `
    width:${bSize}px; height:${bSize}px;
    border-radius:50%;
    background: radial-gradient(circle, rgba(255,255,180,0.9), transparent 70%);
    left:${rect.left + cx - bSize / 2}px;
    top:${rect.top + cy - bSize / 2}px;
    position:fixed;
    pointer-events: none;
  `;
  document.body.appendChild(burst);
  setTimeout(() => burst.remove(), 500);
}

export function showScorePop(val, cellInfo) {
  const gridEl = document.getElementById('hex-grid');
  const rect   = gridEl.getBoundingClientRect();
  const pop    = document.createElement('div');
  pop.className   = 'score-pop';
  pop.textContent = '+' + val;
  pop.style.left  = (rect.left + cellInfo.cx - 20) + 'px';
  pop.style.top   = (rect.top  + cellInfo.cy - 20) + 'px';
  pop.style.fontSize = val >= 512 ? '24px' : '18px';
  document.body.appendChild(pop);
  setTimeout(() => pop.remove(), 1000);
}
