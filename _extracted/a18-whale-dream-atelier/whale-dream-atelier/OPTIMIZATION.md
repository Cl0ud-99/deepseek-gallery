# 优化交接 · 晚霞织梦染坊

这份说明写给在另一台机器上继续做性能 / 视觉优化的自己。

## 一句话现状

场景完全用 Three.js + 自定义 GLSL 程序化生成。当前视觉重点已经到位，**主要性能瓶颈是大量小 Mesh 带来的 CPU draw call**，而不是三角形数量或贴图带宽。

当前已做的性能相关设置（在 `src/main.js`）：

- `renderer.shadowMap.enabled = false`：不跑实时 shadow map；使用柔和 contact shadow 与自定义光照。
- `PIXEL_RATIO_CAP = 1.5`：限制高 DPI 下的像素数。
- `EffectComposer` 使用 2x MSAA + UnrealBloom（`samples: 2`）。
- 动态对象使用 `InstancedMesh`：云海 puffs、树的风铃、地板、气泡等已部分实例化。
- 单文件版本关闭了 legalComments，并对 esbuild 产物做了 minify。

在开发机上用 `window.__dream` 观测到的近似规模（1440×900）：

- `scene.traverse` 约 **2000+ Mesh**。
- 开启实时阴影时，一帧的 render calls 约 **3600**（主 pass + shadow pass）。
- 关闭实时阴影后，主 pass 仍然是约 **2000 次 draw call** 量级。
- 大量小件集中在：建筑墙体/窗框装饰、室内小陈设、空水母（每只约 25 个 Mesh）、染缸小木条、许愿树装饰、花箱。

> 数字会随功能增减变化，目的是给出优化重点。不要被三角形数分散注意力。

## 调试入口

页面加载后可在控制台使用：

`js
window.__dream
// { THREE, scene, camera, renderer, controls, composer, bloomPass,
//   sky, base, whale, atelier, jellies, wishingTree, dockAndBoat,
//   vats, flora, bubbles, lights, home, look }
`

常用操作：

`js
// 隐藏一组对象以定位开销
__dream.jellies.group.visible = false;

// 修改曝光 / bloom
__dream.renderer.toneMappingExposure = 0.9;
__dream.bloomPass.strength = 0.2;

// 修改相机
__dream.camera.position.set(17.4, 8.15, 28.1);
__dream.controls.target.set(0, 2.72, 0.12);
__dream.controls.update();

// 粗略读取最后一次 composer 渲染的统计
// （info 可能被最后一个 pass 重置，建议在 animate() 里手动记录）
__dream.renderer.info.autoReset = false;
__dream.renderer.info.reset();
__dream.composer.render();
console.log(__dream.renderer.info.render);
__dream.renderer.info.autoReset = true;
`

更可靠的做法是在 `animate()` 的 `composer.render()` 前后手动记录 `renderer.info`，或用 Chrome Performance / Spector.js 抓帧。

## 最值得优先做的优化

### 1. 静态合批（最高收益）

当前建筑、室内家具、墙体窗框等多是独立 Mesh。建议：

- 按 **material.uuid + castShadow/receiveShadow + 透明与否** 分组，收集静态 Mesh 到统一坐标系，使用 `BufferGeometryUtils.mergeGeometries` 合并。
- 排除动画对象（纺车梭子、音乐盒旋转星、羽毛灯、水母/触手、气泡、丝巾、鲸鳍/尾鳍等）。
- 让静态组仍挂在原来的父 Group 下（例如 `atelier.group`），这样鲸鱼整体轻浮动仍会带着它一起动。
- 透明的 ShaderMaterial（丝绸、气泡、水母等）不要合并，以免破坏排序。
- 轮廓线（inverted hull）也可以按颜色合批，或改成后期描边。

这一步理论上可以把 2000 次 draw call 压到数百次，是第一优先级。

### 2. 低收益但简单的小件削减

