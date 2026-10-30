/* =========================================================================
   月光琉璃花灵香水工坊 · 核心
   渲染器 / 相机 / 轨道控制 / 泛光后期 / 三渲二材质 / 程序化贴图 / 几何工具
   ========================================================================= */
'use strict';

const TAU = Math.PI * 2;
const rnd = (a, b) => a + Math.random() * (b - a);
const rndi = (a, b) => Math.floor(rnd(a, b + 1));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

/* ---------------------------------------------------------------- 渲染器 */
const host = document.getElementById('app');
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', stencil: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
host.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(36, window.innerWidth / window.innerHeight, 0.1, 600);

/* ------------------------------------------------------------ 共享 uniform */
const SUN_DIR = new THREE.Vector3(0.44, 0.68, 0.50).normalize();

const U = {
  uTime: { value: 0 },
  uMoon: { value: SUN_DIR.clone() },                       // 主光方向（太阳）
  uFill: { value: new THREE.Vector3(-0.55, 0.28, -0.62).normalize() },
  uSkyLight: { value: new THREE.Color(0xcfe4f0).multiplyScalar(0.22) },  // 天光环境项
  uSunTint: { value: new THREE.Color(0xfffdf6) },          // 受光面染色
  uSkyCol: { value: new THREE.Color(0xbfe4f8) },           // 玻璃/水面天空反射色
  uGlowScale: { value: 0.42 },                             // 自发光整体缩放
  uRimScale: { value: 0.52 },                              // 边缘光整体缩放
  uWarmPos: { value: new THREE.Vector3(0, 3.35, 0) },
  uWarmColor: { value: new THREE.Color(0xffa050).multiplyScalar(0.78) }
};

