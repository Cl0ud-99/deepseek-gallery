import * as THREE from 'three';

/* ------------------------------------------------------------------ *
 *  Canvas helpers
 * ------------------------------------------------------------------ */
export function cv(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

export function makeTex(canvas, o = {}) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = o.linear ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = o.clamp ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
  if (o.repeat) t.repeat.set(o.repeat[0], o.repeat[1]);
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

function grain(ctx, w, h, amount = 0.06, alpha = 1) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 255 * amount;
    d[i] += n;
    d[i + 1] += n;
    d[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
}

function speckle(ctx, w, h, count, colors, rMin = 0.4, rMax = 1.6, alpha = 0.5) {
  for (let i = 0; i < count; i++) {
    ctx.globalAlpha = alpha * (0.4 + Math.random() * 0.6);
    ctx.fillStyle = colors[(Math.random() * colors.length) | 0];
    const r = rMin + Math.random() * (rMax - rMin);
    ctx.beginPath();
    ctx.arc(Math.random() * w, Math.random() * h, r, 0, 7);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/* ------------------------------------------------------------------ *
 *  Chevron (black & white herringbone) floor
 * ------------------------------------------------------------------ */
let _chevron = null;
export function chevronTexture() {
  if (_chevron) return _chevron;
  const W = 1024, H = 1152;
  const c = cv(W, H);
  const ctx = c.getContext('2d');
  const colW = 128;            // half-chevron width
  const amp = 128;             // zigzag depth (45 deg)
  const t = 96;                // band thickness
  const vP = 2 * t;            // 192 vertical period -> 6 per tile
  const span = colW * 2;       // one full V spans two columns

  ctx.fillStyle = '#d6ccb4';
  ctx.fillRect(0, 0, W, H);

  const band = (x0, y0, th) => {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x0 + colW, y0 + amp);
    ctx.lineTo(x0 + span, y0);
    ctx.lineTo(x0 + span, y0 + th);
    ctx.lineTo(x0 + colW, y0 + amp + th);
    ctx.lineTo(x0, y0 + th);
    ctx.closePath();
  };

  for (let cx = -1; cx <= W / span; cx++) {
    const x0 = cx * span;
    for (let k = -1; k <= H / vP + 1; k++) {
      const y0 = k * vP;
      const g = ctx.createLinearGradient(x0, y0, x0 + span, y0 + amp);
      g.addColorStop(0, '#1b1712');
      g.addColorStop(0.5, '#0e0c09');
      g.addColorStop(1, '#1b1712');
      ctx.fillStyle = g;
      band(x0, y0, t);
      ctx.fill();
    }
  }

  // bevel highlight along the lower edge of each band
  ctx.strokeStyle = 'rgba(226,218,198,0.18)';
  ctx.lineWidth = 1.8;
  for (let cx = -1; cx <= W / span; cx++) {
    const x0 = cx * span;
    for (let k = -1; k <= H / vP + 1; k++) {
      const y0 = k * vP + t;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x0 + colW, y0 + amp);
      ctx.lineTo(x0 + span, y0);
      ctx.stroke();
    }
  }

  // tonal variation
  for (let i = 0; i < 22; i++) {
    ctx.fillStyle = `rgba(20,16,12,${0.03 + Math.random() * 0.05})`;
    ctx.beginPath();
    ctx.ellipse(Math.random() * W, Math.random() * H, 40 + Math.random() * 120, 30 + Math.random() * 90, Math.random() * 3, 0, 7);
    ctx.fill();
  }

  grain(ctx, W, H, 0.06);
  speckle(ctx, W, H, 1400, ['#3a332a', '#e8e0cc'], 0.4, 1.2, 0.22);
  _chevron = makeTex(c, { repeat: [1.9, 1.9] });
  return _chevron;
}

/* small version used for mats / inlays */
export function chevronSmallTexture(colA = '#0f0d0b', colB = '#e8e2d2', reps = 3) {
  const S = 512;
  const c = cv(S, S);
  const ctx = c.getContext('2d');
  ctx.fillStyle = colB;
  ctx.fillRect(0, 0, S, S);
  const colW = 64;
  const amp = 64;
  const t = 64;
  const vP = 2 * t;
  const span = colW * 2;
  for (let cx = -1; cx <= S / span; cx++) {
    const x0 = cx * span;
    for (let k = -1; k <= S / vP + 1; k++) {
      const y0 = k * vP;
      ctx.fillStyle = colA;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x0 + colW, y0 + amp);
      ctx.lineTo(x0 + span, y0);
      ctx.lineTo(x0 + span, y0 + t);
      ctx.lineTo(x0 + colW, y0 + amp + t);
      ctx.lineTo(x0, y0 + t);
      ctx.closePath();
      ctx.fill();
    }
  }
  grain(ctx, S, S, 0.05);
  return makeTex(c, { repeat: [reps, reps] });
}

