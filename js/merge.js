// ==================== MERGE LOGIC ====================
import { HEX_SIZE, getTileColor, get3DTileBackground } from './config.js';
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

      // Animasyon: diğer taşları merkeze kaydır (sırayla)
      await animateMerge(group, targetKey, targetVal);

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
      
      const colInfo = getTileColor(newVal);
      showMergeBurst(targetKey, colInfo.bg);
      showScorePop(newVal, state.cellElements[targetKey]);

      updateGridDisplay();
      await sleep(150);
      break; 
    }

    if (anyMerged) isCascade = true;
  }
}

// Aynı değer ve bitişik hücreleri bul (BFS flood-fill)
export function floodFill(startKey, val) {
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

// BFS ağacı ile merkeze en kısa yolu hesapla (yılan gibi kayması için)
function getMergePaths(group, targetKey) {
  const paths = new Map();
  const dists = new Map();
  
  const queue = [targetKey];
  dists.set(targetKey, 0);
  paths.set(targetKey, null);
  
  const groupSet = new Set(group);
  
  while (queue.length > 0) {
    const curr = queue.shift();
    const d = dists.get(curr);
    
    const [q, r] = curr.split(',').map(Number);
    for (const [nq, nr] of hexNeighbors(q, r)) {
      const nkey = `${nq},${nr}`;
      if (groupSet.has(nkey) && !dists.has(nkey)) {
        dists.set(nkey, d + 1);
        paths.set(nkey, curr);
        queue.push(nkey);
      }
    }
  }
  return { paths, dists };
}

// Taşların birbirinin içine sırayla kaydığı animasyon
async function animateMerge(group, targetKey, val) {
  const { paths, dists } = getMergePaths(group, targetKey);
  const maxDist = Math.max(0, ...Array.from(dists.values()));
  
  const gridEl = document.getElementById('hex-grid');
  const rect   = gridEl.getBoundingClientRect();
  const DURATION = 150; // her adımın ms süresi

  const ghosts = {};
  const col = getTileColor(val);
  const size = HEX_SIZE * 2;

  // Asıl taşları sakla ve sahte ghost'lar oluştur
  group.forEach(k => {
    state.cellElements[k].div.style.opacity = '0'; // orijinali gizle
    
    // Bütün noktalar için (hedef dahil) ghost oluştur ki animasyon süresince boş görünmesinler
    const cell = state.cellElements[k];
    const startX = rect.left + cell.cx;
    const startY = rect.top  + cell.cy;
    
    const ghost = document.createElement('div');
    ghost.className = 'tile-piece'; // şekli css'ten alması için
    ghost.style.cssText = `
      position: fixed;
      width: ${size}px; height: ${size}px;
      left: ${startX - size / 2}px; top: ${startY - size / 2}px;
      background: ${get3DTileBackground(col.bg, col.shadow)};
      clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
      display: flex; align-items: center; justify-content: center;
      font-weight: 900; font-size: ${val >= 1000 ? '11px' : val >= 100 ? '13px' : '15px'}; color: white;
      pointer-events: none; z-index: 50;
      transition: left ${DURATION}ms ease, top ${DURATION}ms ease;
    `;
    ghost.textContent = val;
    document.body.appendChild(ghost);
    ghosts[k] = ghost;
  });

  // En uzaktan yavaşça merkeze doğru birer birer hareket ettir
  for (let d = maxDist; d > 0; d--) {
    const nodesAtD = group.filter(k => dists.get(k) === d);
    
    // d uzaklığındaki taşları, kendi parent'ı olan d-1 taşına doğru kaydır
    nodesAtD.forEach(k => {
      const parentKey = paths.get(k);
      const parentCell = state.cellElements[parentKey];
      const targetX = rect.left + parentCell.cx;
      const targetY = rect.top  + parentCell.cy;
      
      const ghost = ghosts[k];
      if (ghost) {
        ghost.style.left = (targetX - size / 2) + 'px';
        ghost.style.top  = (targetY - size / 2) + 'px';
      }
    });
    
    await sleep(DURATION); // animasyonu bekle
    
    // Hareketi biten taşları yokederek birleşme hissi ver
    nodesAtD.forEach(k => {
      if (ghosts[k]) {
        ghosts[k].remove();
        delete ghosts[k];
      }
    });
  }

  // Kalan ghost'ları temizle (target olan ve hiç hareket etmeyen vb.)
  Object.values(ghosts).forEach(ghost => ghost.remove());

  // Animasyon bitince asıl hücreleri tekrar geri yükle
  group.forEach(k => {
    state.cellElements[k].div.style.opacity = '1';
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

export function showMergeBurst(key, colorStr) {
  const { cx, cy } = state.cellElements[key];
  const gridEl = document.getElementById('hex-grid');
  const rect   = gridEl.getBoundingClientRect();

  const burst = document.createElement('div');
  burst.className = 'merge-burst';
  const bSize = HEX_SIZE * 2.5;
  burst.style.cssText = `
    width:${bSize}px; height:${bSize}px;
    border-radius:50%;
    background: radial-gradient(circle, ${colorStr} 30%, transparent 80%);
    left:${rect.left + cx - bSize / 2}px;
    top:${rect.top + cy - bSize / 2}px;
    position:fixed;
    pointer-events: none;
    z-index: 100;
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
