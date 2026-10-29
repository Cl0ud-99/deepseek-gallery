# 灯塔 · THE LIGHTHOUSE

可交互的《灯塔》微缩剖面三维场景：方形礁石基座 + 泥土剖面酒箱 + 半剖铸铁塔身 + 螺旋楼梯 + 菲涅尔水晶透镜室，实时运行于浏览器，无任何 UI 元素，拖拽旋转 / 滚轮缩放。

纯 Three.js 程序化生成（几何、贴图、着色器全部代码构建，无外部模型与图片资源）。

---

## 一、怎么打开

| 目的 | 做法 |
| --- | --- |
| **只看成品** | 双击 `lighthouse.html`（单文件、已内联全部代码，离线可看，不需要服务器） |
| **改代码实时预览** | 终端执行 `node server.mjs`，浏览器打开 <http://localhost:5173/dev.html>，改完存盘刷新即可（改 `src/` 不需要重新打包） |
| **重新生成单文件** | `npm install` → `npm run build`（或 `node build.mjs`），会覆盖 `lighthouse.html` |

> `dev.html` 走 ES Module，必须通过 http 访问（`file://` 会被浏览器 CORS 拦截）；`lighthouse.html` 是内联打包版，可以直接 `file://` 打开。

依赖：`three@0.160.1`、`esbuild@0.20.2`。`vendor/three` 里已放好调试用的 three 源码，**不联网也能跑 dev 预览**；只有“重新打包成单文件”这一步需要 `npm install`。

---

## 二、文件结构

```
lighthouse.html     成品（单文件，约 590KB）
dev.html            调试入口（importmap + src/main.js）
server.mjs          零依赖静态服务器（默认 5173 端口）
build.mjs           esbuild 打包脚本 → 内联生成 lighthouse.html
preview.png         效果预览图
src/
  main.js           渲染器、相机、灯光、后处理管线、动画主循环
  world.js          材质库、方形基座与酒箱剖面、塔身/回廊/螺旋楼梯
  lens.js           灯室玻璃笼、菲涅尔透镜、黄铜齿轮、光束、绳索
  env.js            天空、海面、雨、海鸥、闪电、浪花
  lib.js            程序化贴图（泥土/岩石/灰泥砖/木纹/标签/雨痕/脚印）与几何工具
vendor/three/       调试用 three 源码（勿改）
```

---

## 三、调参索引

### 1. 构图与相机 — `src/main.js`
```js
camera.position.set(26.0, 20.2, 5.6);   // 初始机位（方位角 ~80°，正对塔身剖面左侧）
controls.target.set(0, 5.4, 0);         // 视线中心
controls.minDistance / maxDistance      // 13 / 48
controls.autoRotateSpeed = 0.55;        // 静置 6 秒后自动环绕的速度
camera.fov = aspect < 1.0 ? ... : 40;   // 竖屏自动放宽视角
renderer.setPixelRatio(min(dpr, 1.75))  // 画质/性能首要开关
```

### 2. 黑白胶片与描边 — `src/main.js` 的 `FilmShader` / `FinalShader`
```glsl
uEdge = 1.3                            // 描边浓度
smoothstep(0.021, 0.078, e)            // 描边触发阈值（越小线越多）
l = 1.0 - exp(-l * 1.95);              // 曝光
clamp((l - 0.018) / 0.94, 0, 1)        // 黑场 / 白场（想更硬就抬黑场）
l += g * 0.09 * ...                    // 颗粒强度
smoothstep(0.88, 0.26, length(q...))   // 暗角范围
l += uFlash * 0.16;                    // 闪电整体提亮
```
Bloom：`new UnrealBloomPass(res, 0.62 /*强度*/, 0.62 /*半径*/, 0.80 /*阈值*/)`
—— 透镜/光束想更炸：降阈值 + 提强度；想让描边更干净：抬阈值。

