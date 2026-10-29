import * as THREE from 'three';
import { P } from './palette.js';
import { canvasTexture, rng, makeGlowTexture, makeStarTexture, contactShadowTexture } from './lib.js';

// ─────────────────────────────────────────────────────────────
//  A tiny picture-book material library.
//  MeshToonMaterial gives us the clean two/three-tone rendering;
//  a handful of glowing and jelly materials carry the fantasy.
// ─────────────────────────────────────────────────────────────

// soft 6-stop light ramp — broad enough to stay tender, stepped
// enough to read as illustrated rather than photographic.
const ramp = new Uint8Array([
  105, 105, 105, 255,
  148, 148, 148, 255,
  186, 186, 186, 255,
  218, 218, 218, 255,
  240, 240, 240, 255,
  255, 255, 255, 255,
]);
export const toonRamp = new THREE.DataTexture(ramp, 6, 1, THREE.RGBAFormat);
toonRamp.minFilter = THREE.NearestFilter;
toonRamp.magFilter = THREE.NearestFilter;
toonRamp.generateMipmaps = false;
toonRamp.needsUpdate = true;

const toonCache = new Map();
export function toon(color, opts = {}) {
  const key = color + '|' + JSON.stringify(opts);
  if (toonCache.has(key)) return toonCache.get(key);
  const m = new THREE.MeshToonMaterial({
    color,
    gradientMap: toonRamp,
    ...opts,
  });
  if (opts.emissive) m.emissive = new THREE.Color(opts.emissive);
  toonCache.set(key, m);
  return m;
}

export function basic(color, opts = {}) {
  return new THREE.MeshBasicMaterial({ color, ...opts });
}

export function glow(color, intensity = 1.6, opacity = 1) {
  const c = new THREE.Color(color);
  c.multiplyScalar(intensity);
  return new THREE.MeshBasicMaterial({
    color: c,
    transparent: opacity < 1,
    opacity,
    toneMapped: false,
    depthWrite: opacity >= 1,
    blending: opacity < 1 ? THREE.AdditiveBlending : THREE.NormalBlending,
    side: THREE.DoubleSide,
  });
}

export function brassMaterial(color = P.brass) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: .68,
    roughness: .27,
    envMapIntensity: 1.35,
  });
}

export function pearlMaterial(color = P.pearl) {
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness: .05,
    roughness: .25,
    clearcoat: .8,
    clearcoatRoughness: .2,
    iridescence: .6,
    iridescenceIOR: 1.32,
    envMapIntensity: 1.2,
  });
}

// glass-like, but cheap: no transmission pass
export function jellyMaterial(color = P.dyeRose, opacity = .5) {
  const m = new THREE.MeshPhysicalMaterial({
    color,
    transparent: true,
    opacity,
    roughness: .08,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: .08,
    iridescence: .9,
    iridescenceIOR: 1.28,
    iridescenceThicknessRange: [120, 700],
    envMapIntensity: 1.8,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  return m;
}

export function bubbleMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: '#f3efff',
    transparent: true,
    opacity: .32,
    roughness: .04,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: .02,
    iridescence: 1,
    iridescenceIOR: 1.4,
    iridescenceThicknessRange: [80, 900],
    envMapIntensity: 2.3,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
}

// ── canvas textures ──────────────────────────────────────────
export const TEX = {};

TEX.wood = canvasTexture(512, 512, (ctx, w, h) => {
  const base = ctx.createLinearGradient(0, 0, w, 0);
  base.addColorStop(0, '#e0aa7d');
  base.addColorStop(.28, '#f2c696');
  base.addColorStop(.55, '#dba173');
  base.addColorStop(.8, '#efbd8c');
  base.addColorStop(1, '#d3966b');
  ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
  const r = rng(42);
  for (let i = 0; i < 110; i++) {
    const y = r() * h;
    ctx.strokeStyle = `rgba(${100 + r()*70},${58 + r()*46},${44 + r()*33},${.03 + r()*.075})`;
    ctx.lineWidth = .5 + r() * 2.2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= w; x += 22) {
      ctx.lineTo(x, y + Math.sin(x * .02 + r() * 6) * (1.5 + r() * 4));
    }
    ctx.stroke();
  }
  // pale sunbleached face
  const wash = ctx.createLinearGradient(0, 0, 0, h);
  wash.addColorStop(0, 'rgba(255,244,224,.18)');
  wash.addColorStop(.5, 'rgba(255,255,255,0)');
  wash.addColorStop(1, 'rgba(111,54,39,.1)');
  ctx.fillStyle = wash; ctx.fillRect(0, 0, w, h);
}, { repeat: [1, 1] });

