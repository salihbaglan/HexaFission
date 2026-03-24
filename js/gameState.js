// ==================== GAME STATE ====================
// Single source of truth for all mutable game state.
// All modules import this object and mutate it directly.

import { MAX_LIVES, GRID_RADIUS } from './config.js';
import { generateHexPositions } from './hexMath.js';

export const state = {
  grid: {},            // key: "q,r" => value (number) or 0
  lives: MAX_LIVES,
  score: 0,
  bestScore: parseInt(localStorage.getItem('hex2048best') || '0'),
  trayTiles: [null, null, null], // each: { value, double, secondValue, el }
  gameOver: false,
  maxGridVal: 2,
  hexPositions: generateHexPositions(GRID_RADIUS),
  cellElements: {},    // "q,r" => { div, val, poly, corners, cx, cy }
  gridOffsetX: 0,
  gridOffsetY: 0,
  
  // Items
  itemChangeCount: 5,
  itemRemoveCount: 5,
  activeItem: null,       // 'CHANGE' or 'REMOVE' or null
  changeSourceKey: null,  // stores the first clicked hex key when swapping
  
  // Tutorial
  isTutorial: localStorage.getItem('tutorialCompleted') !== 'true',
  tutorialStep: 0,
  tutorialSequence: [
    { trayIdx: 1, targetKey: "0,0" },
    { trayIdx: 2, targetKey: "1,0" },
    { trayIdx: 0, targetKey: "0,1" },
    { trayIdx: 1, targetKey: "-1,1" },
    { trayIdx: 2, targetKey: "1,1" },
  ],
};
