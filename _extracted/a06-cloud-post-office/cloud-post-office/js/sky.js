/* =========================================================
   sky.js — 破晓天穹 / 光照 / 环境反射
   ========================================================= */
(function () {
  const APP = window.APP;
  const U = APP.U;
  const SKY = (APP.Sky = {});

  SKY.sunDir = new THREE.Vector3(-0.80, 0.34, -0.30).normalize();

  const vert = `
    varying vec3 vDir;
    void main(){
      vDir = position;
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mv;
    }`;

  const frag = `
    varying vec3 vDir;
    uniform vec3 uSun;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    void main(){
      vec3 d = normalize(vDir);
      float h = d.y;

      vec3 deep   = vec3(0.030, 0.055, 0.130);
      vec3 upper  = vec3(0.100, 0.170, 0.330);
      vec3 mid    = vec3(0.265, 0.385, 0.550);
      vec3 warm   = vec3(0.620, 0.575, 0.560);
      vec3 glow   = vec3(1.000, 0.720, 0.440);

      vec3 col = mix(warm, mid, smoothstep(0.01, 0.20, h));
      col = mix(col, upper, smoothstep(0.18, 0.52, h));
      col = mix(col, deep, smoothstep(0.48, 1.00, h));

      // 地平线以下：云海之下的高空深空
      vec3 u1 = vec3(0.640, 0.520, 0.455);
      vec3 u2 = vec3(0.250, 0.275, 0.395);
      vec3 u3 = vec3(0.058, 0.072, 0.150);
      vec3 under = mix(u1, u2, smoothstep(-0.03, -0.25, h));
      under = mix(under, u3, smoothstep(-0.24, -0.56, h));
      col = mix(col, under, 1.0 - smoothstep(-0.055, 0.02, h));

      float s = max(dot(d, normalize(uSun)), 0.0);
      col += glow * pow(s, 6.0) * 0.22;
      col += vec3(1.0, 0.82, 0.58) * pow(s, 60.0) * 0.50;
      col += vec3(1.0, 0.90, 0.74) * pow(s, 420.0) * 1.6;
      col += vec3(1.0, 0.80, 0.55) * pow(s, 2400.0) * 5.0;

      // 地平线暖带
      col += vec3(1.0, 0.54, 0.28) * exp(-abs(h + 0.02) * 15.0) * 0.13;

      // 抖动，防色带
      float n = hash(gl_FragCoord.xy) - 0.5;
      col += n * 0.006;

      gl_FragColor = vec4(col, 1.0);
    }`;

  SKY.makeDome = function () {
    const mat = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      uniforms: { uSun: { value: SKY.sunDir.clone() } },
      side: THREE.BackSide,
      depthWrite: false,
      fog: false
    });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(320, 48, 32), mat);
    dome.renderOrder = -10;
    return dome;
  };

  SKY.build = function (scene, renderer) {
    /* ---- 天穹 ---- */
    const dome = SKY.makeDome();
    scene.add(dome);
    SKY.dome = dome;

    /* ---- 环境反射（给黄铜用） ---- */
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    const envScene = new THREE.Scene();
    const envDome = SKY.makeDome();
    envDome.material = envDome.material.clone();
    envDome.material.side = THREE.BackSide;
    envScene.add(envDome);
    // 环境里加两个柔光板，让金属有高光条
    const addPanel = (x, y, z, c, s) => {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(s, s * 0.55),
        new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide }));
      p.position.set(x, y, z);
      p.lookAt(0, 0, 0);
      envScene.add(p);
    };
    addPanel(-40, 26, 44, 0xffe2b8, 46);
    addPanel(44, 8, -30, 0x9fc2e8, 34);
    const envRT = pmrem.fromScene(envScene, 0.02);
    scene.environment = envRT.texture;
    pmrem.dispose();

    /* ---- 雾 ---- */
    scene.fog = new THREE.FogExp2(0x8e9aac, 0.0034);

    /* ---- 灯光 ---- */
    const hemi = new THREE.HemisphereLight(0x9ec4f5, 0x6b6252, 0.40);
    scene.add(hemi);

    const key = new THREE.DirectionalLight(0xffd2a0, 3.0);
    key.position.set(-50, 21, -19);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -26;
    key.shadow.camera.right = 26;
    key.shadow.camera.top = 30;
    key.shadow.camera.bottom = -22;
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 130;
    key.shadow.bias = -0.0008;
    key.shadow.normalBias = 0.035;
    key.shadow.radius = 2;
    key.target.position.set(0, 10, 0);
    scene.add(key);
    scene.add(key.target);
    SKY.key = key;

    const fill = new THREE.DirectionalLight(0xffd0a2, 0.58);
    fill.position.set(38, 22, 48);
    scene.add(fill);

    // 云海反光：从下方打上来的暖金散射
    const bounce = new THREE.DirectionalLight(0xffb877, 0.34);
    bounce.position.set(4, -40, 26);
    scene.add(bounce);

    const rim = new THREE.DirectionalLight(0xffc48a, 1.45);
    rim.position.set(28, 6, -44);
    scene.add(rim);

    /* ---- 远景云带（薄雾） ---- */
    const soft = U.tex(U.softTex(), 1, 1);
    const bands = new THREE.Group();
    for (let i = 0; i < 9; i++) {
      const m = new THREE.SpriteMaterial({
        map: soft,
        color: i % 3 === 0 ? 0xffdcb4 : 0xc6d6ea,
        transparent: true,
        opacity: U.rr(0.07, 0.15),
        depthWrite: false,
        fog: false
      });
      const s = new THREE.Sprite(m);
      const a = U.rr(0, Math.PI * 2), r = U.rr(170, 320);
      s.position.set(Math.cos(a) * r, 32.2 - 0.366 * r + U.rr(-26, 12), Math.sin(a) * r);
      const sc = U.rr(110, 220);
      s.scale.set(sc, sc * U.rr(0.12, 0.22), 1);
      s.material.rotation = U.rr(-0.15, 0.15);
      bands.add(s);
    }
    scene.add(bands);
    SKY.bands = bands;

    // 逆光太阳
    const sun = U.glow(0xffd9a0, 150, 0.55);
    sun.position.copy(SKY.sunDir).multiplyScalar(210);
    sun.material.depthTest = false;
    scene.add(sun);
    // 主体背后的柔光晕，把箱庭从背景里托起来
    const halo = U.glow(0xffd0a0, 150, 0.085);
    halo.position.set(3, 13, -48);
    scene.add(halo);

    const sunCore = U.glow(0xfff2d8, 46, 0.9);
    sunCore.position.copy(SKY.sunDir).multiplyScalar(205);
    sunCore.material.depthTest = false;
    scene.add(sunCore);
  };
})();