/* ------------------------------------------------------------------ *
 *  Wood / bark / soil
 * ------------------------------------------------------------------ */
export function woodTexture(base = '#3a2a1e', dark = '#241a12', planks = 4, rep = [1, 1]) {
  const W = 512, H = 512;
  const c = cv(W, H);
  const ctx = c.getContext('2d');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < planks; i++) {
    const y = (i * H) / planks;
    ctx.fillStyle = i % 2 ? dark : base;
    ctx.fillRect(0, y, W, H / planks - 2);
    for (let g = 0; g < 40; g++) {
      ctx.strokeStyle = `rgba(0,0,0,${0.03 + Math.random() * 0.08})`;
      ctx.lineWidth = 0.6 + Math.random() * 1.6;
      ctx.beginPath();
      const yy = y + Math.random() * (H / planks);
      ctx.moveTo(0, yy);
      ctx.bezierCurveTo(W * 0.3, yy + (Math.random() - 0.5) * 8, W * 0.7, yy + (Math.random() - 0.5) * 8, W, yy);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, y + H / planks - 2, W, 2);
  }
  grain(ctx, W, H, 0.07);
  return makeTex(c, { repeat: rep });
}

export function barkTexture(base = '#3b2b20', dark = '#170f0a', light = '#6b5238') {
  const W = 256, H = 512;
  const c = cv(W, H);
  const ctx = c.getContext('2d');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 220; i++) {
    const x = Math.random() * W;
    const w = 1 + Math.random() * 6;
    ctx.strokeStyle = Math.random() > 0.45 ? dark : light;
    ctx.globalAlpha = 0.15 + Math.random() * 0.5;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(x, -10);
    let xx = x;
    for (let y = 0; y < H + 20; y += 32) {
      xx += (Math.random() - 0.5) * 6;
      ctx.lineTo(xx, y);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  grain(ctx, W, H, 0.1);
  return makeTex(c, { repeat: [1, 2] });
}

export function soilTexture() {
  const S = 512;
  const c = cv(S, S);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#3a2d20';
  ctx.fillRect(0, 0, S, S);
  speckle(ctx, S, S, 5000, ['#33281d', '#0f0c09', '#4a3a28', '#2f3a26'], 0.5, 2.6, 0.7);
  for (let i = 0; i < 260; i++) {
    ctx.strokeStyle = `rgba(90,74,48,${0.05 + Math.random() * 0.16})`;
    ctx.lineWidth = 0.5 + Math.random();
    ctx.beginPath();
    const x = Math.random() * S, y = Math.random() * S;
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - 0.5) * 26, y + (Math.random() - 0.5) * 26);
    ctx.stroke();
  }
  return makeTex(c, { repeat: [3, 3] });
}

export function corkTexture() {
  const S = 512;
  const c = cv(S, S);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#b08a55';
  ctx.fillRect(0, 0, S, S);
  speckle(ctx, S, S, 9000, ['#8d6b3d', '#c9a470', '#6f5330', '#d9bd8e'], 0.6, 2.4, 0.75);
  grain(ctx, S, S, 0.08);
  return makeTex(c);
}

/* ------------------------------------------------------------------ *
 *  Signs & print
 * ------------------------------------------------------------------ */
export function welcomeSign() {
  const W = 1024, H = 512;
  const c = cv(W, H);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#4a3524';
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 90; i++) {
    ctx.strokeStyle = `rgba(0,0,0,${0.03 + Math.random() * 0.1})`;
    ctx.lineWidth = 0.6 + Math.random() * 2;
    ctx.beginPath();
    const y = Math.random() * H;
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(W * 0.3, y + (Math.random() - 0.5) * 14, W * 0.7, y + (Math.random() - 0.5) * 14, W, y);
    ctx.stroke();
  }
  ctx.strokeStyle = '#d8c69f';
  ctx.lineWidth = 5;
  ctx.strokeRect(26, 26, W - 52, H - 52);

  ctx.fillStyle = '#e9dcbc';
  ctx.textAlign = 'center';
  ctx.font = 'bold 76px Georgia, "Times New Roman", serif';
  ctx.fillText('WELCOME TO', W / 2, 150);
  ctx.font = 'bold 118px Georgia, "Times New Roman", serif';
  ctx.fillText('TWIN PEAKS', W / 2, 268);

  // little mountain glyph
  ctx.strokeStyle = '#e9dcbc';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 150, 330);
  ctx.lineTo(W / 2 - 70, 282);
  ctx.lineTo(W / 2 - 20, 316);
  ctx.lineTo(W / 2 + 26, 268);
  ctx.lineTo(W / 2 + 120, 330);
  ctx.stroke();

  ctx.font = '52px Georgia, "Times New Roman", serif';
  ctx.fillText('POP. 51,201', W / 2, 410);
  ctx.font = 'italic 30px Georgia, "Times New Roman", serif';
  ctx.fillStyle = 'rgba(233,220,188,0.7)';
  ctx.fillText('elev. 3,110 ft  \u00b7  home of the double R', W / 2, 460);
  grain(ctx, W, H, 0.05);
  return makeTex(c, { clamp: true });
}