TEX.woodDark = canvasTexture(512, 512, (ctx, w, h) => {
  ctx.fillStyle = '#a96f53'; ctx.fillRect(0, 0, w, h);
  const r = rng(7);
  for (let i = 0; i < 90; i++) {
    const y = r() * h;
    ctx.strokeStyle = `rgba(${55 + r()*70},${28 + r()*45},${22 + r()*35},${.06 + r()*.12})`;
    ctx.lineWidth = .7 + r() * 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= w; x += 30) ctx.lineTo(x, y + Math.sin(x * .023 + r()) * 3);
    ctx.stroke();
  }
}, { repeat: [1, 1] });

TEX.deck = canvasTexture(1024, 1024, (ctx, w, h) => {
  ctx.fillStyle = '#efc597'; ctx.fillRect(0, 0, w, h);
  const r = rng(11);
  const rows = 14;
  const ph = h / rows;
  for (let row = 0; row < rows; row++) {
    const y = row * ph;
    const tint = ['#f2c89c', '#e8b789', '#f5cda2', '#e2ad7d', '#f0bf91'][row % 5];
    ctx.fillStyle = tint;
    ctx.fillRect(0, y + 2, w, ph - 4);
    // boards run lengthwise, staggered seams
    const off = (row % 3) * w * .25;
    ctx.strokeStyle = 'rgba(106,65,48,.22)';
    ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(off + w * .1, y); ctx.lineTo(off + w * .1, y + ph); ctx.stroke();
    for (let i = 0; i < 12; i++) {
      ctx.strokeStyle = `rgba(107,66,46,${.025 + r() * .045})`;
      ctx.lineWidth = .7 + r() * 1.3;
      ctx.beginPath();
      ctx.moveTo(0, y + 4 + r() * (ph - 8));
      for (let x = 0; x <= w; x += 30) ctx.lineTo(x, y + ph * .5 + Math.sin(x * .008 + r() * 5) * ph * .12);
      ctx.stroke();
    }
    // sunlight seam
    ctx.strokeStyle = 'rgba(255,245,225,.45)';
    ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(0, y + 3); ctx.lineTo(w, y + 3); ctx.stroke();
    ctx.strokeStyle = 'rgba(86,49,43,.34)';
    ctx.beginPath(); ctx.moveTo(0, y + ph - 2); ctx.lineTo(w, y + ph - 2); ctx.stroke();
  }
}, { repeat: [1, 1] });

TEX.roof = canvasTexture(512, 512, (ctx, w, h) => {
  const base = ctx.createLinearGradient(0, 0, w, h);
  base.addColorStop(0, '#ffc2b0');
  base.addColorStop(.45, '#ec979b');
  base.addColorStop(1, '#e98b98');
  ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
  const rows = 8, cols = 6;
  const cw = w / cols, ch = h / rows;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * cw + (row % 2 ? cw * .5 : 0);
      const y = row * ch;
      // individual rounded tile highlights
      const grd = ctx.createLinearGradient(x, y, x, y + ch);
      grd.addColorStop(0, 'rgba(255,237,210,.28)');
      grd.addColorStop(.62, 'rgba(255,186,176,.03)');
      grd.addColorStop(1, 'rgba(114,54,89,.16)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.moveTo(x - cw * .52, y);
      ctx.lineTo(x + cw * .52, y);
      ctx.lineTo(x + cw * .52, y + ch * .8);
      ctx.quadraticCurveTo(x, y + ch * 1.08, x - cw * .52, y + ch * .8);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(116,65,87,.22)'; ctx.lineWidth = 1.8; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,226,200,.27)'; ctx.lineWidth = 1.1; ctx.stroke();
    }
  }
  // gilded hairline on each barrel
  ctx.globalAlpha = .22;
  for (let i = 0; i <= cols; i++) {
    ctx.strokeStyle = '#ffe4a5'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(i * cw, 0); ctx.lineTo(i * cw, h); ctx.stroke();
  }
  ctx.globalAlpha = 1;
}, { repeat: [1.8, 1.2] });

TEX.washi = canvasTexture(256, 256, (ctx, w, h) => {
  ctx.fillStyle = '#fff3dc'; ctx.fillRect(0, 0, w, h);
  const r = rng(19);
  for (let i = 0; i < 120; i++) {
    ctx.strokeStyle = `rgba(230,187,146,${.04 + r() * .08})`;
    ctx.lineWidth = .6;
    ctx.beginPath();
    const x = r() * w, y = r() * h;
    ctx.moveTo(x, y); ctx.lineTo(x + (r()-.5) * 50, y + (r()-.5) * 50); ctx.stroke();
  }
  for (let i = 0; i < 6; i++) {
    const x = r()*w, y = r()*h, rr = 5+r()*17;
    const g = ctx.createRadialGradient(x,y,0,x,y,rr);
    g.addColorStop(0,'rgba(255,200,175,.3)'); g.addColorStop(1,'rgba(255,200,175,0)');
    ctx.fillStyle=g; ctx.fillRect(x-rr,y-rr,rr*2,rr*2);
  }
}, { repeat: [1, 1] });

