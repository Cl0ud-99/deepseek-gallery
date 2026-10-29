# 联邦控制局 · 悬浮档案大厅
## FBC / RED SHIFT ARCHIVE

**一件可以自由环视、缩放欣赏的收藏级微缩景观。** 整个场景由 Three.js 代码程序化生成，没有 Blender，没有导入模型，没有外部贴图，没有任何界面按钮或悬浮 UI。

### 直接打开（推荐）

直接用现代浏览器打开：

`dist/FBC-Redshift-Archive.html`

单文件、完全离线，无需联网或本地服务器。这是压缩后的发布版。

如果要在另一台电脑上改代码、看控制台、实验优化，可以打开未压缩的调试版：

`dist/FBC-Redshift-Archive.debug.html`

调试版和发布版场景完全一致，只是 JS 保留可读格式。

### 操作

- **拖拽**：环绕微缩模型旋转视角
- **滚轮 / 双指捏合**：缩放
- 模型会以极慢速度自动巡游；触碰后由你接管，静止一段时间后会继续缓慢漂移
- 页面内无任何按钮、HUD 或说明层
- 迷失视角时刷新页面即可回到初始位

### 另一台电脑继续开发

要求：Node.js 18+。

```bash
cd fbc-redshift-archive
npm install
npm run build        # 生成 dist/FBC-Redshift-Archive.html 发布版
npm run build:dev    # 生成 dist/FBC-Redshift-Archive.debug.html 未压缩调试版
npm run serve        # http://127.0.0.1:4174
```

`npm install` 只安装构建工具 esbuild；Three.js 已内置在 `vendor/three`，运行页面本身不需要任何 npm 依赖。

### 源码结构

| 文件 | 内容 |
| --- | --- |
| `src/00-core.js` | renderer、相机、雾、程序化贴图、材质、灯光、指针控制 |
| `src/01-base.js` | 完整正方形台面、错层撕裂基座、非欧几里得伤口、地面喷漆 |
| `src/02-hall.js` | 粗野主义档案大厅、门廊、层板、悬挑平台、楼梯、屋顶与背面 |
| `src/03-details.js` | 海报、档案柜、打孔磁带机、CRT 电视墙、应急照明 |
| `src/04-floating.js` | 悬浮黑色巨石、漂流办公桌、纸张、尘埃、碎屑 |
| `src/04b-batch.js` | 静态几何/轮廓线合批优化 |
| `src/05-life.js` | HDR Bloom 后处理、ACES 调色、呼吸灯、动画循环 |
| `build.mjs` | esbuild 单文件构建器 |
| `serve.mjs` | 本地静态服务器 |

### 场景

- 完整正方形、冰冷无缝的清水混凝土台面
- 台面下悬空的错层几何底座；前缘裂开，内部是用红色异界能量勾勒的非欧几里得伤口与倒悬楼梯
- 纵向交错的联邦控制局超自然档案大厅：苏维埃粗野主义门廊、悬挑楼板、档案库、外挂楼梯、屋顶雷达与机械
- 大厅中央违反重力的巨型黑色粗野主义悬浮巨石
- 三十余套 1970 年代办公桌椅、打字机与台灯原地失重浮游
- 两千余张档案纸页如静止雪幕般散布空中
- 墙角 70 年代 CRT 电视墙：绿色雪花噪点、扫描线与去同步的人脸剪影
- 低频呼吸的红色应急泛光灯、三脚应急探照灯、混凝土碎屑向上剥落、尘埃微粒微颤
- 背面同样完整：卸货口、封死的长窗、局徽浮雕、管线、后场应急照明与落货区

### 技术

- Three.js r186，离线打包
- 程序化 Canvas 贴图：混凝土、木纹、纸张、海报、标识、地面喷漆
- 手写 CRT shader、体积感光晕、断裂几何、室内外完整建筑
- 纸张、碎屑、档案夹与尘埃使用 instancing
- 载入时按材质和阴影状态批量合并静态几何与轮廓线
- 自建 HDR 后处理：MSAA 场景缓冲 → 阈值 → 双向高斯 Bloom → ACES 胶片调色、颗粒、暗角与色散
- 零外部网络请求

### 性能参考

- 1600×1000、NVIDIA RTX 2070 SUPER、无头 Chrome：约 54–68 FPS
- 快速调参入口：
  - DPR / 移动端画质：`src/00-core.js` 顶部
  - 灯光与相机初始参数：`src/00-core.js`
  - 纸张、办公桌、碎屑数量：`src/04-floating.js`
  - Bloom 阈值、曝光、调色：`src/05-life.js`
  - 静态合批：`src/04b-batch.js`

### 画面

- `shots/hero.png`
- `shots/detail-boulder.png`
- `shots/detail-crt.png`
- `shots/rear.png`
- `shots/mobile.png`
