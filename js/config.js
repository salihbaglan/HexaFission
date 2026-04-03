// ==================== CONFIG ====================
export const GRID_RADIUS = 4; // radius in hexes
export const MAX_LIVES = 5;

// HEX_SIZE dinamik olarak hesaplanır
export let HEX_SIZE = 30;

// Mevcut boşluğa göre ideal hex boyutunu hesapla
export function calcHexSize() {
  const isLandscape = window.innerWidth > window.innerHeight;
  const diameter = GRID_RADIUS * 2 + 1;
  // Dikey modda kullanılan yaklaşık UI yüksekliği. Taşma olmaması için payı artırdık (Topbar + Büyüyen Tray + Items).
  const usedH = isLandscape ? 40 : 400;
  // Yatay modda UI sağ yanda olduğu için yaklaşık 340px'lik alanı UI'ye bırakıyoruz. Dikeyde tamamını kullanıyoruz.
  const usedW = isLandscape ? 340 : 20;

  const avH = (window.innerHeight - usedH) / (diameter * 1.5 + 0.5);
  const avW = (window.innerWidth - usedW) / (diameter * Math.sqrt(3));

  // Maksimum 46'ya kadar büyümesine izin veriyoruz ki yatay ekranlarda büyük grid oluşabilsin.
  HEX_SIZE = Math.floor(Math.min(avH, avW, 46));
  if (HEX_SIZE < 18) HEX_SIZE = 18;
  
  // Update CSS variable so empty tray slots never collapse and cause UI jump
  document.documentElement.style.setProperty('--tray-slot-size', (HEX_SIZE * 3.6) + 'px');
  
  return HEX_SIZE;
}


export const TILE_COLORS = {
  2: { bg: '#4fc3f7', shadow: '#0288d1' },
  4: { bg: '#f5a623', shadow: '#c47d0e' },
  8: { bg: '#e06c54', shadow: '#b5432a' },
  16: { bg: '#9b59b6', shadow: '#6c3483' },
  32: { bg: '#2ecc71', shadow: '#1a7a44' },
  64: { bg: '#e74c3c', shadow: '#922b21' },
  128: { bg: '#f39c12', shadow: '#9a6200' },
  256: { bg: '#1abc9c', shadow: '#0e6655' },
  512: { bg: '#3498db', shadow: '#1a5276' },
  1024: { bg: '#e91e63', shadow: '#880e4f' },
  2048: { bg: '#ffd700', shadow: '#b8860b' },
  4096: { bg: '#00bcd4', shadow: '#006064' },
  8192: { bg: '#ff5722', shadow: '#bf360c' },
};

export function getTileColor(val) {
  if (TILE_COLORS[val]) return TILE_COLORS[val];
  return { bg: '#7986cb', shadow: '#3949ab' };
}

export function get3DTileBackground(bg, shadow) {
  // Katman 1: Üst-sol aydınlık / Alt-sağ koyu bevel (kabartma/3D efekti)
  const bevel = `linear-gradient(145deg,
    rgba(255,255,255,0.55) 0%,
    rgba(255,255,255,0.20) 20%,
    rgba(0,0,0,0) 50%,
    rgba(0,0,0,0.30) 85%,
    rgba(0,0,0,0.45) 100%
  )`;

  // Katman 2: Dışta koyu çerçeve, içe doğru ana renk geçişi (iç panel hissi)
  const inner = `radial-gradient(ellipse at 50% 45%,
    ${bg} 0%,
    ${bg} 45%,
    ${shadow} 100%
  )`;

  return `${bevel}, ${inner}`;
}