TEX.basket = canvasTexture(512, 512, (ctx, w, h) => {
  ctx.fillStyle = '#d6a66e'; ctx.fillRect(0, 0, w, h);
  const rows = 18;
  for (let i = 0; i < rows; i++) {
    const y = i / rows * h;
    ctx.strokeStyle = i % 2 ? 'rgba(255,229,183,.7)' : 'rgba(118,74,46,.45)';
    ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }
  for (let i = -6; i < 22; i++) {
    ctx.strokeStyle = i % 2 ? 'rgba(255,223,172,.36)' : 'rgba(102,59,40,.35)';
    ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(i * 34, 0); ctx.lineTo(i * 34 + w * .55, h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(i * 34, h); ctx.lineTo(i * 34 + w * .55, 0); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255,243,210,.25)'; ctx.lineWidth = 3;
  for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(0, 40+i*110); ctx.lineTo(w, 40+i*110); ctx.stroke(); }
}, { repeat: [1, 1] });

TEX.starCloth = canvasTexture(512, 512, (ctx, w, h) => {
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, '#2e3268');
  g.addColorStop(.35, '#514f9d');
  g.addColorStop(.7, '#8b6fb7');
  g.addColorStop(1, '#d4a0c8');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  const r = rng(88);
  // nebula wash
  for (let i = 0; i < 25; i++) {
    const x = r()*w, y = r()*h, rad = 30 + r()*110;
    const ng = ctx.createRadialGradient(x,y,0,x,y,rad);
    const col = ['255,170,194','180,162,255','255,225,164','144,225,232'][Math.floor(r()*4)];
    ng.addColorStop(0, `rgba(${col},.2)`); ng.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = ng; ctx.fillRect(0,0,w,h);
  }
  // spiral galaxy
  ctx.strokeStyle = 'rgba(255,225,176,.35)'; ctx.lineWidth = 2;
  for (let k = 0; k < 3; k++) {
    ctx.beginPath();
    for (let i = 0; i < 80; i++) {
      const a = i * .16 + k, rad = 15 + i * 2.2;
      const x = w*.5 + Math.cos(a) * rad, y = h*.5 + Math.sin(a) * rad * .75;
      if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.stroke();
  }
  for (let i = 0; i < 150; i++) {
    const x = r()*w, y = r()*h, s = r() < .13 ? 2.5 + r()*3.5 : .7 + r()*1.6;
    const a = .35 + r()*.6;
    ctx.fillStyle = r() < .25 ? `rgba(255,215,143,${a})` : `rgba(255,246,235,${a})`;
    ctx.beginPath();
    if (r() < .25) {
      const spikes = 4, ro = s*2, ri = s*.46;
      for (let q=0;q<spikes*2;q++){ const ang=q*Math.PI/spikes - Math.PI/2; const rad=q%2?ri:ro; const px=x+Math.cos(ang)*rad, py=y+Math.sin(ang)*rad; if(q===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);}
      ctx.closePath();
    } else {
      ctx.arc(x, y, s, 0, 7);
    }
    ctx.fill();
  }
}, { repeat: [1, 1] });

TEX.rug = canvasTexture(512, 512, (ctx, w, h) => {
  const g = ctx.createRadialGradient(w*.5,h*.5,w*.1,w*.5,h*.5,w*.7);
  g.addColorStop(0,'#ffe8da'); g.addColorStop(.35,'#ffc8d1'); g.addColorStop(.72,'#d8c4ff'); g.addColorStop(1,'#b8dff1');
  ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
  const r = rng(31);
  for(let i=0;i<22;i++){
    ctx.strokeStyle = `rgba(255,251,233,${.15+r()*.24})`;
    ctx.lineWidth = 2+r()*4; ctx.beginPath();
    ctx.arc(w*.5,h*.5, 30+i*11, 0, Math.PI*2);
    ctx.stroke();
  }
  for(let i=0;i<180;i++){
    ctx.fillStyle = ['rgba(255,255,255,.4)','rgba(255,225,166,.44)','rgba(164,214,255,.28)'][i%3];
    ctx.beginPath(); ctx.arc(r()*w, r()*h, .8+r()*2.3, 0, 7); ctx.fill();
  }
  // woven edge
  ctx.strokeStyle='rgba(255,246,226,.8)'; ctx.lineWidth=9;
  ctx.setLineDash([5,9]); ctx.beginPath(); ctx.arc(w*.5,h*.5,w*.46,0,7); ctx.stroke();
}, { repeat: [1,1] });

