// ==================== CONFIG ====================
export const GRID_RADIUS = 4; // radius in hexes
export const HEX_SIZE = 30;   // px, pointy-top
export const MAX_LIVES = 5;

export const TILE_COLORS = {
  2:    { bg: '#4fc3f7', shadow: '#0288d1' },
  4:    { bg: '#f5a623', shadow: '#c47d0e' },
  8:    { bg: '#e06c54', shadow: '#b5432a' },
  16:   { bg: '#9b59b6', shadow: '#6c3483' },
  32:   { bg: '#2ecc71', shadow: '#1a7a44' },
  64:   { bg: '#e74c3c', shadow: '#922b21' },
  128:  { bg: '#f39c12', shadow: '#9a6200' },
  256:  { bg: '#1abc9c', shadow: '#0e6655' },
  512:  { bg: '#3498db', shadow: '#1a5276' },
  1024: { bg: '#e91e63', shadow: '#880e4f' },
  2048: { bg: '#ffd700', shadow: '#b8860b' },
  4096: { bg: '#00bcd4', shadow: '#006064' },
  8192: { bg: '#ff5722', shadow: '#bf360c' },
};

export function getTileColor(val) {
  if (TILE_COLORS[val]) return TILE_COLORS[val];
  return { bg: '#7986cb', shadow: '#3949ab' };
}
