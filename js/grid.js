import { HEX_SIZE, getTileColor, get3DTileBackground, calcHexSize } from './config.js';
import { hexToPixel, hexCorners, pointsStr } from './hexMath.js';
import { state } from './gameState.js';

export function scaleGridToContainer() {
  const gridEl = document.getElementById('hex-grid');
  const container = document.getElementById('grid-container');
  if (!gridEl || !container) return;

  const cW = container.clientWidth  - 16;
  const cH = container.clientHeight - 16;
  const gW = gridEl.offsetWidth;
  const gH = gridEl.offsetHeight;
  if (!gW || !gH) return;

  const scale = Math.min(cW / gW, cH / gH, 1);
  gridEl.style.transform = `scale(${scale})`;
  state.gridScale = scale; // drag koordinat düzeltmesi için
}

export function initGrid() {
  calcHexSize(); // Ekrana göre boyutu hesapla
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
    const wSize = (HEX_SIZE * 2) * 0.866;
    const hSize = (HEX_SIZE * 2);

    div.style.left   = (cx - wSize / 2) + 'px';
    div.style.top    = (cy - hSize / 2) + 'px';
    div.style.width  = wSize + 'px';
    div.style.height = hSize + 'px';
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
      x: p.x - (cx - wSize / 2),
      y: p.y - (cy - hSize / 2),
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
  Object.entries(state.cellElements).forEach(([key, { div, val, poly }]) => {
    const v = state.grid[key] || 0;
    if (v > 0) {
      const col = getTileColor(v);
      // Dış poligon = koyu çerçeve
      poly.style.fill        = col.shadow;
      poly.style.strokeWidth = '0';
      // İç div = 3D bevel yüzeyi
      div.style.background = get3DTileBackground(col.bg, col.shadow);
      val.textContent = v;
      val.style.fontSize = v >= 1000 ? '11px' : v >= 100 ? '13px' : '15px';
      val.style.color = 'white';
    } else {
      div.style.background = 'none';
      poly.style.fill        = 'var(--cell-bg)';
      poly.style.stroke      = 'var(--cell-border)';
      poly.style.strokeWidth = '2';
      val.textContent = '';
    }
  });
}