### 3. 建筑体量 — `src/world.js` 顶部 `DIM`
```js
baseHalf 5.4      // 基座半宽（整体 10.8m）
notch 1.95        // 剖面缺角起点
soilBottom -2.05  // 泥土层底（剖面坑深度）
wallBottom 1.44 / wallTop 9.2 / rBottom 2.12 / rTop 1.40   // 塔身
glassBottom 9.68 / glassTop 11.98 / lensY 10.72            // 灯室
```
剖面开口角度：`A0 = 95°`、`A1 = 355°`（留 100° 缺口）；竖向玻璃窗缝在 `gaps` 数组里改。
楼梯：`steps = 62`、`turns = 3.15`、`y0/y1 = 1.74/8.86`、半径 `rWall(t) = 1.77 - 0.72t`。
酒箱：`rows` / `stack` 数组直接控制箱子的位置、层数与旋转。

### 4. 灯室与光束 — `src/lens.js`
```js
lens.rotation.y = time * 0.115;        // 透镜自转速度（约 55 秒一圈）
beamMaterial(opacity)                  // 光束透明度 + 颜色倍率 2.4（在片元里）
[[0,27,3.6,0.5], ...]                  // [朝向, 长度, 末端半径, 不透明度]
lensLight = PointLight(0xfff1d2, 20, 5.2, 2)   // 灯室点光：强度/距离/衰减
```
光束形状由 `makeBeamCone(len, rad, seg)` 生成；`uOpacity` 越大越实，配合 bloom 阈值调。

### 5. 海面 / 雨 / 闪电 — `src/env.js`
```js
height(vec2 p, float t)                // 波高叠加（正弦 + fbm），改振幅即改浪高
crest / surf / foam                    // 泡沫阈值与覆盖量
float e = 0.14;                        // 法线差分步长（越小越碎）
RAIN = 5200                            // 雨丝数量
gulls 9 只 / radius 3.2~7.8            // 海鸥
nextStrike = time + 2.8 + rnd()*5.5    // 闪电间隔
boltLight.intensity = f * 7.5          // 闪电照亮强度
```

### 6. 贴图 — `src/lib.js`
`soilTexture()` 泥土层理、`rockTexture()` 礁石、`towerTexture()` 白灰泥+裸露砖、`woodTexture()` 木纹、`labelTexture()` 酒箱标签、`rainGlassTexture()` 玻璃雨痕、`floorDecalTexture()` 脚印羽毛。
全部是 Canvas 2D 程序化绘制，改颜色/密度直接改函数体即可。

---

## 四、几个坑（改的时候注意）

1. **`InstancedMesh` 的 `count` 不能超过构造时传的数量**，否则 WebGL 校验报错会导致整屏黑掉（本项目的礁石就踩过）。
2. 后处理是自定义管线：场景先渲染到带 `DepthTexture` 的 RT，再由 `SceneFilmPass` 采样深度做描边。**不要**把这张 RT 同时挂到 `EffectComposer` 的两个缓冲上，会触发 framebuffer/texture 反馈环。
3. 描边依赖深度，`depthWrite: false` 的物体（天空、玻璃、雨、光束）不会产生轮廓线，属正常。
4. 玻璃/光束都设了 `renderOrder` 与 `depthWrite:false`，调整渲染顺序时注意别让光束被玻璃裁掉。
5. 阴影相机范围在 `main.js` 的 `key.shadow.camera` / `moonLight.shadow.camera`，改动模型尺寸后记得同步，否则阴影会被裁切。

---

## 五、性能参考

- 三角面主要来自海面（200×200 网格）与雨丝（5200 段线），其余为实例化几何；
- 桌面独显/核显可稳定 60fps；若掉帧，优先降 `renderer.setPixelRatio` 上限、海面网格分段、雨丝数量。
- 阴影贴图 2048×2048 × 2 盏方向光，是第二大开销，可只保留 `key` 的阴影。