- 空水母每只的 frill 与 tentacle 可以合并/实例化；frill 数量由 9 降到 5，视觉差异很小。
- 染缸桶身的 14 条 staves 可换成一个带法线/纹理的圆柱桶身；小蒸汽 Sprite 数量可减少。
- 花箱里的叶片/花头、藤篮的棉球可以改为 InstancedMesh。
- 书架上的彩色线团/布卷可改为实例化小体块。
- 室内若镜头较远，可减少极小的书本、针脚、绒毛等点缀。

### 3. 云 / 几何

- 云海 puff 目前集中在一个 InstancedMesh，数量较多但只有 1 次 draw call。它的三角形量主要来自 `makeCloudClusterGeometry` 的 6 个 Ico detail-2 组成，可以：
  - 改为 detail 1 的 lobe；
  - 减少 lobes 数量；
  - 按距离降低实例数 / 使用 LOD。
- 云海材质目前略微透明（soft edge），有 overdraw；如果移动端吃紧，可以把材质的边缘透明度调低，让更多 GPU 走不透明早深度测试。

### 4. 后期 / 分辨率

- `PIXEL_RATIO_CAP` 在 `src/main.js`，可从 1.5 降到 1.0（笔记本 / 移动端尤其明显）。
- `setupComposer()` 内 `samples: 2` 可尝试 0（关 MSAA）或 4（更高画质）。
- `UnrealBloomPass` 的构造分辨率目前是窗口尺寸；可以传入半分辨率，画面几乎不差但省很多。
- 如果 35mm 镜头 / 场景占用不需要那么精细，也可以接受 CSS 轻微柔化。

### 5. 渲染质量档位

可以做一个内部的 quality preset（不显示为 UI）：

`js
const QUALITY = {
  high:   { dpr: 1.5,  samples: 2, bloom: true,  jellyfrill: 9 },
  medium: { dpr: 1.25, samples: 0, bloom: false, jellyfrill: 5 },
  low:    { dpr: 1.0,  samples: 0, bloom: false, jellyfrill: 4 },
};
`

按设备 `navigator.hardwareConcurrency`、`navigator.deviceMemory` 或首帧耗时选择。不要引入可见控件即可。

## 视觉上不要改坏的东西

- 相机 `HOME / LOOK` 在 `src/main.js` 顶部：
  - `HOME = (17.4, 8.15, 28.1)`
  - `LOOK = (0, 2.72, 0.12)`
  - 这个角度能完整看到正方形底座，又能看到鲸鱼的眼睛与前面的泡池。
- 鲸鱼左眼/微笑依赖不透明五官覆盖在透明鲸身之上；如果调整 `whale.js` 的透明/排序，请检查眼睛是否还显示。
- 丝绸是透明的自定义 ShaderMaterial，遮挡关系靠 renderOrder；合批或更改透明度可能破坏它。
- 水母/气泡/水波都有动态 uniform；不要冻结时间或直接替换材质而不拷贝 uniforms。

## 文件入口

- `src/main.js`：相机、后期、动画循环、性能总开关。
- `src/cloudbase.js`：云海规模、puff 数量、云层材质。
- `src/whale.js`：鲸鱼、鳍尾、脸、喷泉。
- `src/atelier.js`：建筑、塔、门窗、丝巾架。
- `src/interior.js`：室内小件。
- `src/silk.js`、`src/jellyfish.js`、`src/tree.js`、`src/boardwalk.js`、`src/vats.js`：对应外部元素。
- `build.mjs`：esbuild 打包与单文件内联。
- `dist/dream-weaver-atelier.html`：可直接打开的单文件交付物。

## Windows 离线包

如果压缩包名带 `win64-offline`，里面的 `node_modules` 已包含 Windows x64 的 esbuild 二进制，可直接：

`bash
node build.mjs --single
`

跨平台重新安装依赖：

`bash
rm -rf node_modules package-lock.json
npm install
node build.mjs --single
`

## 建议的验收顺序

1. 打开单文件，确认没有错误。
2. 在 1440×900 / 1600×1000 和移动端竖屏各看一次。
3. 用 Spector 抓一帧，记录 draw calls 最高的 Group。
4. 先做静态合批，再做水母/染缸小件；每次修改后检查透明排序和鲸鱼眼睛。
5. 最后才动 DPR / MSAA / Bloom，因为这些会直接改变观感。