export function lauraPhoto() {
  const W = 512, H = 640;
  const c = cv(W, H);
  const ctx = c.getContext('2d');
  const bg = ctx.createRadialGradient(W / 2, H * 0.4, 40, W / 2, H * 0.45, W * 0.8);
  bg.addColorStop(0, '#9a9a94');
  bg.addColorStop(1, '#2a2a28');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // shoulders / dress
  ctx.fillStyle = '#d9d6cd';
  ctx.beginPath();
  ctx.moveTo(W * 0.18, H);
  ctx.quadraticCurveTo(W * 0.22, H * 0.62, W * 0.42, H * 0.58);
  ctx.lineTo(W * 0.58, H * 0.58);
  ctx.quadraticCurveTo(W * 0.78, H * 0.62, W * 0.82, H);
  ctx.closePath();
  ctx.fill();
  // neck
  ctx.fillStyle = '#e4e0d6';
  ctx.fillRect(W * 0.45, H * 0.5, W * 0.1, H * 0.12);
  // hair
  ctx.fillStyle = '#2b2723';
  ctx.beginPath();
  ctx.ellipse(W / 2, H * 0.4, W * 0.19, H * 0.2, 0, 0, 7);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(W * 0.3, H * 0.36);
  ctx.quadraticCurveTo(W * 0.22, H * 0.62, W * 0.34, H * 0.66);
  ctx.quadraticCurveTo(W * 0.3, H * 0.5, W * 0.36, H * 0.36);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(W * 0.7, H * 0.36);
  ctx.quadraticCurveTo(W * 0.78, H * 0.62, W * 0.66, H * 0.66);
  ctx.quadraticCurveTo(W * 0.7, H * 0.5, W * 0.64, H * 0.36);
  ctx.fill();
  // face
  ctx.fillStyle = '#ded9ce';
  ctx.beginPath();
  ctx.ellipse(W / 2, H * 0.41, W * 0.125, H * 0.135, 0, 0, 7);
  ctx.fill();
  // eyes / mouth (soft, no likeness)
  ctx.fillStyle = '#3a3530';
  ctx.beginPath(); ctx.ellipse(W * 0.45, H * 0.4, 9, 6, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(W * 0.55, H * 0.4, 9, 6, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = '#6b5a54';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(W / 2, H * 0.46, 16, 0.3, Math.PI - 0.3); ctx.stroke();
  // tiara
  ctx.fillStyle = '#f4f1e8';
  ctx.beginPath();
  ctx.moveTo(W * 0.42, H * 0.31);
  ctx.lineTo(W * 0.46, H * 0.28);
  ctx.lineTo(W * 0.5, H * 0.305);
  ctx.lineTo(W * 0.54, H * 0.28);
  ctx.lineTo(W * 0.58, H * 0.31);
  ctx.closePath();
  ctx.fill();

  // halftone
  ctx.globalAlpha = 0.16;
  for (let y = 0; y < H; y += 4) {
    for (let x = (y % 8) / 2; x < W; x += 4) {
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(x, y, 0.9, 0, 7);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  // caption
  ctx.fillStyle = 'rgba(18,16,14,0.82)';
  ctx.fillRect(0, H - 96, W, 96);
  ctx.fillStyle = '#efe9dc';
  ctx.textAlign = 'center';
  ctx.font = 'bold 34px Georgia, serif';
  ctx.fillText('LAURA PALMER', W / 2, H - 54);
  ctx.font = '22px Georgia, serif';
  ctx.fillStyle = '#c9c2b2';
  ctx.fillText('HOMECOMING QUEEN \u00b7 1989', W / 2, H - 24);
  // vignette
  const vg = ctx.createRadialGradient(W / 2, H / 2, W * 0.3, W / 2, H / 2, W * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
  grain(ctx, W, H, 0.07);
  return makeTex(c, { clamp: true });
}

export function owlCaveMap() {
  const S = 512;
  const c = cv(S, S);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#cdb389';
  ctx.fillRect(0, 0, S, S);
  speckle(ctx, S, S, 2600, ['#a98d5f', '#e0cba4', '#8a7048'], 0.5, 2.2, 0.55);
  ctx.strokeStyle = 'rgba(90,64,38,0.55)';
  ctx.lineWidth = 1.4;
  for (let i = 1; i < 8; i++) {
    ctx.beginPath(); ctx.moveTo((i * S) / 8, 0); ctx.lineTo((i * S) / 8, S); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, (i * S) / 8); ctx.lineTo(S, (i * S) / 8); ctx.stroke();
  }
  ctx.strokeStyle = '#4a3018';
  ctx.lineWidth = 5;
  // spiral
  ctx.beginPath();
  for (let a = 0; a < Math.PI * 5; a += 0.1) {
    const r = 8 + a * 7;
    const x = S * 0.32 + Math.cos(a) * r;
    const y = S * 0.34 + Math.sin(a) * r;
    a === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();
  // triangle glyph
  ctx.beginPath();
  ctx.moveTo(S * 0.68, S * 0.2);
  ctx.lineTo(S * 0.82, S * 0.44);
  ctx.lineTo(S * 0.54, S * 0.44);
  ctx.closePath();
  ctx.stroke();
  // owl glyph
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(S * 0.3, S * 0.72, 26, 0, 7);
  ctx.stroke();
  ctx.beginPath(); ctx.arc(S * 0.26, S * 0.71, 5, 0, 7); ctx.stroke();
  ctx.beginPath(); ctx.arc(S * 0.34, S * 0.71, 5, 0, 7); ctx.stroke();
  // cave passage
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(S * 0.55, S * 0.72);
  ctx.bezierCurveTo(S * 0.62, S * 0.6, S * 0.75, S * 0.68, S * 0.86, S * 0.58);
  ctx.stroke();
  ctx.fillStyle = '#4a3018';
  ctx.font = 'bold 26px Georgia, serif';
  ctx.fillText('OWL CAVE', 24, 44);
  ctx.font = '16px Georgia, serif';
  ctx.fillText('N 48\u00b0 51\'  W 121\u00b0 44\'', 24, S - 24);
  // tape
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = '#e8ddc4';
  ctx.fillRect(S * 0.55, 0, 40, 60);
  ctx.globalAlpha = 1;
  return makeTex(c, { clamp: true });
}

export function fbiTape() {
  const W = 512, H = 160;
  const c = cv(W, H);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#1b1a18';
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(0, i * 20, W, 2);
  }
  ctx.fillStyle = '#e8e2d0';
  ctx.fillRect(24, 28, W - 48, 104);
  ctx.fillStyle = '#1b1a18';
  ctx.font = 'bold 22px "Courier New", monospace';
  ctx.fillText('FEDERAL BUREAU OF INVESTIGATION', 40, 62);
  ctx.font = 'bold 30px "Courier New", monospace';
  ctx.fillText('COOPER, D.  \u2014  TAPE 3', 40, 100);
  ctx.font = '16px "Courier New", monospace';
  ctx.fillText('EVIDENCE  \u00b7  DO NOT DUPLICATE', 40, 122);
  return makeTex(c, { clamp: true });
}

export function posterTrout() {
  const W = 512, H = 720;
  const c = cv(W, H);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#e6dcc2';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#8e2a24';
  ctx.lineWidth = 8;
  ctx.strokeRect(18, 18, W - 36, H - 36);
  ctx.fillStyle = '#8e2a24';
  ctx.textAlign = 'center';
  ctx.font = 'bold 54px Georgia, serif';
  ctx.fillText('TWIN PEAKS', W / 2, 96);
  ctx.font = '26px Georgia, serif';
  ctx.fillText('RED TROUT', W / 2, 134);
  // fish
  ctx.save();
  ctx.translate(W / 2, 330);
  ctx.fillStyle = '#b23a2c';
  ctx.beginPath();
  ctx.ellipse(0, 0, 150, 62, -0.12, 0, 7);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(140, -6);
  ctx.lineTo(205, -52);
  ctx.lineTo(196, 4);
  ctx.lineTo(205, 58);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e8dcc4';
  ctx.beginPath(); ctx.arc(-96, -14, 12, 0, 7); ctx.fill();
  ctx.fillStyle = '#5d1a12';
  ctx.beginPath(); ctx.arc(-96, -14, 5, 0, 7); ctx.fill();
  ctx.strokeStyle = '#e8dcc4';
  ctx.lineWidth = 3;
  for (let i = -40; i < 110; i += 22) {
    ctx.beginPath(); ctx.arc(i, 0, 16, -1.2, 1.2); ctx.stroke();
  }
  ctx.restore();
  ctx.fillStyle = '#4a3a28';
  ctx.font = 'italic 24px Georgia, serif';
  ctx.fillText('caught fresh at the Double R', W / 2, 520);
  ctx.fillText('pie \u00b7 coffee \u00b7 pie', W / 2, 556);
  ctx.font = 'bold 22px Georgia, serif';
  ctx.fillText('OPEN 24 HOURS', W / 2, 640);
  grain(ctx, W, H, 0.05);
  return makeTex(c, { clamp: true });
}

export function posterLog() {
  const W = 512, H = 720;
  const c = cv(W, H);
  const ctx = c.getContext('2d');
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#1b241f');
  bg.addColorStop(1, '#0c110e');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#c9b48a';
  ctx.textAlign = 'center';
  ctx.font = 'bold 46px Georgia, serif';
  ctx.fillText('THE GIANT', W / 2, 84);
  ctx.font = '20px Georgia, serif';
  ctx.fillStyle = '#8fa08a';
  ctx.fillText('he speaks in riddles', W / 2, 120);
  // giant log
  ctx.fillStyle = '#3a2a1c';
  ctx.beginPath();
  ctx.moveTo(W * 0.22, H * 0.82);
  ctx.lineTo(W * 0.34, H * 0.2);
  ctx.lineTo(W * 0.66, H * 0.2);
  ctx.lineTo(W * 0.78, H * 0.82);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#6b5236';
  ctx.lineWidth = 4;
  for (let i = 0; i < 9; i++) {
    const x = W * (0.3 + i * 0.05);
    ctx.beginPath();
    ctx.moveTo(x, H * 0.22);
    ctx.lineTo(x + (i - 4) * 6, H * 0.8);
    ctx.stroke();
  }
  // rings
  ctx.strokeStyle = '#c9b48a';
  ctx.lineWidth = 3;
  for (let r = 12; r < 60; r += 12) {
    ctx.beginPath();
    ctx.ellipse(W / 2, H * 0.2, r, r * 0.32, 0, 0, 7);
    ctx.stroke();
  }
  ctx.fillStyle = '#8fa08a';
  ctx.font = 'italic 22px Georgia, serif';
  ctx.fillText('"the owls are not what they seem"', W / 2, H - 54);
  grain(ctx, W, H, 0.06);
  return makeTex(c, { clamp: true });
}

export function vendingFront() {
  const W = 512, H = 1024;
  const c = cv(W, H);
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#2a0a10');
  g.addColorStop(0.5, '#3c0d15');
  g.addColorStop(1, '#1a0508');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // header glow
  const hg = ctx.createLinearGradient(0, 30, 0, 150);
  hg.addColorStop(0, '#ff8a7a');
  hg.addColorStop(1, '#c01428');
  ctx.fillStyle = hg;
  ctx.fillRect(28, 30, W - 56, 110);
  ctx.fillStyle = '#2a0509';
  ctx.textAlign = 'center';
  ctx.font = 'bold 44px Georgia, serif';
  ctx.fillText('GARMONBOZIA', W / 2, 84);
  ctx.font = 'bold 26px Georgia, serif';
  ctx.fillText('& DAMN GOOD COFFEE', W / 2, 122);

  // window
  ctx.fillStyle = 'rgba(10,6,6,0.75)';
  ctx.fillRect(28, 168, W - 56, 620);
  ctx.strokeStyle = '#c9a24a';
  ctx.lineWidth = 4;
  ctx.strokeRect(28, 168, W - 56, 620);

  // cans: yellow cream corn + black coffee
  const cols = 4, rows = 6;
  for (let r = 0; r < rows; r++) {
    for (let cI = 0; cI < cols; cI++) {
      const x = 62 + cI * 106;
      const y = 208 + r * 98;
      const isCoffee = (r + cI) % 3 === 0;
      ctx.fillStyle = isCoffee ? '#151312' : '#e8b93c';
      ctx.fillRect(x, y, 78, 78);
      ctx.fillStyle = isCoffee ? '#e8dcc0' : '#3a1a08';
      ctx.fillRect(x + 6, y + 26, 66, 24);
      ctx.fillStyle = isCoffee ? '#2b2724' : '#c99a2a';
      ctx.fillRect(x, y + 4, 78, 10);
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(x + 4, y + 4, 12, 70);
    }
  }
  // reflection sheen
  const sh = ctx.createLinearGradient(0, 168, W, 700);
  sh.addColorStop(0, 'rgba(255,255,255,0.16)');
  sh.addColorStop(0.4, 'rgba(255,255,255,0.02)');
  sh.addColorStop(1, 'rgba(255,255,255,0.10)');
  ctx.fillStyle = sh;
  ctx.fillRect(28, 168, W - 56, 620);

  // coin / buttons
  ctx.fillStyle = '#d8c9a8';
  ctx.fillRect(360, 812, 110, 26);
  ctx.fillStyle = '#8a7a5c';
  for (let i = 0; i < 4; i++) ctx.fillRect(372 + i * 24, 852, 14, 14);
  // dispenser
  ctx.fillStyle = '#0a0807';
  ctx.fillRect(48, 900, W - 96, 92);
  ctx.strokeStyle = '#6b5a3a';
  ctx.lineWidth = 3;
  ctx.strokeRect(48, 900, W - 96, 92);
  grain(ctx, W, H, 0.04);
  return makeTex(c, { clamp: true });
}

export function neonBoard() {
  const W = 1024, H = 384;
  const c = cv(W, H);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0b0a0c';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#2a2226';
  ctx.lineWidth = 8;
  ctx.strokeRect(6, 6, W - 12, H - 12);

  // mountain silhouette (double peak)
  ctx.beginPath();
  ctx.moveTo(40, 250);
  ctx.lineTo(190, 96);
  ctx.lineTo(300, 196);
  ctx.lineTo(430, 60);
  ctx.lineTo(600, 250);
  ctx.closePath();
  const mg = ctx.createLinearGradient(0, 60, 0, 260);
  mg.addColorStop(0, '#3a2a30');
  mg.addColorStop(1, '#140f12');
  ctx.fillStyle = mg;
  ctx.fill();

  // neon peaks outline
  ctx.shadowColor = '#ff3348';
  ctx.shadowBlur = 26;
  ctx.strokeStyle = '#ff5a68';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(40, 250);
  ctx.lineTo(190, 96);
  ctx.lineTo(300, 196);
  ctx.lineTo(430, 60);
  ctx.lineTo(600, 250);
  ctx.stroke();

  // snow caps
  ctx.strokeStyle = '#ffd9dd';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(158, 126); ctx.lineTo(190, 96); ctx.lineTo(220, 126);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(392, 96); ctx.lineTo(430, 60); ctx.lineTo(466, 96);
  ctx.stroke();

  // text
  ctx.shadowColor = '#ff2a3e';
  ctx.shadowBlur = 34;
  ctx.fillStyle = '#ffe3e6';
  ctx.textAlign = 'left';
  ctx.font = 'bold 92px Georgia, serif';
  ctx.fillText('TWIN', 650, 150);
  ctx.fillText('PEAKS', 650, 250);

  ctx.shadowBlur = 18;
  ctx.font = '30px Georgia, serif';
  ctx.fillStyle = '#ff8f9a';
  ctx.fillText('BLACK LODGE \u00b7 WA', 652, 300);
  ctx.shadowBlur = 0;

  // scanline texture
  ctx.globalAlpha = 0.16;
  for (let y = 0; y < H; y += 4) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, y, W, 1.6);
  }
  ctx.globalAlpha = 1;
  return makeTex(c, { clamp: true });
}

export function numberPlate(txt) {
  const W = 256, H = 256;
  const c = cv(W, H);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#e8dfc8';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#2a2018';
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, W - 20, H - 20);
  ctx.fillStyle = '#1c1611';
  ctx.textAlign = 'center';
  ctx.font = 'bold 132px "Courier New", monospace';
  ctx.fillText(txt, W / 2, 176);
  ctx.font = '20px "Courier New", monospace';
  ctx.fillText('GREAT NORTHERN', W / 2, 218);
  grain(ctx, W, H, 0.06);
  return makeTex(c, { clamp: true });
}

/* ------------------------------------------------------------------ *
 *  Foliage / misc alphas
 * ------------------------------------------------------------------ */
export function fernTexture() {
  const W = 256, H = 256;
  const c = cv(W, H);
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, W, H);
  ctx.translate(W / 2, H);
  for (let f = 0; f < 7; f++) {
    const ang = -Math.PI / 2 + (f - 3) * 0.36;
    ctx.save();
    ctx.rotate(ang);
    ctx.strokeStyle = '#2f4a30';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(20, -70, 8, -140);
    ctx.stroke();
    for (let i = 0; i < 16; i++) {
      const t = i / 16;
      const x = 20 * t * (1 - t) * 4 * 0.7 + 4 * t;
      const y = -140 * t;
      const len = 26 * (1 - t * 0.75);
      ctx.strokeStyle = i % 2 ? '#3d5c38' : '#263d27';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + len * 0.6, y - 6, x + len, y - 14);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x - len * 0.6, y - 6, x - len, y - 14);
      ctx.stroke();
    }
    ctx.restore();
  }
  return makeTex(c, { clamp: true });
}

