import * as THREE from 'three';

/* ------------------------------------------------------------------ *
 *  canvas texture workshop
 * ------------------------------------------------------------------ */
function cv(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}
function toTex(c, { repeat = [1, 1], aniso = 8, wrap = THREE.RepeatWrapping } = {}) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = wrap;
  t.repeat.set(repeat[0], repeat[1]);
  t.anisotropy = aniso;
  return t;
}
/** deterministic pseudo random */
function rnd(seed) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
}

/* ------------------------------------------------------------------ *
 *  plaza parquet  (120 x 120 world units)
 * ------------------------------------------------------------------ */
export function parquet() {
  const S = 2048, k = S / 1024;
  const c = cv(S, S), g = c.getContext('2d');
  g.scale(k, k);

  g.fillStyle = '#e7cfa9';
  g.fillRect(0, 0, 1024, 1024);

  // faint stone seams
  g.strokeStyle = 'rgba(160,130,120,0.10)';
  g.lineWidth = 1.2;
  for (let i = 0; i <= 1024; i += 42.6) {
    g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 1024); g.stroke();
    g.beginPath(); g.moveTo(0, i); g.lineTo(1024, i); g.stroke();
  }

  const ring = (inset, w, col) => {
    g.strokeStyle = col; g.lineWidth = w;
    g.strokeRect(inset + w / 2, inset + w / 2, 1024 - 2 * inset - w, 1024 - 2 * inset - w);
  };

  // outer frame
  ring(6, 30, '#1f7d7d');
  ring(42, 5, '#c9a24a');
  ring(56, 3, '#f7dd93');
  ring(66, 44, '#dd8ba2');
  ring(116, 6, '#c9a24a');
  ring(134, 26, '#f2e0c4');
  ring(166, 4, '#2b8b8b');
  ring(180, 40, '#d47e97');
  ring(226, 5, '#f8d072');
  ring(238, 18, '#f4e6cc');

  // central diamond field
  g.save();
  g.translate(512, 512); g.rotate(Math.PI / 4);
  g.fillStyle = '#f8ecd6';
  g.fillRect(-228, -228, 456, 456);
  g.strokeStyle = '#2b8b8b'; g.lineWidth = 9;
  g.strokeRect(-228, -228, 456, 456);
  g.strokeStyle = '#c9a24a'; g.lineWidth = 3;
  g.strokeRect(-206, -206, 412, 412);
  g.fillStyle = 'rgba(233,174,188,0.55)';
  g.fillRect(-206, -206, 412, 22);
  g.fillRect(-206, 184, 412, 22);
  g.restore();

  // diagonals
  g.strokeStyle = 'rgba(201,162,74,0.85)';
  g.lineWidth = 3;
  g.beginPath(); g.moveTo(40, 40); g.lineTo(984, 984); g.stroke();
  g.beginPath(); g.moveTo(984, 40); g.lineTo(40, 984); g.stroke();

  // corner fans
  const fan = (cx, cy, sx, sy) => {
    g.save(); g.translate(cx, cy); g.scale(sx, sy);
    for (let i = 0; i <= 6; i++) {
      const a = (i / 6) * Math.PI / 2;
      g.strokeStyle = i % 2 ? 'rgba(43,139,139,0.85)' : 'rgba(201,162,74,0.9)';
      g.lineWidth = i % 2 ? 5 : 2;
      g.beginPath(); g.arc(0, 0, 150, a - 0.02, a + 0.02); g.stroke();
    }
    g.fillStyle = '#f6bccb';
    g.beginPath(); g.arc(0, 0, 40, 0, Math.PI / 2); g.lineTo(0, 0); g.fill();
    g.restore();
  };
  fan(70, 70, 1, 1); fan(954, 70, -1, 1); fan(70, 954, 1, -1); fan(954, 954, -1, -1);

  // mid-edge inlays
  const inlay = (x, y) => {
    g.save(); g.translate(x, y); g.rotate(Math.PI / 4);
    g.fillStyle = '#2b8b8b'; g.fillRect(-16, -16, 32, 32);
    g.fillStyle = '#f8d072'; g.fillRect(-8, -8, 16, 16);
    g.restore();
  };
  inlay(512, 78); inlay(512, 946); inlay(78, 512); inlay(946, 512);

  // centre rosette
  g.save(); g.translate(512, 512);
  g.fillStyle = '#f7efdd'; g.beginPath(); g.arc(0, 0, 120, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#c9a24a'; g.lineWidth = 4; g.beginPath(); g.arc(0, 0, 120, 0, Math.PI * 2); g.stroke();
  for (let i = 0; i < 8; i++) {
    g.save(); g.rotate((i / 8) * Math.PI * 2);
    g.fillStyle = i % 2 ? '#e9aebc' : '#9edcc4';
    g.beginPath();
    g.ellipse(0, -66, 24, 46, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }
  g.fillStyle = '#d22b34'; g.beginPath(); g.arc(0, 0, 26, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#f8d072'; g.beginPath(); g.arc(0, 0, 12, 0, Math.PI * 2); g.fill();
  g.restore();

  return toTex(c, { repeat: [1, 1], aniso: 16 });
}

/* ------------------------------------------------------------------ *
 *  circular compass medallion for the forecourt
 * ------------------------------------------------------------------ */
export function medallion() {
  const S = 512, c = cv(S, S), g = c.getContext('2d');
  g.clearRect(0, 0, S, S);
  const cx = S / 2, cy = S / 2;
  g.fillStyle = '#f6e8d2'; g.beginPath(); g.arc(cx, cy, 250, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#2b8b8b'; g.lineWidth = 14; g.beginPath(); g.arc(cx, cy, 240, 0, Math.PI * 2); g.stroke();
  g.strokeStyle = '#c9a24a'; g.lineWidth = 4; g.beginPath(); g.arc(cx, cy, 224, 0, Math.PI * 2); g.stroke();
  // 16 point compass
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const long = i % 2 === 0;
    g.save(); g.translate(cx, cy); g.rotate(a);
    g.fillStyle = long ? '#e9aebc' : '#9edcc4';
    g.beginPath();
    g.moveTo(0, -long ? 210 : 140);
    g.lineTo(long ? 26 : 14, 0);
    g.lineTo(0, long ? 60 : 40);
    g.lineTo(-(long ? 26 : 14), 0);
    g.closePath(); g.fill();
    g.restore();
  }
  g.fillStyle = '#f8d072'; g.beginPath(); g.arc(cx, cy, 46, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#761d32'; g.beginPath(); g.arc(cx, cy, 26, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#f8d072'; g.beginPath(); g.arc(cx, cy, 10, 0, Math.PI * 2); g.fill();
  return toTex(c, { wrap: THREE.ClampToEdgeWrapping });
}

/* ------------------------------------------------------------------ *
 *  lobby carpet
 * ------------------------------------------------------------------ */
export function carpet() {
  const S = 512, c = cv(S, S), g = c.getContext('2d');
  g.fillStyle = '#6c1a2c'; g.fillRect(0, 0, S, S);
  g.strokeStyle = '#c9a24a'; g.lineWidth = 10; g.strokeRect(14, 14, S - 28, S - 28);
  g.strokeStyle = '#e9aebc'; g.lineWidth = 3; g.strokeRect(26, 26, S - 52, S - 52);

  // diamond lattice
  g.strokeStyle = 'rgba(201,162,74,0.55)'; g.lineWidth = 2;
  for (let i = -S; i < S * 2; i += 64) {
    g.beginPath(); g.moveTo(i, 0); g.lineTo(i + S, S); g.stroke();
    g.beginPath(); g.moveTo(i, S); g.lineTo(i + S, 0); g.stroke();
  }
  for (let y = 64; y < S; y += 64) {
    for (let x = 64; x < S; x += 64) {
      g.save(); g.translate(x, y); g.rotate(Math.PI / 4);
      g.fillStyle = ((x + y) / 64) % 2 ? '#9edcc4' : '#e9aebc';
      g.globalAlpha = 0.9; g.fillRect(-11, -11, 22, 22);
      g.restore();
    }
  }
  // centre medallion
  g.save(); g.translate(S / 2, S / 2);
  g.fillStyle = '#8d2334'; g.beginPath(); g.arc(0, 0, 96, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#f8d072'; g.lineWidth = 5; g.beginPath(); g.arc(0, 0, 96, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.arc(0, 0, 74, 0, Math.PI * 2); g.stroke();
  for (let i = 0; i < 8; i++) {
    g.save(); g.rotate((i / 8) * Math.PI * 2);
    g.fillStyle = i % 2 ? '#f8d072' : '#e9aebc';
    g.beginPath(); g.ellipse(0, -46, 12, 28, 0, 0, Math.PI * 2); g.fill();
    g.restore();
  }
  g.fillStyle = '#f8d072'; g.beginPath(); g.arc(0, 0, 18, 0, Math.PI * 2); g.fill();
  g.restore();

  return toTex(c, { repeat: [1, 1] });
}

/* ------------------------------------------------------------------ *
 *  alpine rock
 * ------------------------------------------------------------------ */
export function stone() {
  const S = 512, c = cv(S, S), g = c.getContext('2d');
  const rand = rnd(7);
  g.fillStyle = '#6d6472'; g.fillRect(0, 0, S, S);
  let y = 0;
  while (y < S) {
    const bh = 46 + Math.floor(rand() * 34);
    let x = -40;
    while (x < S) {
      const bw = 62 + Math.floor(rand() * 96);
      const v = 0.80 + rand() * 0.36;
      const r = Math.floor(192 * v), gg = Math.floor(180 * v), b = Math.floor(188 * v);
      g.fillStyle = `rgb(${r},${gg},${b})`;
      g.beginPath();
      const j = () => (rand() - 0.5) * 5;
      g.moveTo(x + 3 + j(), y + 3 + j());
      g.lineTo(x + bw - 3 + j(), y + 3 + j());
      g.lineTo(x + bw - 3 + j(), y + bh - 3 + j());
      g.lineTo(x + 3 + j(), y + bh - 3 + j());
      g.closePath(); g.fill();
      // speckle + strata
      for (let i = 0; i < 22; i++) {
        g.fillStyle = `rgba(${rand() > 0.5 ? 255 : 50},${rand() > 0.5 ? 250 : 50},${rand() > 0.5 ? 255 : 60},0.10)`;
        g.fillRect(x + 6 + rand() * (bw - 14), y + 6 + rand() * (bh - 14), 3 + rand() * 9, 2 + rand() * 4);
      }
      g.fillStyle = 'rgba(255,255,255,0.18)';
      g.fillRect(x + 4, y + 4, bw - 8, 3);
      g.fillStyle = 'rgba(38,28,44,0.22)';
      g.fillRect(x + 4, y + bh - 8, bw - 8, 5);
      x += bw;
    }
    y += bh;
  }
  // icy cracks
  g.strokeStyle = 'rgba(255,255,255,0.30)'; g.lineWidth = 1.6;
  for (let i = 0; i < 9; i++) {
    let cx2 = rand() * S, cy2 = rand() * S;
    g.beginPath(); g.moveTo(cx2, cy2);
    for (let k = 0; k < 4; k++) {
      cx2 += (rand() - 0.5) * 60; cy2 += rand() * 40;
      g.lineTo(cx2, cy2);
    }
    g.stroke();
  }
  return toTex(c, { repeat: [1, 1] });
}

/* ------------------------------------------------------------------ *
 *  interior wallpaper
 * ------------------------------------------------------------------ */
export function wallpaper() {
  const S = 256, c = cv(S, S), g = c.getContext('2d');
  g.fillStyle = '#fbefd9'; g.fillRect(0, 0, S, S);
  for (let x = 0; x < S; x += 32) {
    g.fillStyle = 'rgba(233,174,188,0.55)';
    g.fillRect(x, 0, 10, S);
    g.fillStyle = 'rgba(43,139,139,0.35)';
    g.fillRect(x + 16, 0, 3, S);
  }
  for (let y = 16; y < S; y += 64) {
    for (let x = 16; x < S; x += 64) {
      g.save(); g.translate(x, y); g.rotate(Math.PI / 4);
      g.fillStyle = 'rgba(43,139,139,0.45)'; g.fillRect(-6, -6, 12, 12);
      g.restore();
    }
  }
  return toTex(c, { repeat: [1, 1] });
}

/* ------------------------------------------------------------------ *
 *  turkish bath tiles
 * ------------------------------------------------------------------ */
export function tiles() {
  const S = 512, c = cv(S, S), g = c.getContext('2d');
  g.fillStyle = '#2f8f92'; g.fillRect(0, 0, S, S);
  const step = 128;
  for (let y = 0; y < S; y += step) {
    for (let x = 0; x < S; x += step) {
      // star
      g.save(); g.translate(x + step / 2, y + step / 2);
      g.fillStyle = '#f7f0e0';
      g.beginPath();
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        const r = i % 2 ? 26 : 54;
        const px = Math.cos(a) * r, py = Math.sin(a) * r;
        i ? g.lineTo(px, py) : g.moveTo(px, py);
      }
      g.closePath(); g.fill();
      g.fillStyle = '#2b6f8c';
      g.beginPath(); g.arc(0, 0, 14, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#d9736f';
      g.beginPath(); g.arc(0, 0, 6, 0, Math.PI * 2); g.fill();
      g.restore();
      // corner flowers
      for (const [dx, dy] of [[0, 0], [step, 0], [0, step], [step, step]]) {
        g.fillStyle = 'rgba(247,240,224,0.85)';
        g.beginPath(); g.arc(x + dx, y + dy, 9, 0, Math.PI * 2); g.fill();
        g.fillStyle = 'rgba(217,115,111,0.9)';
        g.beginPath(); g.arc(x + dx, y + dy, 4, 0, Math.PI * 2); g.fill();
      }
    }
  }
  return toTex(c, { repeat: [1, 1] });
}

/* ------------------------------------------------------------------ *
 *  salon checkerboard
 * ------------------------------------------------------------------ */
export function checker() {
  const S = 256, c = cv(S, S), g = c.getContext('2d');
  const n = 4, s = S / n;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      g.fillStyle = (x + y) % 2 ? '#9edcc4' : '#fbf0dc';
      g.fillRect(x * s, y * s, s, s);
      g.fillStyle = 'rgba(0,0,0,0.06)';
      g.fillRect(x * s, y * s, s, 1);
      g.fillRect(x * s, y * s, 1, s);
    }
  }
  return toTex(c, { repeat: [1, 1] });
}

/* ------------------------------------------------------------------ *
 *  the boy with the apple — oil painting
 * ------------------------------------------------------------------ */
export function painting() {
  const W = 384, H = 480, c = cv(W, H), g = c.getContext('2d');
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#f2c6c0');
  bg.addColorStop(0.6, '#e3a3a6');
  bg.addColorStop(1, '#b96f7c');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);

  // painterly dabs
  const rand = rnd(31);
  for (let i = 0; i < 340; i++) {
    g.fillStyle = `rgba(${200 + rand() * 55},${150 + rand() * 60},${150 + rand() * 60},0.10)`;
    g.beginPath();
    g.ellipse(rand() * W, rand() * H, 6 + rand() * 26, 4 + rand() * 14, rand() * 3, 0, Math.PI * 2);
    g.fill();
  }

  // coat
  g.fillStyle = '#3f6b6b';
  g.beginPath();
  g.moveTo(W * 0.16, H);
  g.bezierCurveTo(W * 0.2, H * 0.62, W * 0.34, H * 0.56, W * 0.5, H * 0.56);
  g.bezierCurveTo(W * 0.66, H * 0.56, W * 0.8, H * 0.62, W * 0.84, H);
  g.closePath(); g.fill();
  // collar
  g.fillStyle = '#e8e0cf';
  g.beginPath();
  g.moveTo(W * 0.42, H * 0.57); g.lineTo(W * 0.5, H * 0.72); g.lineTo(W * 0.58, H * 0.57);
  g.closePath(); g.fill();

  // neck + head
  g.fillStyle = '#e8b79c';
  g.fillRect(W * 0.455, H * 0.48, W * 0.09, H * 0.11);
  g.beginPath(); g.ellipse(W * 0.5, H * 0.36, W * 0.155, H * 0.145, 0, 0, Math.PI * 2); g.fill();
  // hair
  g.fillStyle = '#5b3a2e';
  g.beginPath();
  g.ellipse(W * 0.5, H * 0.285, W * 0.175, H * 0.115, 0, Math.PI, Math.PI * 2);
  g.fill();
  g.fillRect(W * 0.325, H * 0.28, W * 0.35, H * 0.035);
  // eyes
  g.fillStyle = '#3a2a24';
  g.beginPath(); g.ellipse(W * 0.44, H * 0.365, 5, 6, 0, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(W * 0.56, H * 0.365, 5, 6, 0, 0, Math.PI * 2); g.fill();
  // nose + mouth
  g.strokeStyle = 'rgba(150,90,80,0.7)'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(W * 0.5, H * 0.375); g.lineTo(W * 0.495, H * 0.415); g.stroke();
  g.strokeStyle = '#a35c5c'; g.lineWidth = 3;
  g.beginPath(); g.arc(W * 0.5, H * 0.425, W * 0.035, 0.15, Math.PI - 0.15); g.stroke();
  // cheeks
  g.fillStyle = 'rgba(226,120,120,0.30)';
  g.beginPath(); g.ellipse(W * 0.41, H * 0.41, 16, 10, 0, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(W * 0.59, H * 0.41, 16, 10, 0, 0, Math.PI * 2); g.fill();

  // hand + apple
  g.fillStyle = '#e8b79c';
  g.beginPath(); g.ellipse(W * 0.33, H * 0.82, W * 0.085, H * 0.06, -0.4, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#c92b30';
  g.beginPath(); g.arc(W * 0.30, H * 0.755, W * 0.062, 0, Math.PI * 2); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.35)';
  g.beginPath(); g.arc(W * 0.282, H * 0.735, W * 0.018, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#5b3a2e'; g.lineWidth = 3;
  g.beginPath(); g.moveTo(W * 0.30, H * 0.70); g.lineTo(W * 0.31, H * 0.685); g.stroke();

  // varnish vignette
  const vg = g.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.72);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(60,20,30,0.42)');
  g.fillStyle = vg; g.fillRect(0, 0, W, H);

  return toTex(c, { wrap: THREE.ClampToEdgeWrapping });
}

/* ------------------------------------------------------------------ *
 *  GRAND HOTEL light-box lettering
 * ------------------------------------------------------------------ */
export function signTexture() {
  const W = 2048, H = 512, c = cv(W, H), g = c.getContext('2d');
  g.clearRect(0, 0, W, H);
  const text = 'GRAND HOTEL';
  g.font = '700 210px Georgia, "Times New Roman", serif';
  g.textBaseline = 'middle';
  const tracking = 34;
  let total = 0;
  for (const ch of text) total += g.measureText(ch).width + tracking;
  total -= tracking;
  let x = (W - total) / 2;
  const grad = g.createLinearGradient(0, H * 0.28, 0, H * 0.78);
  grad.addColorStop(0, '#fff6d8');
  grad.addColorStop(0.45, '#ffd979');
  grad.addColorStop(0.55, '#e9ab3f');
  grad.addColorStop(1, '#ffe9ab');
  for (const ch of text) {
    const w = g.measureText(ch).width;
    g.shadowColor = 'rgba(255,196,90,0.9)';
    g.shadowBlur = 34;
    g.fillStyle = grad;
    g.fillText(ch, x + w / 2, H / 2 + 6);
    g.shadowBlur = 0;
    x += w + tracking;
  }
  // thin rule
  g.strokeStyle = 'rgba(255,220,150,0.9)';
  g.lineWidth = 4;
  g.beginPath(); g.moveTo(W * 0.09, H * 0.12); g.lineTo(W * 0.91, H * 0.12); g.stroke();
  g.beginPath(); g.moveTo(W * 0.09, H * 0.88); g.lineTo(W * 0.91, H * 0.88); g.stroke();
  return toTex(c, { wrap: THREE.ClampToEdgeWrapping });
}

/* ------------------------------------------------------------------ *
 *  plinth plaque
 * ------------------------------------------------------------------ */
export function plaque() {
  const W = 1024, H = 160, c = cv(W, H), g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, H);
  grd.addColorStop(0, '#e8c47a'); grd.addColorStop(0.5, '#c99b46'); grd.addColorStop(1, '#e3bb6c');
  g.fillStyle = grd; g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(90,60,20,0.55)'; g.lineWidth = 4; g.strokeRect(10, 10, W - 20, H - 20);
  g.fillStyle = '#4a3216';
  g.font = '600 46px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('GRAND HOTEL  ·  ALPINE CABLE STATION', W / 2, H / 2 - 16);
  g.font = '400 26px Georgia, serif';
  g.fillText('ZUBROWKA  ·  MADE FOR THE MOUNTAINS  ·  1:100', W / 2, H / 2 + 34);
  return toTex(c, { wrap: THREE.ClampToEdgeWrapping });
}

/* ------------------------------------------------------------------ *
 *  trunk finishes
 * ------------------------------------------------------------------ */
export function zebra() {
  const S = 512, c = cv(S, S), g = c.getContext('2d');
  g.fillStyle = '#f3e8d6'; g.fillRect(0, 0, S, S);
  const rand = rnd(11);
  for (let i = 0; i < 26; i++) {
    const x = rand() * S;
    g.fillStyle = '#2b2028';
    g.beginPath();
    g.moveTo(x, 0);
    g.bezierCurveTo(x + 30, S * 0.3, x - 40, S * 0.7, x + 10, S);
    g.lineTo(x + 40, S);
    g.bezierCurveTo(x + 4, S * 0.7, x + 70, S * 0.3, x + 26, 0);
    g.closePath(); g.fill();
  }
  return toTex(c, { repeat: [1, 1] });
}

export function stickers() {
  const S = 512, c = cv(S, S), g = c.getContext('2d');
  g.fillStyle = '#7a4a2e'; g.fillRect(0, 0, S, S);
  // leather grain
  const rand = rnd(23);
  for (let i = 0; i < 900; i++) {
    g.fillStyle = `rgba(${90 + rand() * 60},${50 + rand() * 40},${30 + rand() * 30},0.25)`;
    g.fillRect(rand() * S, rand() * S, 3 + rand() * 6, 2 + rand() * 4);
  }
  g.strokeStyle = 'rgba(240,220,190,0.7)'; g.lineWidth = 6; g.strokeRect(12, 12, S - 24, S - 24);
  const labels = [
    ['GRAND', 'HOTEL', '#f6bccb', '#761d32'],
    ['ZUBROWKA', 'ALPINE', '#9edcc4', '#1f5f5f'],
    ['MENDL\'S', 'PARIS', '#f8d072', '#761d32'],
    ['N° 7', 'SUITE', '#e9e2d0', '#2b8b8b'],
    ['CABLE', 'STATION', '#f6d548', '#3a2130'],
  ];
  labels.forEach((L, i) => {
    const x = 40 + (i % 3) * 150, y = 50 + Math.floor(i / 3) * 210;
    g.save(); g.translate(x + 60, y + 50); g.rotate((rand() - 0.5) * 0.24);
    g.fillStyle = L[2]; g.fillRect(-58, -40, 116, 84);
    g.strokeStyle = L[3]; g.lineWidth = 4; g.strokeRect(-52, -34, 104, 72);
    g.fillStyle = L[3]; g.textAlign = 'center'; g.font = '700 20px Georgia, serif';
    g.fillText(L[0], 0, -6); g.fillText(L[1], 0, 20);
    g.restore();
  });
  return toTex(c, { repeat: [1, 1] });
}

/* ------------------------------------------------------------------ *
 *  soft sprites
 * ------------------------------------------------------------------ */
export function glowTexture() {
  const S = 128, c = cv(S, S), g = c.getContext('2d');
  const grd = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  grd.addColorStop(0, 'rgba(255,246,214,1)');
  grd.addColorStop(0.25, 'rgba(255,214,140,0.62)');
  grd.addColorStop(0.55, 'rgba(255,170,120,0.20)');
  grd.addColorStop(1, 'rgba(255,150,120,0)');
  g.fillStyle = grd; g.fillRect(0, 0, S, S);
  return toTex(c, { wrap: THREE.ClampToEdgeWrapping });
}

export function snowTexture() {
  const S = 64, c = cv(S, S), g = c.getContext('2d');
  const grd = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.4, 'rgba(255,252,255,0.9)');
  grd.addColorStop(1, 'rgba(255,245,250,0)');
  g.fillStyle = grd; g.fillRect(0, 0, S, S);
  return toTex(c, { wrap: THREE.ClampToEdgeWrapping });
}

export function steamTexture() {
  const S = 128, c = cv(S, S), g = c.getContext('2d');
  const grd = g.createRadialGradient(S / 2, S / 2, 4, S / 2, S / 2, S / 2);
  grd.addColorStop(0, 'rgba(255,255,255,0.85)');
  grd.addColorStop(0.45, 'rgba(255,248,250,0.42)');
  grd.addColorStop(1, 'rgba(255,240,248,0)');
  g.fillStyle = grd; g.fillRect(0, 0, S, S);
  return toTex(c, { wrap: THREE.ClampToEdgeWrapping });
}

/* ------------------------------------------------------------------ *
 *  lobby key-cubby wall (single texture, crisp)
 * ------------------------------------------------------------------ */
export function cubbies() {
  const W = 1024, H = 320, c = cv(W, H), g = c.getContext('2d');
  g.fillStyle = '#3a2230'; g.fillRect(0, 0, W, H);
  const cols = 16, rows = 6;
  const cw = W / cols, ch = H / rows;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      g.fillStyle = '#2a1722';
      g.fillRect(x * cw + 5, y * ch + 5, cw - 10, ch - 10);
      g.fillStyle = 'rgba(20,10,16,0.9)';
      g.fillRect(x * cw + 9, y * ch + 9, cw - 18, ch - 22);
      // brass frame
      g.strokeStyle = '#e6b45c'; g.lineWidth = 4;
      g.strokeRect(x * cw + 5, y * ch + 5, cw - 10, ch - 10);
      // little key tag
      if ((x * 7 + y * 3) % 5 !== 0) {
        g.fillStyle = '#f2d79a';
        g.fillRect(x * cw + cw * 0.36, y * ch + ch * 0.34, cw * 0.28, ch * 0.30);
        g.fillStyle = '#8a5c2a';
        g.fillRect(x * cw + cw * 0.44, y * ch + ch * 0.40, cw * 0.12, 3);
      }
    }
  }
  // frame
  g.strokeStyle = '#c9922f'; g.lineWidth = 14; g.strokeRect(7, 7, W - 14, H - 14);
  return toTex(c, { wrap: THREE.ClampToEdgeWrapping });
}

/* ------------------------------------------------------------------ *
 *  MENDL'S pink box lid
 * ------------------------------------------------------------------ */
export function mendlBox() {
  const S = 256, c = cv(S, S), g = c.getContext('2d');
  g.fillStyle = '#f7b8c8'; g.fillRect(0, 0, S, S);
  g.strokeStyle = '#7fb8d8'; g.lineWidth = 10;
  g.beginPath(); g.moveTo(S / 2, 0); g.lineTo(S / 2, S); g.stroke();
  g.beginPath(); g.moveTo(0, S / 2); g.lineTo(S, S / 2); g.stroke();
  g.strokeStyle = '#fdf3e0'; g.lineWidth = 3;
  g.strokeRect(14, 14, S - 28, S - 28);
  g.fillStyle = '#7a1f35'; g.font = 'italic 34px Georgia, serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText("Mendl's", S / 2, S * 0.30);
  g.restore && g.restore();
  return toTex(c, { wrap: THREE.ClampToEdgeWrapping });
}
