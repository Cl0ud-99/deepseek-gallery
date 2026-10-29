# 莫纳奇 · 时间断裂（Stutter）实验舱 —— 微缩沙盘场景

单文件 Three.js 场景，可自由拖拽 / 旋转 / 滚轮缩放，无任何 UI 覆盖层。

---

## 一、怎么打开

**方式 A（最简单）**：双击 `monach_stutter_lab.html`，用 Chrome / Edge 打开。
需要联网——three.js 从 jsDelivr CDN 加载。

**方式 B（离线）**：把文件里的 importmap 换成随包附带的 `lib/`：

```html
<script type="importmap">
{
  "imports": {
    "three": "./lib/three.module.js",
    "three/addons/": "./lib/addons/"
  }
}
</script>
```

然后**必须用本地服务器打开**（浏览器不允许 `file://` 加载本地 ES 模块）：

```bash
# 在本目录执行任一：
python -m http.server 8080
npx serve .
```
浏览器访问 `http://127.0.0.1:8080/monach_stutter_lab.html`。

---

## 二、文件结构

```
monach_stutter_lab.html   ← 全部场景代码（约 1780 行，单文件）
lib/                      ← three r160 及所需插件（离线备用，CDN 模式可忽略）
  three.module.js
  addons/controls/OrbitControls.js
  addons/postprocessing/{EffectComposer,RenderPass,UnrealBloomPass,ShaderPass,OutputPass,Pass,MaskPass}.js
  addons/environments/RoomEnvironment.js
  addons/shaders/{CopyShader,LuminosityHighPassShader,OutputShader}.js
```

代码分区（行号对应当前版本）：

| 区块 | 行 | 内容 |
|---|---|---|
| 0 基础环境 | 30–150 | renderer / camera / OrbitControls / 灯光 |
| 1 程序化贴图 | 150–405 | canvas 生成的网格、电路板、全息界面、档案纸、刻字 |
| 2 材质库 | 409–485 | `MAT.*` 全部材质 |
| 3 底座 | 487 | 白瓷台面 + 三层网格剖面 + 刻字 |
| 4 外壳 | 689 | 地面 / 三面玻璃幕墙 / 天花梁 / 警示灯 |
| 5 中央舱体 | 830 | 基座→机械环→玻璃筒→机械冠→量子核心→脉冲环 |
| 6 陈设 | 1135+ | 工作站 / 机柜 / 防尘服架 / 实验桌 / 推车 / 龙门架 |
| 7 定格粒子 | 1377 | 2400 水珠（GPU 漂移）+ 250 碎玻璃 + 74 档案纸 |
| 9 后期 | 1630 | Bloom + OutputPass + 自定义调色 |
| 10 动效 | 1678 | `animate()` 全部动画 |

---

## 三、想改什么，改哪里

| 想调整 | 位置 | 当前值 |
|---|---|---|
| 整体亮度 | 第 43 行 `toneMappingExposure` | `0.9` |
| 泛光强度 / 半径 / 阈值 | 第 1639 行 `UnrealBloomPass` | `0.16, 0.3, 2.5` |
| 初始机位 | 第 51 行 `camera.position` | `15.2, 10.8, 19.6` |
| 自动旋转速度 | 第 63 行 `autoRotateSpeed` | `0.2`（约 5 分钟一圈） |
| 水珠数量 | 第 1379 行 | `2400` |
| 碎玻璃数量 | 第 1450 行 | `250` |
| 档案纸数量 | 第 1471 行 | `74` |
| 主光强度/角度 | `keyLight`（第 ~95 行） | `2.05`，位置 `25,13,11` |
| 警示灯呼吸频率 | `animate()` 中 `Math.sin(t * 1.15)` | `1.15` |
| 核心脉冲频率 | `animate()` 中 `Math.sin(t * 1.9)` | `1.9` |
| 白瓷观感 | `MAT.white` / `MAT.whiteGloss` | roughness `0.2` / `0.16`，clearcoat `0.55` / `0.35` |
| 玻璃观感 | `MAT.glass` / `MAT.glassChamber` | opacity `0.06` / `0.24`，specularIntensity `0.28` / `0.3` |

---

## 四、优化时的两个坑（已经踩过）

1. **Bloom 阈值工作在线性 HDR 空间**。
   `EffectComposer` 渲染到 RenderTarget 时**不应用 tone mapping**，所以阈值比较的是线性亮度。白瓷被主光照亮后线性值可超过 1.0，阈值调低（<1.5）会把白墙一起泛光，舱顶糊成一团白斑。当前 `2.5` 是权衡后的值，自发光靠 `emissiveIntensity 4~10` 自己够亮。

2. **镜面高光峰值**。
   `MeshPhysicalMaterial` 的 `clearcoat: 1` + 低 `roughness` 在弧形白件（舱盖、玻璃筒）上会打出极高镜面峰值，同样会触发泛光白斑。所以白瓷件的 `clearcoat` 压到 `0.35~0.55`、`clearcoatRoughness` 提到 `0.2` 左右。

## 五、性能参考

- 绘制调用约 500–600 次（粒子均为 InstancedMesh，各占 1 次）。
- 阴影贴图 2048，仅主光投影。
- 桌面独显 60fps 无压力；核显建议把 `bloom` 关掉（`composer.addPass(bloom)` 注释掉）或把粒子数量减半。

---

场景里所有文字（MONACH 铭牌、全息界面、档案纸内容）都是 canvas 现画的，没有外部图片资源，改文案直接改对应的 `canvasTex` 绘制函数即可。
