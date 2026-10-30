# 月光琉璃花灵香水工坊 · 微缩三维景观（白天版）

纯前端 Three.js 实时三维场景，无任何 UI 元素，鼠标拖拽旋转、滚轮/双指缩放。

当前为**白天主题**：蓝天渐变 + 暖阳光晕 + fbm 云层，日光主光 + 天光补光 + 水面接触投影。
（夜景版在 `月光琉璃花灵香水工坊.zip` 里，两版可对照。）

## 怎么跑

**方式一（最简单）**：解压后直接双击 `index.html`，用 Chrome / Edge 打开即可，不需要服务器、不需要联网。

**方式二（推荐做开发时用）**：在本目录起一个静态服务器，避免个别浏览器对 file:// 的限制。

```bash
python -m http.server 8080     # 或 npx serve .
```

然后访问 http://127.0.0.1:8080

## 目录结构

```
index.html          入口，按顺序加载下面 5 个脚本
js/core.js          渲染器 / 轨道相机 / 自研泛光后期 / 天空 / 三渲二着色器 / 程序化贴图
js/world.js         双层荧光水池、翡翠苔藓底座、鹅卵石花瓣滩、水下水晶簇与长尾金鱼
js/lotus.js         水晶莲花、玻璃花萼工坊、螺旋蒸馏器、琉璃香水瓶阵列、二层露台陈设
js/garden.js        蝶翼风车、铃兰铜管、王莲步道、蒲公英灯、藤蔓彩窗拱桥、天鹅船、紫藤花瀑
js/life.js          彩蝶金色尾迹、露珠涟漪、花露气泡、蒲公英绒毛、金鱼游动、花瓣呼吸、主循环
vendor/three.min.js three.js r160（本地，离线可用）
preview.png         白天版效果图
```

## 白天光照参数速查

全部集中在 `js/core.js` 的 `U` 对象与后期 `compositeMat`：

| 参数 | 作用 | 当前值 |
|---|---|---|
| `U.uMoon` / `SUN_DIR` | 太阳方向（同时驱动天空太阳与物体受光） | `(0.44, 0.68, 0.50)` |
| `U.uSkyLight` | 天光环境项，决定暗部亮度 | `0xcfe4f0 × 0.22` |
| `U.uSunTint` | 受光面染色 | `0xfffdf6` |
| `U.uSkyCol` | 玻璃/水面反射的天空色 | `0xbfe4f8` |
| `U.uGlowScale` | 全局自发光强度（夜景曾为 1.0） | `0.42` |
| `U.uRimScale` | 全局边缘光强度 | `0.52` |
| `U.uWarmColor` | 工坊内部琥珀暖光 | `0xffa050 × 0.78` |
| `compositeMat.uExposure` | 曝光 | `0.88` |
| `compositeMat.uBloom` | 泛光强度 | `0.20` |
| `brightMat.uThr` | 泛光阈值（白天必须抬高） | `1.45` |

天空穹顶在 `core.js` 的 `buildSky()`：`uTop / uMid / uHor` 三色阶 + fbm 云层，改颜色即可换天气。

## 想改哪里

| 想改的东西 | 位置 |
|---|---|
| 相机初始角度 / 远近 / 自动环绕速度 | `js/core.js` 里 `ctrl` 对象、`updateCamera()` |
| 水面颜色、焦散强度、涟漪 | `js/world.js` 的 `WATER_FS`、`waterMat.uniforms`、`causMat` |
| 花瓣层数、长度、张角、颜色 | `js/lotus.js` 里 `rings` 数组与 `petalMat / petalMatInner` |
| 工坊外壳轮廓（花萼曲线） | `js/lotus.js` 里 `SHELL` 数组，格式 `[半径, 高度]` |
| 各景观摆位 | `js/garden.js` 各 `build*` 函数开头的坐标 |
| 水面接地投影 | `js/garden.js` 末尾 `groundShadows()` 的坐标表 |

## 调试小技巧

URL 加参数可固定机位，方便截图对比：

```
index.html?static=1&r=31&phi=0.9&th=0.34&tx=0&ty=1.85&tz=0
```

- `static=1` 关闭自动环绕
- `r` 距离，`phi` 俯仰（0.3 顶视 → 1.44 平视），`th` 水平角度
- `tx / ty / tz` 观察目标点

## 性能

场景约 700 个绘制对象，含 4x MSAA 的 HDR 后期管线。桌面独显轻松 60fps；集显建议把 `js/core.js` 里 `renderer.setPixelRatio` 的上限从 `1.75` 调到 `1.25`，或把 `rtScene` 的 `samples` 从 `4` 改为 `2`。
