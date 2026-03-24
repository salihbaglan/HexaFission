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
};