TEX.waterFoam = canvasTexture(256, 256, (ctx,w,h) => {
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,w,h);
  const g = ctx.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);
  g.addColorStop(0,'rgba(255,255,255,.85)');
  g.addColorStop(.6,'rgba(255,255,255,.1)');
  g.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
}, { repeat: [1,1] });

export const GLOW_TEX = makeGlowTexture(256);
export const STAR_TEX = makeStarTexture(128);
export const SHADOW_TEX = contactShadowTexture();

// ── shared materials ────────────────────────────────────────
export const MAT = {
  wood: toon('#f0d0af', { map: TEX.wood }),
  woodWarm: toon('#d7a075', { map: TEX.wood }),
  woodDark: toon('#9b6551', { map: TEX.woodDark }),
  deck: toon('#ffe6c6', { map: TEX.deck }),
  cream: toon(P.cream),
  plaster: toon(P.plaster),
  plasterShade: toon(P.plasterShade),
  roof: toon('#ffffff', { map: TEX.roof }),
  washi: basic('#ffe8c9', { map: TEX.washi, transparent: true, opacity: .65, side: THREE.DoubleSide, toneMapped: false }),
  brass: brassMaterial(),
  brassSoft: brassMaterial('#e6bd7f'),
  goldGlow: basic('#ffd884', { toneMapped: false }),
  leaf: toon('#acd9c4', { side: THREE.DoubleSide }),
  leafPink: toon('#f7b9d0', { side: THREE.DoubleSide }),
  cloud: toon(P.cloudCream, { emissive: '#ffcfba', emissiveIntensity: .10 }),
  cloudPink: toon(P.cloudPink, { emissive: '#ffb8ae', emissiveIntensity: .12 }),
  cloudLilac: toon(P.cloudLilac, { emissive: '#d7b7e9', emissiveIntensity: .10 }),
  cloudBlue: toon(P.cloudBlue, { emissive: '#b8e5ef', emissiveIntensity: .08 }),
  basket: toon('#ffffff', { map: TEX.basket }),
  starCloth: new THREE.MeshToonMaterial({ map: TEX.starCloth, gradientMap: toonRamp, emissive: '#8a67d4', emissiveMap: TEX.starCloth, emissiveIntensity: .38 }),
  clothPlain: toon('#ffe4d2', { side: THREE.DoubleSide }),
  ink: toon(P.ink),
  inkSoft: toon(P.inkSoft),
  white: toon('#fff9ef'),
  creamTrans: new THREE.MeshPhysicalMaterial({
    color: '#fff7e9', transparent: true, opacity: .34, roughness: .3, metalness: 0,
    clearcoat: 1, clearcoatRoughness: .2, iridescence: .5, side: THREE.DoubleSide, depthWrite: false,
  }),
};

export const JELLY = {
  pink: jellyMaterial('#ffb3d0', .4),
  lilac: jellyMaterial('#c9bdff', .4),
  blue: jellyMaterial('#b6ebf2', .35),
  peach: jellyMaterial('#ffc7aa', .38),
  gold: jellyMaterial('#ffe0a6', .38),
};

export const DYES = {
  pink: new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff6cab').multiplyScalar(1.25), toneMapped: false }),
  violet: new THREE.MeshBasicMaterial({ color: new THREE.Color('#a17bff').multiplyScalar(1.3), toneMapped: false }),
  gold: new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffc84c').multiplyScalar(1.25), toneMapped: false }),
  sky: new THREE.MeshBasicMaterial({ color: new THREE.Color('#5ed7e5').multiplyScalar(1.2), toneMapped: false }),
};

export function glowingOrb(color, radius = .1, intensity = 1.5) {
  return new THREE.Mesh(new THREE.IcosahedronGeometry(radius, 2), glow(color, intensity));
}

export const SPRITE_GLOW = {
  peach: new THREE.SpriteMaterial({ map: GLOW_TEX, color: '#ffcf9f', transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }),
  pink: new THREE.SpriteMaterial({ map: GLOW_TEX, color: '#ffa7ba', transparent: true, opacity: .5, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }),
  gold: new THREE.SpriteMaterial({ map: GLOW_TEX, color: '#ffdf9d', transparent: true, opacity: .56, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }),
  blue: new THREE.SpriteMaterial({ map: GLOW_TEX, color: '#a5e8ef', transparent: true, opacity: .45, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }),
};

export function glowSprite(color = 'gold', scale = 1.2, opacity = null) {
  const mat = SPRITE_GLOW[color].clone();
  if (opacity != null) mat.opacity = opacity;
  const s = new THREE.Sprite(mat);
  s.scale.setScalar(scale);
  return s;
}

export function setEnvironment(envTex) {
  // materials created before the env map exists pick it up when we
  // traverse later; this helper is kept for clarity.
  toonCache.forEach(m => { if ('envMap' in m) m.envMap = envTex; m.needsUpdate = true; });
}