export function leafCluster() {
  const S = 256;
  const c = cv(S, S);
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, S, S);
  for (let i = 0; i < 26; i++) {
    const x = S / 2 + (Math.random() - 0.5) * 150;
    const y = S / 2 + (Math.random() - 0.5) * 150;
    const r = 12 + Math.random() * 20;
    ctx.fillStyle = ['#cfd9b6', '#b7c49c', '#9fae86'][(Math.random() * 3) | 0];
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.55, Math.random() * 3, 0, 7);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  return makeTex(c, { clamp: true });
}

export function plasticAlpha() {
  const S = 256;
  const c = cv(S, S);
  const ctx = c.getContext('2d');
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 200; i++) {
    ctx.strokeStyle = `rgba(255,255,255,${0.1 + Math.random() * 0.5})`;
    ctx.lineWidth = 0.6 + Math.random() * 2;
    ctx.beginPath();
    const x = Math.random() * S, y = Math.random() * S;
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - 0.5) * 60, y + (Math.random() - 0.5) * 60);
    ctx.stroke();
  }
  return makeTex(c, { clamp: true });
}

export function mistTexture() {
  const S = 256;
  const c = cv(S, S);
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(255,255,255,0.75)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.22)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  return makeTex(c, { clamp: true });
}

export function coffeeSteam() {
  const W = 128, H = 128;
  const c = cv(W, H);
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(W / 2, H * 0.6, 2, W / 2, H * 0.6, W * 0.5);
  g.addColorStop(0, 'rgba(255,255,255,0.5)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  return makeTex(c, { clamp: true });
}

export function tvSnow() {
  const S = 256;
  const c = cv(S, S);
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(S, S);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255;
    img.data[i] = v * 0.75;
    img.data[i + 1] = v * 0.9;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const t = makeTex(c, { clamp: true });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

export function woodGrain(base = '#4a3524') {
  const S = 512;
  const c = cv(S, S);
  const ctx = c.getContext('2d');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 130; i++) {
    ctx.strokeStyle = `rgba(0,0,0,${0.03 + Math.random() * 0.12})`;
    ctx.lineWidth = 0.6 + Math.random() * 2.4;
    ctx.beginPath();
    const y = Math.random() * S;
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(S * 0.3, y + (Math.random() - 0.5) * 18, S * 0.7, y + (Math.random() - 0.5) * 18, S, y);
    ctx.stroke();
  }
  grain(ctx, S, S, 0.07);
  return makeTex(c, { repeat: [2, 1] });
}

/* glowing owl silhouette — reads far better than tiny 3D geometry */
export function owlSilhouette() {
  const W = 640, H = 400;
  const c = cv(W, H);
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, W, H);
  const cx = W / 2, cy = H * 0.58;
  const body = '#e9dfc6';
  const edge = '#241a12';

  const fill = (fn) => { ctx.beginPath(); fn(); ctx.fillStyle = body; ctx.fill(); ctx.strokeStyle = edge; ctx.lineWidth = 5; ctx.stroke(); };

  // wings
  for (const s of [-1, 1]) {
    fill(() => {
      ctx.moveTo(cx + s * 30, cy - 40);
      ctx.quadraticCurveTo(cx + s * 120, cy - 92, cx + s * 210, cy - 58);
      ctx.quadraticCurveTo(cx + s * 268, cy - 36, cx + s * 288, cy + 4);
      const tips = 4;
      for (let i = 0; i < tips; i++) {
        const x = cx + s * (286 - i * 46);
        const y = cy + 6 + i * 10;
        ctx.quadraticCurveTo(x - s * 4, y + 30, x - s * 34, y + 8);
      }
      ctx.quadraticCurveTo(cx + s * 96, cy + 44, cx + s * 34, cy + 30);
      ctx.closePath();
    });
  }
  // body
  fill(() => {
    ctx.ellipse(cx, cy + 10, 58, 92, 0, 0, Math.PI * 2);
  });
  // head
  fill(() => {
    ctx.ellipse(cx, cy - 78, 62, 56, 0, 0, Math.PI * 2);
  });
  // ear tufts
  for (const s of [-1, 1]) {
    fill(() => {
      ctx.moveTo(cx + s * 18, cy - 122);
      ctx.lineTo(cx + s * 62, cy - 108);
      ctx.lineTo(cx + s * 46, cy - 62);
      ctx.closePath();
    });
  }
  // tail
  fill(() => {
    ctx.moveTo(cx - 34, cy + 84);
    ctx.lineTo(cx - 44, cy + 148);
    ctx.lineTo(cx, cy + 132);
    ctx.lineTo(cx + 44, cy + 148);
    ctx.lineTo(cx + 34, cy + 84);
    ctx.closePath();
  });

  // facial disc
  ctx.fillStyle = '#f6efdb';
  ctx.beginPath();
  ctx.ellipse(cx, cy - 76, 54, 46, 0, 0, Math.PI * 2);
  ctx.fill();
  // eyes
  for (const s of [-1, 1]) {
    ctx.fillStyle = '#2a1f14';
    ctx.beginPath();
    ctx.arc(cx + s * 26, cy - 78, 21, 0, 7);
    ctx.fill();
    const g = ctx.createRadialGradient(cx + s * 26, cy - 80, 2, cx + s * 26, cy - 80, 15);
    g.addColorStop(0, '#fff3c4');
    g.addColorStop(0.45, '#ffc14a');
    g.addColorStop(1, '#a85c10');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx + s * 26, cy - 80, 14, 0, 7);
    ctx.fill();
    ctx.fillStyle = '#1a1208';
    ctx.beginPath();
    ctx.arc(cx + s * 26, cy - 80, 6, 0, 7);
    ctx.fill();
  }
  // beak
  ctx.fillStyle = '#c99a44';
  ctx.beginPath();
  ctx.moveTo(cx, cy - 62);
  ctx.lineTo(cx + 9, cy - 42);
  ctx.lineTo(cx - 9, cy - 42);
  ctx.closePath();
  ctx.fill();
  // chest feather marks
  ctx.strokeStyle = 'rgba(60,44,26,0.55)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(cx, cy - 6 + i * 20, 34 - i * 3, 0.35, Math.PI - 0.35);
    ctx.stroke();
  }
  return makeTex(c, { clamp: true });
}