/* --------------------------------------------------------------- 天空穹顶 */
(function buildSky() {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, depthTest: false,
    uniforms: {
      uDeep: { value: new THREE.Color(0x4f93c8) },
      uMid: { value: new THREE.Color(0x9ccdec) },
      uHor: { value: new THREE.Color(0xeaf7fd) },
      uSunDir: { value: SUN_DIR.clone() },
      uSunCol: { value: new THREE.Color(0xfff4d8) },
      uTime: U.uTime
    },
    vertexShader: `
      varying vec3 vP;
      void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `
      precision highp float;
      varying vec3 vP;
      uniform vec3 uDeep, uMid, uHor, uSunDir, uSunCol;
      uniform float uTime;

      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
      float noise(vec2 p){
        vec2 i = floor(p), f = fract(p);
        f = f*f*(3.0-2.0*f);
        return mix(mix(hash(i), hash(i+vec2(1.0,0.0)), f.x),
                   mix(hash(i+vec2(0.0,1.0)), hash(i+vec2(1.0,1.0)), f.x), f.y);
      }
      float fbm(vec2 p){
        float v = 0.0, a = 0.5;
        for(int i=0;i<5;i++){ v += a*noise(p); p = p*2.03 + 1.7; a *= 0.5; }
        return v;
      }

      void main(){
        vec3 d = normalize(vP);
        float h = d.y;

        // 天空渐变：天顶蓝 → 地平线亮带 → 下方更深的天空蓝
        vec3 col = mix(uDeep, uMid, smoothstep(-0.95, 0.02, h));
        col = mix(col, uHor, exp(-pow(h * 5.5, 2.0)) * 0.75);
        col = mix(col, uMid, smoothstep(0.02, 0.55, h) * 0.55);

        // 太阳
        float sd = max(dot(d, uSunDir), 0.0);
        col += uSunCol * pow(sd, 14.0) * 0.10;
        col += uSunCol * pow(sd, 2200.0) * 4.0;

        // 云（上下都有，地平线附近淡出避免拉伸）
        vec2 cp = d.xz / max(abs(h) + 0.34, 0.08);
        float n1 = fbm(cp * 0.52 + vec2(uTime * 0.0030, uTime * 0.0010));
        float n2 = fbm(cp * 1.45 - vec2(uTime * 0.0022, 0.0));
        float cl = smoothstep(0.50, 0.80, n1 * 0.74 + n2 * 0.40);
        cl *= smoothstep(0.0, 0.22, abs(h));
        vec3 cc = mix(vec3(0.88, 0.93, 0.99), vec3(1.08, 1.07, 1.03), smoothstep(0.40, 0.90, n2));
        col = mix(col, cc, cl * 0.85);

        gl_FragColor = vec4(col, 1.0);
      }`
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(240, 48, 32), mat);
  sky.renderOrder = -100;
  sky.frustumCulled = false;
  scene.add(sky);
})();

/* --------------------------------------------------------------- 后期管线 */
const rtOpts = { type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: true };
let rtScene = new THREE.WebGLRenderTarget(4, 4, { ...rtOpts, samples: 4 });
let rtB1 = new THREE.WebGLRenderTarget(4, 4, rtOpts);
let rtB2 = new THREE.WebGLRenderTarget(4, 4, rtOpts);
let rtC1 = new THREE.WebGLRenderTarget(4, 4, rtOpts);
let rtC2 = new THREE.WebGLRenderTarget(4, 4, rtOpts);

const FS_VERT = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const brightMat = new THREE.ShaderMaterial({
  uniforms: { tDiffuse: { value: null }, uThr: { value: 1.45 }, uKnee: { value: 0.70 } },
  vertexShader: FS_VERT,
  fragmentShader: `
    varying vec2 vUv; uniform sampler2D tDiffuse; uniform float uThr, uKnee;
    void main(){
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      float l = dot(c, vec3(0.2126,0.7152,0.0722));
      float k = smoothstep(uThr, uThr + uKnee, l);
      gl_FragColor = vec4(c * k, 1.0);
    }`
});

const blurMat = new THREE.ShaderMaterial({
  uniforms: { tDiffuse: { value: null }, uDir: { value: new THREE.Vector2() } },
  vertexShader: FS_VERT,
  fragmentShader: `
    varying vec2 vUv; uniform sampler2D tDiffuse; uniform vec2 uDir;
    void main(){
      vec3 s = texture2D(tDiffuse, vUv).rgb * 0.2270270270;
      s += texture2D(tDiffuse, vUv + uDir*1.3846153846).rgb * 0.3162162162;
      s += texture2D(tDiffuse, vUv - uDir*1.3846153846).rgb * 0.3162162162;
      s += texture2D(tDiffuse, vUv + uDir*3.2307692308).rgb * 0.0702702703;
      s += texture2D(tDiffuse, vUv - uDir*3.2307692308).rgb * 0.0702702703;
      gl_FragColor = vec4(s, 1.0);
    }`
});

const compositeMat = new THREE.ShaderMaterial({
  uniforms: {
    tScene: { value: null }, tB1: { value: null }, tB2: { value: null },
    uExposure: { value: 0.88 }, uBloom: { value: 0.20 }, uVig: { value: 0.40 }
  },
  vertexShader: FS_VERT,
  fragmentShader: `
    varying vec2 vUv;
    uniform sampler2D tScene, tB1, tB2;
    uniform float uExposure, uBloom, uVig;

    vec3 aces(vec3 x){
      const float a=2.51, b=0.03, c=2.43, d=0.59, e=0.14;
      return clamp((x*(a*x+b))/(x*(c*x+d)+e), 0.0, 1.0);
    }
    vec3 toSRGB(vec3 c){
      c = max(c, vec3(0.0));
      return mix(c*12.92, 1.055*pow(c, vec3(1.0/2.4)) - 0.055, step(vec3(0.0031308), c));
    }
    void main(){
      vec3 col = texture2D(tScene, vUv).rgb;
      vec3 b = texture2D(tB1, vUv).rgb * 0.62 + texture2D(tB2, vUv).rgb * 0.85;
      col += b * uBloom;
      col *= uExposure;
      col = aces(col);
      col = toSRGB(col);
      float lum = dot(col, vec3(0.299, 0.587, 0.114));
      vec3 coolShadow = vec3(0.80, 0.92, 1.08);
      vec3 warmHigh = vec3(1.05, 1.02, 0.95);
      col *= mix(coolShadow, warmHigh, smoothstep(0.02, 0.55, lum));
      col = mix(col, col * col * (3.0 - 2.0 * col), 0.18);
      float lum2 = dot(col, vec3(0.299, 0.587, 0.114));
      col = mix(vec3(lum2), col, 1.16);
      float v = length((vUv - 0.5) * vec2(1.06, 1.0));
      col *= mix(1.0, 1.0 - uVig, smoothstep(0.30, 0.88, v));
      gl_FragColor = vec4(col, 1.0);
    }`
});

const quadScene = new THREE.Scene();
const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), brightMat);
quad.frustumCulled = false;
quadScene.add(quad);

function blit(mat, target) {
  quad.material = mat;
  renderer.setRenderTarget(target);
  renderer.render(quadScene, quadCam);
}

/* ------------------------------------------------------------ 轨道控制器 */
const ctrl = {
  theta: 0.34, phi: 0.90, radius: 31.0,
  tTheta: 0.34, tPhi: 0.90, tRadius: 31.0,
  target: new THREE.Vector3(0, 1.85, 0),
  dragging: false, lastInput: -9999, pointers: new Map(), pinch: 0, auto: true
};
const PHI_MIN = 0.30, PHI_MAX = 1.44, RAD_MIN = 13, RAD_MAX = 52;

/* 调试取景（无界面影响） */
(function debugCam() {
  try {
    const q = new URLSearchParams(location.search);
    if (q.has('r')) ctrl.radius = ctrl.tRadius = clamp(parseFloat(q.get('r')), 5, 60);
    if (q.has('phi')) ctrl.phi = ctrl.tPhi = clamp(parseFloat(q.get('phi')), 0.1, 1.5);
    if (q.has('th')) ctrl.theta = ctrl.tTheta = parseFloat(q.get('th'));
    if (q.has('ty')) ctrl.target.y = parseFloat(q.get('ty'));
    if (q.has('tx')) ctrl.target.x = parseFloat(q.get('tx'));
    if (q.has('tz')) ctrl.target.z = parseFloat(q.get('tz'));
    if (q.has('static')) ctrl.auto = false;
  } catch (e) { /* noop */ }
})();

function markInput() { ctrl.lastInput = performance.now() / 1000; }

(function bindControls() {
  const el = renderer.domElement;
  el.style.touchAction = 'none';

  el.addEventListener('pointerdown', e => {
    el.setPointerCapture(e.pointerId);
    ctrl.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    ctrl.dragging = true;
    markInput();
  });

  el.addEventListener('pointermove', e => {
    const p = ctrl.pointers.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    if (ctrl.pointers.size >= 2) {
      const pts = [...ctrl.pointers.values()];
      const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (ctrl.pinch > 0) ctrl.tRadius = clamp(ctrl.tRadius * (ctrl.pinch / Math.max(d, 1)), RAD_MIN, RAD_MAX);
      ctrl.pinch = d;
    } else {
      ctrl.tTheta -= dx * 0.0052;
      ctrl.tPhi = clamp(ctrl.tPhi - dy * 0.0042, PHI_MIN, PHI_MAX);
    }
    markInput();
  });

  const end = e => {
    ctrl.pointers.delete(e.pointerId);
    if (ctrl.pointers.size < 2) ctrl.pinch = 0;
    if (ctrl.pointers.size === 0) ctrl.dragging = false;
    markInput();
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  el.addEventListener('pointerleave', end);

  el.addEventListener('wheel', e => {
    e.preventDefault();
    ctrl.tRadius = clamp(ctrl.tRadius * (1 + Math.sign(e.deltaY) * 0.085), RAD_MIN, RAD_MAX);
    markInput();
  }, { passive: false });

  window.addEventListener('contextmenu', e => e.preventDefault());
})();

function updateCamera(dt) {
  const now = performance.now() / 1000;
  if (ctrl.auto && !ctrl.dragging && now - ctrl.lastInput > 4.0) ctrl.tTheta += 0.052 * dt;
  ctrl.theta = lerp(ctrl.theta, ctrl.tTheta, 1 - Math.pow(0.0015, dt));
  ctrl.phi = lerp(ctrl.phi, ctrl.tPhi, 1 - Math.pow(0.0015, dt));
  ctrl.radius = lerp(ctrl.radius, ctrl.tRadius, 1 - Math.pow(0.004, dt));
  const sp = Math.sin(ctrl.phi), cp = Math.cos(ctrl.phi);
  camera.position.set(
    ctrl.target.x + ctrl.radius * sp * Math.sin(ctrl.theta),
    ctrl.target.y + ctrl.radius * cp,
    ctrl.target.z + ctrl.radius * sp * Math.cos(ctrl.theta)
  );
  camera.lookAt(ctrl.target);
}

/* --------------------------------------------------------------- 程序化贴图 */
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  t.needsUpdate = true;
  return t;
}

const texGlow = canvasTex(128, 128, (ctx, w, h) => {
  const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  g.addColorStop(0.0, 'rgba(255,255,255,1)');
  g.addColorStop(0.18, 'rgba(255,255,255,0.62)');
  g.addColorStop(0.45, 'rgba(255,255,255,0.20)');
  g.addColorStop(0.72, 'rgba(255,255,255,0.05)');
  g.addColorStop(1.0, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
});

const texSoft = canvasTex(128, 128, (ctx, w, h) => {
  const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  g.addColorStop(0.0, 'rgba(255,255,255,0.85)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.25)');
  g.addColorStop(1.0, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
});

const texShadow = canvasTex(256, 256, (ctx, w, h) => {
  const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  g.addColorStop(0.0, 'rgba(0,0,0,0.62)');
  g.addColorStop(0.42, 'rgba(0,0,0,0.30)');
  g.addColorStop(0.75, 'rgba(0,0,0,0.07)');
  g.addColorStop(1.0, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
});

/* 蝶翼贴图：前翅 + 后翅，带翅脉与虹彩渐变（含 alpha） */
function wingTexture(seed, hueA, hueB) {
  return canvasTex(512, 512, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);

    // 前翅
    const fore = new Path2D();
    fore.moveTo(34, 296);
    fore.bezierCurveTo(58, 150, 190, 34, 372, 44);
    fore.bezierCurveTo(468, 50, 492, 148, 430, 218);
    fore.bezierCurveTo(362, 288, 200, 306, 118, 312);
    fore.closePath();

    // 后翅
    const hind = new Path2D();
    hind.moveTo(38, 306);
    hind.bezierCurveTo(186, 296, 330, 330, 382, 398);
    hind.bezierCurveTo(404, 452, 330, 500, 244, 472);
    hind.bezierCurveTo(146, 440, 66, 380, 38, 322);
    hind.closePath();

    function paint(path, y0) {
      const g = ctx.createRadialGradient(60, y0, 12, 250, y0, 400);
      g.addColorStop(0.00, 'rgba(214,246,255,0.98)');
      g.addColorStop(0.22, 'rgba(104,214,255,0.97)');
      g.addColorStop(0.55, 'rgba(58,140,240,0.96)');
      g.addColorStop(0.82, 'rgba(108,86,235,0.95)');
      g.addColorStop(1.00, 'rgba(164,120,255,0.94)');
      ctx.fillStyle = g;
      ctx.fill(path);

      ctx.save();
      ctx.clip(path);
      // 翅脉
      for (let i = 0; i < 9; i++) {
        const a = -1.30 + i * 0.20;
        ctx.beginPath();
        ctx.moveTo(46, y0);
        ctx.quadraticCurveTo(150 + i * 8, y0 + 150 * Math.sin(a), 300 + i * 22, y0 + 330 * Math.sin(a * 0.8));
        ctx.lineWidth = i % 3 === 0 ? 4.2 : 2.0;
        ctx.strokeStyle = 'rgba(240,252,255,0.42)';
        ctx.stroke();
      }
      // 鳞光斑
      for (let i = 0; i < 40; i++) {
        const x = 60 + Math.random() * 400;
        const y = y0 - 210 + Math.random() * 420;
        const r = 3 + Math.random() * 14;
        const g2 = ctx.createRadialGradient(x, y, 0, x, y, r);
        g2.addColorStop(0, 'rgba(255,255,255,0.55)');
        g2.addColorStop(1, 'rgba(170,240,255,0)');
        ctx.fillStyle = g2;
        ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
      }
      // 边缘深色描边 + 亮边
      ctx.lineWidth = 9;
      ctx.strokeStyle = 'rgba(56,92,168,0.55)';
      ctx.stroke(path);
      ctx.lineWidth = 2.4;
      ctx.strokeStyle = 'rgba(236,252,255,0.9)';
      ctx.stroke(path);
      ctx.restore();
    }

    paint(fore, 250);
    paint(hind, 380);
  });
}

/* 彩绘玻璃贴图 */
const stainedTex = canvasTex(512, 512, (ctx, w, h) => {
  ctx.fillStyle = '#0a1220';
  ctx.fillRect(0, 0, w, h);
  const cols = 6, rows = 7;
  const palette = ['#3fc8e0', '#5f7cf0', '#c86ff0', '#f0b84f', '#5fe0a8', '#f07ca8', '#9fdcf5'];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x0 = (i / cols) * w, x1 = ((i + 1) / cols) * w;
      const y0 = (j / rows) * h, y1 = ((j + 1) / rows) * h;
      const jx = (Math.random() - 0.5) * 12, jy = (Math.random() - 0.5) * 12;
      ctx.beginPath();
      ctx.moveTo(x0 + 4 + jx, y0 + 4);
      ctx.lineTo(x1 - 4, y0 + 4 + jy);
      ctx.lineTo(x1 - 4 - jx, y1 - 4);
      ctx.lineTo(x0 + 4, y1 - 4 - jy);
      ctx.closePath();
      const c = palette[(i + j * 2) % palette.length];
      const g = ctx.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, c);
      g.addColorStop(1, '#ffffff22');
      ctx.fillStyle = c;
      ctx.globalAlpha = 0.86;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#12202e';
      ctx.lineWidth = 6;
      ctx.stroke();
    }
  }
  // 光晕
  const g = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w * 0.7);
  g.addColorStop(0, 'rgba(255,255,255,0.35)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
});

/* ------------------------------------------------------------- 三渲二材质 */
const TOON_VS = `
  varying vec3 vN; varying vec3 vV; varying vec2 vUv; varying vec3 vW;
  void main(){
    vUv = uv;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vW = wp.xyz;
    vN = normalize(mat3(modelMatrix) * normal);
    vV = cameraPosition - wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }`;

const TOON_FS = `
  precision highp float;
  uniform vec3 uColor, uShade, uRim, uSpec, uGradTop, uMoon, uFill, uWarmPos, uWarmColor;
  uniform vec3 uSkyLight, uSunTint;
  uniform float uRimPow, uRimStr, uEmissive, uOpacity, uSpecStr, uGradAmt, uVein, uTime, uAO;
  uniform float uGlowScale, uRimScale;
  varying vec3 vN; varying vec3 vV; varying vec2 vUv; varying vec3 vW;

  void main(){
    vec3 n = normalize(vN);
    vec3 v = normalize(vV);
    float ndl = dot(n, uMoon);
    float lit = smoothstep(-0.28, 0.02, ndl) * 0.44 + smoothstep(0.20, 0.44, ndl) * 0.56;
    vec3 base = mix(uShade, uColor, lit) * uSunTint;

    // 天光环境（白天主要靠这一项抬亮暗部）
    base += uSkyLight * (0.42 + 0.58 * max(n.y, 0.0)) * (uColor * 0.78 + 0.22);

    if(uGradAmt > 0.001){
      float g = pow(clamp(vUv.y, 0.0, 1.0), 0.85);
      base = mix(base, mix(uShade * 0.85, uGradTop, lit), uGradAmt * (0.35 + 0.65 * g));
    }

    float fill = max(dot(n, uFill), 0.0);
    base += uColor * fill * 0.16;

    vec3 wd = uWarmPos - vW;
    float wdist = length(wd);
    float wAtt = 1.0 / (1.0 + wdist * wdist * 0.34);
    float wNdl = max(dot(n, normalize(wd)), 0.0);
    base += uWarmColor * (0.30 + 0.70 * wNdl) * wAtt;

    float back = max(dot(-n, uMoon), 0.0);
    base += uRim * pow(back, 2.2) * 0.30 * uRimStr * uRimScale;

    float fres = pow(1.0 - clamp(dot(n, v), 0.0, 1.0), uRimPow);
    base += uRim * fres * uRimStr * uRimScale;

    vec3 hv = normalize(uMoon + v);
    float sp = pow(max(dot(n, hv), 0.0), 56.0);
    base += uSpec * smoothstep(0.38, 0.62, sp) * uSpecStr;

    if(uVein > 0.001){
      float vein = smoothstep(0.30, 0.52, abs(sin(vUv.x * 3.1415926 * 5.0)));
      base += uRim * vein * uVein * 0.16 * pow(clamp(vUv.y,0.0,1.0), 0.6);
    }

    base *= mix(uAO, 1.0, smoothstep(0.0, 1.0, vUv.y));
    base += uColor * uEmissive * uGlowScale * (0.88 + 0.12 * sin(uTime * 1.6 + vW.y * 1.4));
    gl_FragColor = vec4(base, uOpacity);
  }`;

function toonMat(o = {}) {
  const c = new THREE.Color(o.color !== undefined ? o.color : 0xffffff);
  const shade = o.shade !== undefined ? new THREE.Color(o.shade) : c.clone().multiplyScalar(0.30);
  const rim = new THREE.Color(o.rim !== undefined ? o.rim : 0xffffff);
  const spec = new THREE.Color(o.spec !== undefined ? o.spec : 0xffffff);
  const grad = new THREE.Color(o.grad !== undefined ? o.grad : o.color !== undefined ? o.color : 0xffffff);
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: c }, uShade: { value: shade }, uRim: { value: rim }, uSpec: { value: spec },
      uGradTop: { value: grad },
      uRimPow: { value: o.rimPow !== undefined ? o.rimPow : 2.4 },
      uRimStr: { value: o.rimStr !== undefined ? o.rimStr : 0.55 },
      uEmissive: { value: o.emissive !== undefined ? o.emissive : 0.0 },
      uOpacity: { value: o.opacity !== undefined ? o.opacity : 1.0 },
      uSpecStr: { value: o.specStr !== undefined ? o.specStr : 0.35 },
      uGradAmt: { value: o.gradAmt !== undefined ? o.gradAmt : 0.0 },
      uVein: { value: o.vein !== undefined ? o.vein : 0.0 },
      uAO: { value: o.ao !== undefined ? o.ao : 1.0 },
      uMoon: U.uMoon, uFill: U.uFill, uTime: U.uTime,
      uWarmPos: U.uWarmPos, uWarmColor: U.uWarmColor,
      uSkyLight: U.uSkyLight, uSunTint: U.uSunTint,
      uGlowScale: U.uGlowScale, uRimScale: U.uRimScale
    },
    vertexShader: TOON_VS,
    fragmentShader: TOON_FS,
    transparent: !!o.transparent,
    side: o.side || THREE.FrontSide,
    depthWrite: o.depthWrite !== undefined ? o.depthWrite : true
  });
}

/* --------------------------------------------------------------- 玻璃材质 */
const GLASS_FS = `
  precision highp float;
  uniform vec3 uColor, uRim, uMoon, uWarmPos, uWarmColor, uSkyCol;
  uniform float uOpacity, uSpec, uTime, uIrid;
  varying vec3 vN; varying vec3 vV; varying vec2 vUv; varying vec3 vW;
  void main(){
    vec3 n = normalize(vN);
    vec3 v = normalize(vV);
    float ndv = abs(dot(n, v));
    float f = pow(1.0 - ndv, 2.6);
    float a = uOpacity * (0.20 + 0.95 * f);
    vec3 col = uColor * (0.55 + 1.15 * f);
    vec3 hv = normalize(uMoon + v);
    float sp = pow(max(dot(n, hv), 0.0), 96.0);
    col += uRim * sp * 2.6 * uSpec;
    col += uColor * pow(ndv, 6.0) * 0.35;
    // 薄膜虹彩
    float ir = sin(vW.y * 6.0 + uTime * 0.4 + vW.x * 2.0) * 0.5 + 0.5;
    col += uColor * ir * uIrid * 0.30;
    col += uSkyCol * f * 0.75;
    gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
  }`;

function glassMat(o = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(o.color !== undefined ? o.color : 0xbfeaff) },
      uRim: { value: new THREE.Color(o.rim !== undefined ? o.rim : 0xffffff) },
      uOpacity: { value: o.opacity !== undefined ? o.opacity : 0.22 },
      uSpec: { value: o.spec !== undefined ? o.spec : 1.0 },
      uIrid: { value: o.irid !== undefined ? o.irid : 0.35 },
      uMoon: U.uMoon, uTime: U.uTime,
      uWarmPos: U.uWarmPos, uWarmColor: U.uWarmColor, uSkyCol: U.uSkyCol
    },
    vertexShader: TOON_VS,
    fragmentShader: GLASS_FS,
    transparent: true,
    side: o.side || THREE.DoubleSide,
    depthWrite: false,
    blending: o.blending !== undefined ? o.blending : THREE.NormalBlending
  });
}

/* 纯发光（加法混合）材质 */
function glowMat(color, opacity = 1) {
  return new THREE.MeshBasicMaterial({
    color: new THREE.Color(color),
    transparent: true, opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  });
}

/* --------------------------------------------------------------- 几何工具 */
function lathe(profile, seg = 40, phiStart = 0, phiLen = TAU) {
  return new THREE.LatheGeometry(profile.map(p => new THREE.Vector2(p[0], p[1])), seg, phiStart, phiLen);
}

function tubeOf(points, radius, mat, tubular = 64, radial = 8, closed = false) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => p.isVector3 ? p : new THREE.Vector3(p[0], p[1], p[2])));
  const geo = new THREE.TubeGeometry(curve, tubular, radius, radial, closed);
  return new THREE.Mesh(geo, mat);
}

/* 沿路径缠绕的螺旋铜管 */
function coilOf(pathPts, coilR, turns, tubeR, mat, seg = 260) {
  const curve = new THREE.CatmullRomCurve3(pathPts.map(p => new THREE.Vector3(p[0], p[1], p[2])));
  const pts = [];
  for (let i = 0; i <= seg; i++) {
    const t = i / seg;
    const p = curve.getPointAt(t);
    const tan = curve.getTangentAt(t).normalize();
    const up = Math.abs(tan.y) > 0.92 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
    const b1 = new THREE.Vector3().crossVectors(tan, up).normalize();
    const b2 = new THREE.Vector3().crossVectors(tan, b1).normalize();
    const a = t * TAU * turns;
    pts.push(p.clone().addScaledVector(b1, Math.cos(a) * coilR).addScaledVector(b2, Math.sin(a) * coilR));
  }
  return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), seg, tubeR, 6, false), mat);
}

function helixPts(r, y0, y1, turns, n = 160, phase = 0) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = phase + t * turns * TAU;
    pts.push(new THREE.Vector3(Math.cos(a) * r, y0 + (y1 - y0) * t, Math.sin(a) * r));
  }
  return pts;
}

/* 圆角矩形轮廓（返回 Vector3 闭合路径点） */
function roundedRectPoints(hw, hh, r, y, seg = 10) {
  const pts = [];
  const corners = [[hw - r, hh - r, 0], [-hw + r, hh - r, Math.PI / 2], [-hw + r, -hh + r, Math.PI], [hw - r, -hh + r, Math.PI * 1.5]];
  for (const [cx, cy, a0] of corners) {
    for (let i = 0; i <= seg; i++) {
      const a = a0 + (i / seg) * (Math.PI / 2);
      pts.push(new THREE.Vector3(cx + Math.cos(a) * r, y, cy + Math.sin(a) * r));
    }
  }
  return pts;
}

function roundedRectShape(hw, hh, r) {
  const s = new THREE.Shape();
  s.moveTo(-hw + r, -hh);
  s.lineTo(hw - r, -hh);
  s.quadraticCurveTo(hw, -hh, hw, -hh + r);
  s.lineTo(hw, hh - r);
  s.quadraticCurveTo(hw, hh, hw - r, hh);
  s.lineTo(-hw + r, hh);
  s.quadraticCurveTo(-hw, hh, -hw, hh - r);
  s.lineTo(-hw, -hh + r);
  s.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
  return s;
}

/* 花瓣：沿 +Z 生长，向上卷曲，uv.y = 0(根) → 1(尖) */
function petalGeometry(len, wid, cup = 0.55, rise = 0.14, segU = 22, segV = 12) {
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= segU; i++) {
    const u = i / segU;
    const w = wid * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.72)), 0.62) * (1 - 0.30 * u);
    for (let j = 0; j <= segV; j++) {
      const v = (j / segV) * 2 - 1;
      const x = v * w;
      const y = cup * w * (v * v) * 1.15 + rise * len * Math.pow(u, 1.9) + Math.sin(Math.PI * u) * 0.03 * len;
      const z = len * u;
      pos.push(x, y, z);
      uv.push((v + 1) / 2, u);
    }
  }
  for (let i = 0; i < segU; i++) {
    for (let j = 0; j < segV; j++) {
      const a = i * (segV + 1) + j;
      const b = a + 1;
      const c = a + segV + 1;
      const d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/* 轮廓线（背面外扩） */
const _outlineCache = {};
function outlineMaterial(color) {
  if (!_outlineCache[color]) _outlineCache[color] = new THREE.MeshBasicMaterial({ color, side: THREE.BackSide });
  return _outlineCache[color];
}
function addOutline(m, scale = 1.028, color = 0x081420) {
  const o = new THREE.Mesh(m.geometry, outlineMaterial(color));
  o.scale.setScalar(scale);
  o.renderOrder = -1;
  m.add(o);
  return m;
}

const glowSprites = [];
function glowSprite(color, size, opacity = 1, tex = texGlow) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({
    map: tex, color: new THREE.Color(color), transparent: true, opacity,
    blending: THREE.AdditiveBlending, depthWrite: false, depthTest: true
  }));
  s.scale.set(size, size, 1);
  s.userData.baseOpacity = opacity;
  glowSprites.push(s);
  return s;
}

function shadowDecal(size, opacity = 0.5) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshBasicMaterial({ map: texShadow, transparent: true, opacity, depthWrite: false, color: 0x000000 })
  );
  m.rotation.x = -Math.PI / 2;
  return m;
}

/* 柔和点粒子（自定义着色，支持逐点 alpha / size） */
function makePoints(count, { color = 0xffffff, size = 0.2, additive = true } = {}) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(count * 3), 3));
  geo.setAttribute('aAlpha', new THREE.Float32BufferAttribute(new Float32Array(count).fill(1), 1));
  geo.setAttribute('aSize', new THREE.Float32BufferAttribute(new Float32Array(count).fill(size), 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uTex: { value: texGlow }, uScale: { value: window.innerHeight * 0.5 / Math.tan(THREE.MathUtils.degToRad(18)) } },
    vertexShader: `
      attribute float aAlpha; attribute float aSize;
      varying float vA;
      uniform float uScale;
      void main(){
        vA = aAlpha;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * uScale / max(-mv.z, 0.1);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 uColor; uniform sampler2D uTex; varying float vA;
      void main(){
        vec4 t = texture2D(uTex, gl_PointCoord);
        gl_FragColor = vec4(uColor * t.rgb, t.a * vA);
      }`,
    transparent: true,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    depthWrite: false
  });
  const p = new THREE.Points(geo, mat);
  p.frustumCulled = false;
  return p;
}

/* ------------------------------------------------------------- 涟漪数据 */
const RIP_N = 8;
const rippleData = [];
for (let i = 0; i < RIP_N; i++) rippleData.push(new THREE.Vector4(0, 0, -999, 0));
let rippleIdx = 0;
function addRipple(x, z, strength = 1) {
  const r = rippleData[rippleIdx % RIP_N];
  r.set(x, z, U.uTime.value, strength);
  rippleIdx++;
}

/* --------------------------------------------------------------- 灯光（供标准材质） */
scene.add(new THREE.AmbientLight(0xa8cfe6, 2.4));
const moonLight = new THREE.DirectionalLight(0xfff4e2, 2.9);
moonLight.position.set(11, 17, 12);
scene.add(moonLight);
const warmLight = new THREE.PointLight(0xffb45e, 11, 14, 2);
warmLight.position.set(0, 3.4, 0);
scene.add(warmLight);
const waterLight = new THREE.PointLight(0x7fe6ff, 9, 20, 2);
waterLight.position.set(0, -1.2, 0);
scene.add(waterLight);

/* --------------------------------------------------------------- 尺寸适配 */
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
  renderer.setPixelRatio(dpr);
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();

  const W = Math.floor(w * dpr), H = Math.floor(h * dpr);
  rtScene.setSize(W, H);
  rtB1.setSize(Math.max(1, W >> 1), Math.max(1, H >> 1));
  rtB2.setSize(Math.max(1, W >> 1), Math.max(1, H >> 1));
  rtC1.setSize(Math.max(1, W >> 2), Math.max(1, H >> 2));
  rtC2.setSize(Math.max(1, W >> 2), Math.max(1, H >> 2));
}
window.addEventListener('resize', resize);
resize();
