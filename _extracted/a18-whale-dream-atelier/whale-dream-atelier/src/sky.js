import * as THREE from 'three';
import { P } from './palette.js';
import { rng, canvasTexture, makeSoftCloudTexture, makeStarTexture } from './lib.js';
import { STAR_TEX, GLOW_TEX } from './materials.js';

// ─────────────────────────────────────────────────────────────
//  The painted dusk.  A soft matte backdrop keeps the little
//  world floating in a painter's sky instead of a 3D void.
// ─────────────────────────────────────────────────────────────

function paintBackdrop() {
  const W = 2048, H = 1280;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const x = c.getContext('2d');

  const sky = x.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0.00, '#6dc4e7');
  sky.addColorStop(0.14, '#8ed2ef');
  sky.addColorStop(0.31, '#c1c9ed');
  sky.addColorStop(0.46, '#eabce4');
  sky.addColorStop(0.60, '#ffc3d5');
  sky.addColorStop(0.73, '#ffb39f');
  sky.addColorStop(0.86, '#ffc8a8');
  sky.addColorStop(1.00, '#ffe2c6');
  x.fillStyle = sky; x.fillRect(0, 0, W, H);

  // long, low cloud banks — painted, never sharp
  x.save();
  x.filter = 'blur(28px)';
  const rr = rng(4201);
  const cloudCols = [
    'rgba(255,245,236,.20)', 'rgba(255,216,224,.18)', 'rgba(206,190,255,.16)',
    'rgba(255,224,187,.20)', 'rgba(189,233,245,.12)',
  ];
  for (let i=0;i<42;i++){
    const cx = rr()*W;
    const cy = H*(.48 + rr()*.42);
    const w = 130 + rr()*380;
    const h = 26 + rr()*90;
    const col = cloudCols[Math.floor(rr()*cloudCols.length)];
    x.save();
    x.translate(cx,cy);
    x.rotate((rr()-.5)*.16);
    const g = x.createLinearGradient(0,0,w,0);
    g.addColorStop(0,'rgba(255,255,255,0)');
    g.addColorStop(.26,col);
    g.addColorStop(.7,col);
    g.addColorStop(1,'rgba(255,255,255,0)');
    x.fillStyle = g;
    x.beginPath(); x.ellipse(0,0,w,h,0,0,Math.PI*2); x.fill();
    x.restore();
  }
  // a few rounder puffs at the edges
  for (let i=0;i<18;i++){
    const left = i%2===0;
    const cx = left ? rr()*W*.22 : W - rr()*W*.22;
    const cy = H*(.55+rr()*.38);
    const rad = 90 + rr()*210;
    const g = x.createRadialGradient(cx,cy,0,cx,cy,rad);
    g.addColorStop(0,'rgba(255,241,231,.16)');
    g.addColorStop(.5,'rgba(255,210,216,.10)');
    g.addColorStop(1,'rgba(255,210,216,0)');
    x.fillStyle = g; x.fillRect(cx-rad,cy-rad,rad*2,rad*2);
  }
  x.restore();

  // luminous low sun
  const sx = W*.735, sy = H*.27;
  let sun = x.createRadialGradient(sx,sy,0,sx,sy,W*.30);
  sun.addColorStop(0,'rgba(255,255,240,.98)');
  sun.addColorStop(.035,'rgba(255,251,216,.96)');
  sun.addColorStop(.10,'rgba(255,235,188,.60)');
  sun.addColorStop(.28,'rgba(255,207,169,.24)');
  sun.addColorStop(.62,'rgba(255,184,169,.09)');
  sun.addColorStop(1,'rgba(255,176,166,0)');
  x.fillStyle = sun; x.fillRect(0,0,W,H);
  // a smaller, crisp pearl of sun
  let disc = x.createRadialGradient(sx,sy,0,sx,sy,W*.030);
  disc.addColorStop(0,'rgba(255,255,252,1)');
  disc.addColorStop(.63,'rgba(255,248,215,.95)');
  disc.addColorStop(.85,'rgba(255,230,174,.55)');
  disc.addColorStop(1,'rgba(255,225,171,0)');
  x.fillStyle = disc; x.beginPath(); x.arc(sx,sy,W*.030,0,Math.PI*2); x.fill();

  // hot horizon glow on the right
  let horizon = x.createLinearGradient(0,H*.58,0,H);
  horizon.addColorStop(0,'rgba(255,241,225,0)');
  horizon.addColorStop(.56,'rgba(255,206,173,.18)');
  horizon.addColorStop(1,'rgba(255,187,153,.22)');
  x.fillStyle = horizon; x.fillRect(0,H*.58,W,H*.42);

  // a veil of luminous spindrift
  x.save();
  x.filter = 'blur(10px)';
  for (let i=0;i<50;i++){
    const cx = rr()*W, cy=H*(.18+rr()*.8);
    x.fillStyle = 'rgba(255,248,238,'+(.02+rr()*.05)+')';
    x.beginPath(); x.ellipse(cx,cy,4+rr()*20,1+rr()*3,rr()*.6,0,Math.PI*2); x.fill();
  }
  x.restore();

  // edge warm-cool vignette gently baked in
  const v = x.createRadialGradient(W*.5,H*.46,W*.22,W*.5,H*.5,W*.72);
  v.addColorStop(0,'rgba(98,70,103,0)');
  v.addColorStop(.75,'rgba(116,75,101,.055)');
  v.addColorStop(1,'rgba(91,55,84,.15)');
  x.fillStyle = v; x.fillRect(0,0,W,H);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function envTexture() {
  return canvasTexture(1024, 512, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0.0, '#a7e2f3');
    g.addColorStop(0.25, '#d6dffa');
    g.addColorStop(0.47, '#f4cfe7');
    g.addColorStop(0.62, '#ffc4b5');
    g.addColorStop(0.78, '#ecc6dd');
    g.addColorStop(1.0, '#9385c4');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    const sx = w * 0.79, sy = h * 0.34;
    let rg = ctx.createRadialGradient(sx, sy, 0, sx, sy, w * .22);
    rg.addColorStop(0, 'rgba(255,255,235,1)');
    rg.addColorStop(.05, 'rgba(255,246,198,.96)');
    rg.addColorStop(.2, 'rgba(255,206,146,.5)');
    rg.addColorStop(.6, 'rgba(255,173,140,.12)');
    rg.addColorStop(1, 'rgba(255,170,150,0)');
    ctx.fillStyle = rg; ctx.fillRect(0, 0, w, h);
    const rr = rng(10);
    for (let i = 0; i < 16; i++) {
      const x = rr() * w, y = h * (.48 + rr() * .32), rad = 50 + rr() * 170;
      const cg = ctx.createRadialGradient(x, y, 0, x, y, rad);
      cg.addColorStop(0, 'rgba(255,241,239,.15)');
      cg.addColorStop(.55, 'rgba(240,207,234,.06)');
      cg.addColorStop(1, 'rgba(220,160,210,0)');
      ctx.fillStyle = cg; ctx.fillRect(x-rad, y-rad, rad*2, rad*2);
    }
  });
}