/* ------------------------------------------------------------------ *
 *  Twede's Cafe / Double R diner sign panels
 * ------------------------------------------------------------------ */
const SCRIPT = '"Segoe Script", "Brush Script MT", "Lucida Handwriting", cursive';

export function twedesOval() {
  const W = 512, H = 256;
  const c = cv(W, H);
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, W, H);
  const cx = W / 2, cy = H / 2, rx = W * 0.47, ry = H * 0.43;

  // drop shadow
  ctx.save();
  ctx.translate(0, 8);
  ctx.fillStyle = 'rgba(20,30,40,0.35)';
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, 7);
  ctx.fill();
  ctx.restore();

  // body
  const g = ctx.createLinearGradient(0, cy - ry, 0, cy + ry);
  g.addColorStop(0, '#8cc6e6');
  g.addColorStop(0.45, '#5ea8d6');
  g.addColorStop(1, '#2f7bb0');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, 7);
  ctx.fill();
  ctx.strokeStyle = '#17384f';
  ctx.lineWidth = 9;
  ctx.stroke();
  // inner hairline
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx - 14, ry - 14, 0, 0, 7);
  ctx.stroke();

  // hand-lettered TWEDE'S
  ctx.save();
  ctx.translate(cx, cy + 4);
  ctx.rotate(-0.035);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // fit the lettering to the oval
  let fs = 112;
  ctx.font = `italic 700 ${fs}px ${SCRIPT}`;
  const tw = ctx.measureText("TWEDE'S").width;
  const targetW = rx * 1.46;
  if (tw > targetW) {
    fs = Math.floor((fs * targetW) / tw);
    ctx.font = `italic 700 ${fs}px ${SCRIPT}`;
  }
  ctx.fillStyle = '#fbfaf4';
  ctx.shadowColor = 'rgba(10,40,60,0.5)';
  ctx.shadowBlur = 6;
  ctx.fillText("TWEDE'S", 0, 0);
  ctx.restore();

  // glossy top highlight
  const gl = ctx.createLinearGradient(0, cy - ry, 0, cy);
  gl.addColorStop(0, 'rgba(255,255,255,0.35)');
  gl.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gl;
  ctx.beginPath();
  ctx.ellipse(cx, cy - ry * 0.35, rx * 0.85, ry * 0.5, 0, 0, 7);
  ctx.fill();
  return makeTex(c, { clamp: true });
}

