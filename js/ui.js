import { musicOn, sfxOn, setMusicOn, setSfxOn, startBgMusic, stopBgMusic, playSound } from './audio.js';
import { state } from './gameState.js';
import { createTileElement } from './tray.js';
import { HEX_SIZE } from './config.js';

/** Call once from game.js to register the restart handler */
let _onRestart = null;

export function initUI(onRestartCallback) {
  _onRestart = onRestartCallback;

  // Settings Panel
  document.getElementById('settings-btn').addEventListener('click', () => {
    playSound('uiClick', false, 0.8);
    document.getElementById('settings-panel').classList.add('open');
  });

  document.getElementById('close-settings').addEventListener('click', () => {
    playSound('uiClick', false, 0.8);
    document.getElementById('settings-panel').classList.remove('open');
  });

  // Toggles
  document.getElementById('toggle-music').addEventListener('click', function() {
    setMusicOn(!musicOn);
    this.classList.toggle('on', musicOn);
    if (musicOn) startBgMusic();
    else stopBgMusic();
  });

  document.getElementById('toggle-sfx').addEventListener('click', function() {
    setSfxOn(!sfxOn);
    this.classList.toggle('on', sfxOn);
  });

  document.getElementById('toggle-vib').addEventListener('click', function() {
    this.classList.toggle('on');
  });

  // Restart buttons
  document.getElementById('restart-btn').addEventListener('click', () => {
    playSound('uiClick', false, 0.8);
    document.getElementById('settings-panel').classList.remove('open');
    if (_onRestart) _onRestart();
  });

  document.getElementById('play-again-btn').addEventListener('click', () => {
    document.getElementById('overlay').classList.remove('show');
    if (_onRestart) _onRestart();
  });
}

export function updateTutorialUI() {
  if (!state.isTutorial) return;
  const seq = state.tutorialSequence[state.tutorialStep];
  if (!seq) return;

  const tile = state.trayTiles[seq.trayIdx];
  if (!tile || !tile.el) {
    clearTutorialUI();
    return;
  }

  let hand = document.getElementById('tutorial-hand');
  if (!hand) {
    hand = document.createElement('img');
    hand.id = 'tutorial-hand';
    hand.src = 'assets/images/hand.png';
    hand.style.position = 'fixed';
    hand.style.left = '0px';
    hand.style.top = '0px';
    hand.style.width = '60px';
    hand.style.height = '60px';
    hand.style.pointerEvents = 'none';
    hand.style.zIndex = '9900';
    hand.style.transition = 'transform 1s ease-in-out';
    document.body.appendChild(hand);
  }

  const rectStart = tile.el.getBoundingClientRect();
  const startX = rectStart.left + rectStart.width / 2;
  const startY = rectStart.top + rectStart.height / 2;

  const cell = state.cellElements[seq.targetKey];
  if (!cell) return;

  let offsetX = 0;
  let offsetY = 0;
  if (tile.double) {
    if (tile.orientation === 'H') {
      offsetX = (HEX_SIZE * Math.sqrt(3)) / 2;
    } else {
      offsetX = -(HEX_SIZE * Math.sqrt(3) / 2) / 2;
      offsetY = (HEX_SIZE * 1.5) / 2;
    }
  }

  const ghostGridX = cell.cx + offsetX;
  const ghostGridY = cell.cy + offsetY;

  let ghost = document.getElementById('tutorial-ghost');
  if (ghost) ghost.remove();
  
  ghost = createTileElement(tile, -1);
  ghost.id = 'tutorial-ghost';
  ghost.style.position = 'absolute';
  ghost.style.pointerEvents = 'none';
  ghost.style.opacity = '0.4';
  ghost.style.zIndex = '40';
  const offset = HEX_SIZE * 1.8;
  ghost.style.left = (ghostGridX - offset) + 'px';
  ghost.style.top = (ghostGridY - offset) + 'px';
  document.getElementById('hex-grid').appendChild(ghost);
  
  const gridEl = document.getElementById('hex-grid');
  const gridRect = gridEl.getBoundingClientRect();
  const scale = state.gridScale || 1;
  const endX = gridRect.left + (ghostGridX * scale);
  const endY = gridRect.top + (ghostGridY * scale) + 10;

  if (hand.animInterval) clearInterval(hand.animInterval);
  
  // Set initial position immediately without transition
  hand.style.transition = 'none';
  hand.style.transform = `translate(${startX}px, ${startY}px)`;
  
  // Force reflow
  void hand.offsetWidth;
  hand.style.transition = 'transform 1s ease-in-out';
  
  let moveToTarget = true;
  hand.animInterval = setInterval(() => {
    if (moveToTarget) {
      hand.style.transform = `translate(${endX}px, ${endY}px)`;
    } else {
      hand.style.transform = `translate(${startX}px, ${startY}px)`;
    }
    moveToTarget = !moveToTarget;
  }, 1200);

  // Trigger first move immediately
  setTimeout(() => {
    hand.style.transform = `translate(${endX}px, ${endY}px)`;
  }, 50);

  let textBox = document.getElementById('tutorial-text-box');
  if (state.tutorialStep === 0) {
    if (!textBox) {
      textBox = document.createElement('div');
      textBox.id = 'tutorial-text-box';
      textBox.style.position = 'fixed';
      textBox.style.top = '22%';
      textBox.style.left = '50%';
      textBox.style.transform = 'translate(-50%, -50%)';
      textBox.style.color = '#ffffff';
      textBox.style.textShadow = '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 0 4px 16px rgba(0,0,0,0.6)';
      textBox.style.fontWeight = '900';
      textBox.style.fontSize = 'clamp(36px, 8vmin, 54px)';
      textBox.style.textAlign = 'center';
      textBox.style.zIndex = '9900';
      textBox.style.pointerEvents = 'none';
      document.body.appendChild(textBox);
    }
    textBox.innerHTML = 'Drag!';
  } else if (textBox) {
    textBox.remove();
  }
}

