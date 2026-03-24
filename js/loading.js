(function() {
  const container = document.getElementById('loading-hex-container');
  if (!container) return;

  const W = window.innerWidth;
  const H = window.innerHeight;
  const PAD = 100;

  // Flat-top hexagon: R = center to corner
  const R = 36;
  const hexW = R * 2;              // flat-top width = 2R
  const hexH = R * Math.sqrt(3);  // flat-top height = sqrt(3)*R
  const colStep = hexW * 0.75;    // horizontal step = 3/4 * width
  const rowStep = hexH;           // vertical step = 1 full hex height

  const cols = Math.ceil((W + PAD * 2) / colStep) + 2;
  const rows = Math.ceil((H + PAD * 2) / rowStep) + 2;

  const centerX = W / 2;
  const centerY = H / 2;

  // Single SVG covering entire screen + padding
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.style.cssText = `position:absolute; left:${-PAD}px; top:${-PAD}px; width:${W + PAD * 2}px; height:${H + PAD * 2}px; overflow:visible;`;
  container.appendChild(svg);

  // Flat-top hex polygon points at (cx, cy) in SVG coords
  function hexPoints(cx, cy) {
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 180) * (60 * i); // 0°, 60°, 120°...
      const r = R + 0.6; // slightly larger to eliminate gaps between strokes
      pts.push(`${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`);
    }
    return pts.join(' ');
  }

  const hexData = [];
  let maxDist = 0;

  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      // Screen-space center
      const screenX = -PAD + c * colStep;
      let screenY = -PAD + r * rowStep;
      if (c % 2 === 1) screenY += hexH / 2; // odd columns shift down by half hex height

      // SVG space
      const svgX = screenX + PAD;
      const svgY = screenY + PAD;

      const dist = Math.hypot(screenX - centerX, screenY - centerY);
      if (dist > maxDist) maxDist = dist;

      const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      poly.setAttribute('points', hexPoints(svgX, svgY));
      poly.setAttribute('fill', 'rgba(15, 30, 100, 0.18)');
      poly.setAttribute('stroke', '#1e3175');
      poly.setAttribute('stroke-width', '2');
      poly.style.opacity = '0';
      poly.style.transition = 'opacity 0.3s ease';
      svg.appendChild(poly);

      hexData.push({ el: poly, dist });
    }
  }

  // Appear: edges first → center last (outside-in)
  const appearDur = 900;
  setTimeout(() => {
    hexData.forEach(h => {
      const delay = (1 - h.dist / maxDist) * appearDur;
      setTimeout(() => { h.el.style.opacity = '1'; }, delay);
    });
  }, 30);

  // Hide: center first → edges last (inside-out)
  window.hideLoadingScreen = function() {
    const hideDur = 700;
    hexData.forEach(h => {
      const delay = (h.dist / maxDist) * hideDur;
      setTimeout(() => { h.el.style.opacity = '0'; }, delay);
    });
    setTimeout(() => {
      const screen = document.getElementById('loading-screen');
      if (screen) {
        screen.style.opacity = '0';
        setTimeout(() => screen.remove(), 800);
      }
    }, hideDur + 350);
  };
})();
