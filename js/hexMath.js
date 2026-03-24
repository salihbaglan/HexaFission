// ==================== HEX MATH ====================
// Axial coordinates, pointy-top hexagons

export function hexToPixel(q, r, size) {
  const x = size * (Math.sqrt(3) * q + Math.sqrt(3) / 2 * r);
  const y = size * (3 / 2 * r);
  return { x, y };
}

export function hexCorners(cx, cy, size) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const angle = Math.PI / 180 * (60 * i - 30); // pointy-top
    pts.push({ x: cx + size * Math.cos(angle), y: cy + size * Math.sin(angle) });
  }
  return pts;
}

export function pointsStr(pts) {
  return pts.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
}

export function hexNeighbors(q, r) {
  return [
    [q + 1, r], [q - 1, r],
    [q, r + 1], [q, r - 1],
    [q + 1, r - 1], [q - 1, r + 1],
  ];
}

export function generateHexPositions(radius) {
  const positions = [];
  for (let q = -radius; q <= radius; q++) {
    for (let r = -radius; r <= radius; r++) {
      if (Math.abs(q + r) <= radius) {
        positions.push([q, r]);
      }
    }
  }
  return positions;
}