export function clearTutorialUI() {
  const hand = document.getElementById('tutorial-hand');
  if (hand) {
    if (hand.animInterval) clearInterval(hand.animInterval);
    hand.remove();
  }
  const ghost = document.getElementById('tutorial-ghost');
  if (ghost) ghost.remove();
  const textBox = document.getElementById('tutorial-text-box');
  if (textBox) textBox.remove();
}

export function showItemTooltip(msg, btnId) {
  const existing = document.getElementById('item-tooltip');
  if (existing) existing.remove();

  const tooltip = document.createElement('div');
  tooltip.id = 'item-tooltip';
  tooltip.innerHTML = `
    <div style="
      background: rgba(231, 76, 60, 0.95);
      color: white;
      padding: 10px 16px;
      border-radius: 14px;
      font-weight: 900;
      font-size: 14px;
      position: relative;
      text-align: center;
      line-height: 1.2;
    ">
      ${msg}
      <!-- Triangle pointing down -->
      <div style="
        content: '';
        position: absolute;
        bottom: -7px;
        left: 50%;
        transform: translateX(-50%);
        border-width: 8px 8px 0;
        border-style: solid;
        border-color: rgba(231, 76, 60, 0.95) transparent transparent transparent;
      "></div>
    </div>
  `;
  
  tooltip.style.position = 'fixed';
  tooltip.style.pointerEvents = 'none';
  tooltip.style.zIndex = '10000';
  tooltip.style.transformOrigin = 'bottom center';
  tooltip.style.transform = 'scale(0.3) translateY(20px)';
  tooltip.style.opacity = '0';
  tooltip.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease-out';
  
  document.body.appendChild(tooltip);

  const btn = document.getElementById(btnId);
  const rect = btn.getBoundingClientRect();
  
  const tooltipWidth = tooltip.offsetWidth;
  const tooltipHeight = tooltip.offsetHeight;
  
  const btnCenterX = rect.left + rect.width / 2;
  const topPos = rect.top - tooltipHeight - 4; // 4px spacing
  
  tooltip.style.left = Math.max(10, (btnCenterX - tooltipWidth / 2)) + 'px';
  tooltip.style.top = topPos + 'px';

  // Force reflow and animate in
  void tooltip.offsetWidth;
  tooltip.style.transform = 'scale(1) translateY(0)';
  tooltip.style.opacity = '1';

  setTimeout(() => {
    tooltip.style.transform = 'scale(0.3) translateY(20px)';
    tooltip.style.opacity = '0';
    setTimeout(() => tooltip.remove(), 400);
  }, 2000);
}