function distantClouds() {
  const g = new THREE.Group();
  const tex = makeSoftCloudTexture(256);
  const mat = new THREE.SpriteMaterial({
    map: tex, color: '#ffede6', transparent: true, opacity: .22,
    depthWrite: false, toneMapped: true,
  });
  const r = rng(73);
  const specs = [
    [-20, -3.2, -17, 16], [-8, -5.4, -24, 21], [13, -4.8, -21, 18], [26, -2, -9, 15],
    [-26, .4, 6, 19], [22, 2.4, 12, 14], [4, -6.8, 22, 22], [-15, -7.0, 19, 20],
    [-24, 8.8, -10, 16], [29, 7.4, 1, 22],
  ];
  for (const [x, y, z, s] of specs) {
    const sp = new THREE.Sprite(mat.clone());
    sp.position.set(x, y, z);
    sp.scale.set(s * (1.4 + r() * .5), s * (.45 + r() * .16), 1);
    sp.material.opacity = .10 + r() * .12;
    sp.material.rotation = (r() - .5) * .2;
    g.add(sp);
  }
  g.renderOrder = -900;
  return g;
}

function dustField() {
  const N = 150;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  const r = rng(98);
  const pal = [new THREE.Color('#ffe4b4'), new THREE.Color('#ffc5d3'), new THREE.Color('#c6eaf3'), new THREE.Color('#fff5dc')];
  for (let i = 0; i < N; i++) {
    const a = r() * Math.PI * 2;
    const rad = 8 + r() * 24;
    pos[i*3] = Math.cos(a) * rad;
    pos[i*3+1] = -2 + r() * 17;
    pos[i*3+2] = Math.sin(a) * rad;
    const c = pal[Math.floor(r() * pal.length)];
    col[i*3] = c.r; col[i*3+1] = c.g; col[i*3+2] = c.b;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({
    map: STAR_TEX, size: .2, vertexColors: true, transparent: true,
    opacity: .7, depthWrite: false, blending: THREE.AdditiveBlending,
    sizeAttenuation: true, toneMapped: false,
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  return pts;
}

export function createSky(scene, renderer) {
  const bg = paintBackdrop();
  scene.background = bg;

  const env = envTexture();
  env.mapping = THREE.EquirectangularReflectionMapping;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envRT = pmrem.fromEquirectangular(env);
  scene.environment = envRT.texture;
  scene.environmentIntensity = .55;
  env.dispose();
  pmrem.dispose();

  const far = distantClouds();
  scene.add(far);
  const dust = dustField();
  scene.add(dust);
  const initial = dust.geometry.attributes.position.array.slice();

  function update(t) {
    far.rotation.y = Math.sin(t * .006) * .012;
    const arr = dust.geometry.attributes.position.array;
    for (let i = 0; i < arr.length / 3; i++) {
      const ix = i * 3;
      arr[ix + 1] = initial[ix + 1] + Math.sin(t * .12 + i * 1.7) * .55;
      arr[ix] = initial[ix] + Math.cos(t * .07 + i * 2.1) * .35;
    }
    dust.geometry.attributes.position.needsUpdate = true;
  }
  return { background: bg, dust, far, update };
}

export function halo(color = '#ffd7a8', scale = 3, opacity = .32) {
  const m = new THREE.SpriteMaterial({ map: GLOW_TEX, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const s = new THREE.Sprite(m);
  s.scale.setScalar(scale);
  return s;
}