export function rrPanel() {
  const S = 384;
  const c = cv(S, S);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#f4efe3';
  ctx.fillRect(0, 0, S, S);
  // frame
  ctx.strokeStyle = '#2b2a26';
  ctx.lineWidth = 9;
  ctx.strokeRect(14, 14, S - 28, S - 28);
  ctx.strokeStyle = 'rgba(43,42,38,0.35)';
  ctx.lineWidth = 3;
  ctx.strokeRect(28, 28, S - 56, S - 56);

  ctx.save();
  ctx.translate(S / 2, S / 2 + 10);
  ctx.rotate(-0.06);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `italic 700 210px ${SCRIPT}`;
  ctx.fillStyle = '#d94a33';
  ctx.shadowColor = 'rgba(140,40,25,0.35)';
  ctx.shadowBlur = 8;
  ctx.fillText('RR', 0, 0);
  ctx.restore();

  grain(ctx, S, S, 0.035);
  return makeTex(c, { clamp: true });
}

export function cafePanel() {
  const W = 896, H = 288;
  const c = cv(W, H);
  const ctx = c.getContext('2d');
  // vertical candy stripes
  const n = 11;
  const sw = W / n;
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#efd394' : '#fdfbf2';
    ctx.fillRect(i * sw, 0, sw + 1, H);
  }
  // subtle vertical shading
  const vg = ctx.createLinearGradient(0, 0, 0, H);
  vg.addColorStop(0, 'rgba(255,255,255,0.35)');
  vg.addColorStop(0.5, 'rgba(255,255,255,0)');
  vg.addColorStop(1, 'rgba(120,100,60,0.18)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
  // frame
  ctx.strokeStyle = '#232220';
  ctx.lineWidth = 12;
  ctx.strokeRect(8, 8, W - 16, H - 16);
  ctx.strokeStyle = 'rgba(35,34,32,0.35)';
  ctx.lineWidth = 3;
  ctx.strokeRect(26, 26, W - 52, H - 52);

  // Cafe script
  ctx.save();
  ctx.translate(W / 2, H / 2 + 12);
  ctx.rotate(-0.04);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `italic 700 205px ${SCRIPT}`;
  ctx.fillStyle = '#1d1c1a';
  ctx.shadowColor = 'rgba(0,0,0,0.25)';
  ctx.shadowBlur = 6;
  ctx.fillText('Cafe', 0, 0);
  ctx.restore();

  grain(ctx, W, H, 0.04);
  return makeTex(c, { clamp: true });
}
