// ==================== GRID ====================
import { HEX_SIZE, getTileColor } from './config.js';
import { hexToPixel, hexCorners, pointsStr } from './hexMath.js';
import { state } from './gameState.js';

export function initGrid() {
  const gridEl = document.getElementById('hex-grid');
  gridEl.innerHTML = '';
  state.cellElements = {};

  // Compute bounding box
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  state.hexPositions.forEach(([q, r]) => {
    const { x, y } = hexToPixel(q, r, HEX_SIZE);
    minX = Math.min(minX, x - HEX_SIZE);
    maxX = Math.max(maxX, x + HEX_SIZE);
    minY = Math.min(minY, y - HEX_SIZE);
    maxY = Math.max(maxY, y + HEX_SIZE);
  });

  const W = maxX - minX + HEX_SIZE;
  const H = maxY - minY + HEX_SIZE;
  state.gridOffsetX = -minX + HEX_SIZE / 2;
  state.gridOffsetY = -minY + HEX_SIZE / 2;

  gridEl.style.width    = W + 'px';
  gridEl.style.height   = H + 'px';
  gridEl.style.position = 'relative';

  // Board wrap frame (thick stroke background)
  const bgSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  bgSvg.style.position = 'absolute';
  bgSvg.style.inset    = '0';
  bgSvg.style.width    = '100%';
  bgSvg.style.height   = '100%';
  bgSvg.style.zIndex   = '0';
  bgSvg.style.overflow = 'visible';
  // Dış karanlık gölge sildik, yerine gönderdiğiniz resimdeki gibi aydınlık bir 3 boyutlu geçiş (bevel) dış çizgisi ekledik
  bgSvg.style.filter   = 'drop-shadow(0 6px 0 rgba(255, 255, 255, 0.15))';
  gridEl.appendChild(bgSvg);

  state.hexPositions.forEach(([q, r]) => {
    const key = `${q},${r}`;
    const { x, y } = hexToPixel(q, r, HEX_SIZE);
    const cx = x + state.gridOffsetX;
    const cy = y + state.gridOffsetY;

    const corners = hexCorners(cx, cy, HEX_SIZE - 2);

    // Thick frame piece for background
    const bgPoly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    bgPoly.setAttribute('points', pointsStr(corners));
    bgPoly.style.fill = 'var(--grid-bg)';
    bgPoly.style.stroke = 'var(--grid-bg)';
    bgPoly.style.strokeWidth = '20'; 
    bgPoly.style.strokeLinejoin = 'round';
    bgSvg.appendChild(bgPoly);

    const div = document.createElement('div');
    div.className    = 'hex-cell';
    div.dataset.q    = q;
    div.dataset.r    = r;
    div.style.position = 'absolute';
    div.style.left   = (cx - HEX_SIZE) + 'px';
    div.style.top    = (cy - HEX_SIZE) + 'px';
    div.style.width  = (HEX_SIZE * 2) + 'px';
    div.style.height = (HEX_SIZE * 2) + 'px';
    div.style.zIndex = '1';

    // SVG background
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('cell-bg');
    svg.style.position = 'absolute';
    svg.style.inset    = '0';
    svg.style.width    = '100%';
    svg.style.height   = '100%';
    svg.style.overflow = 'visible';

    const relCorners = corners.map(p => ({
      x: p.x - (cx - HEX_SIZE),
      y: p.y - (cy - HEX_SIZE),
    }));

    const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    poly.setAttribute('points', pointsStr(relCorners));
    svg.appendChild(poly);
    div.appendChild(svg);

    // Value label
    const val = document.createElement('div');
    val.className = 'cell-value';
    div.appendChild(val);

    gridEl.appendChild(div);
    state.cellElements[key] = { div, val, poly, corners: relCorners, cx, cy };
    state.grid[key] = 0;
  });

  updateGridDisplay();
}

export function updateGridDisplay() {
  Object.entries(state.cellElements).forEach(([key, { val, poly }]) => {
    const v = state.grid[key] || 0;
    if (v > 0) {
      const col = getTileColor(v);
      poly.style.fill        = col.bg;
      poly.style.stroke      = col.shadow;
      poly.style.strokeWidth = '3';
      val.textContent = v;
      val.style.fontSize = v >= 1000 ? '11px' : v >= 100 ? '13px' : '15px';
      val.style.color = 'white';
    } else {
      poly.style.fill        = 'var(--cell-bg)';
      poly.style.stroke      = 'var(--cell-border)';
      poly.style.strokeWidth = '2';
      val.textContent = '';
    }
  });
}
