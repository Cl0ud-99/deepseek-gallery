# 秋日农场微缩场景 · 源码说明

`index.html` 是**单文件**，双击即可在浏览器打开（需联网，Three.js r169 从 unpkg CDN 加载）。
`preview.png` 是当前效果的参考截图。

---

## 文件结构（行号为大致位置）

| 行 | 区块 | 内容 |
|---|---|---|
| 26 | 0. 渲染器 / 相机 / 控制器 | WebGLRenderer、PerspectiveCamera(30°)、OrbitControls、背景渐变、灯光、PMREM 环境反射 |
| 103 | 1. 通用工具 | `tex()` canvas 纹理工厂、卡通渐变 `gradientMap`、描边 `ol()`、`box/rbox/cyl/sph`、`ribbon()` 带状面 |
| 240 | 2. 纹理 | 木纹 / 干草 / 草地 / 泥土 / 瓦片 / 水面 / 石头 / 烟雾 / 标签 / 叶片 |
| 427 | 3. 材质库 | `M.*` 全部材质，改配色基本只动这里 |
| 506 | 4. 底座 / 地形 / 溪流 | 28×28 方台、木底座、溪流、卵石、土路、草地散布、野花 |
| 667 | 5. 谷仓 | 墙体/屋顶/大门/窗/塔楼风向标/室内（梯子、阁楼、农具墙、工作台…） |
| 1038 | 6. 玻璃工坊 | 玻璃幕墙与屋顶、铜锅、果酱罐货架、长桌南瓜派、老秤、烟囱 |
| 1260 | 7. 农场道具 | 水车、皮卡、干草垛、栅栏、菜畦、稻草人、压水井、牛奶桶、信箱、蜂箱、南瓜田、码头小船、木箱、独轮车、落叶、果树 |
| 1983 | 8. 动效系统 | 落叶、`PuffSystem`（炊烟/蒸汽）、水花、蜜蜂 |
| 2170 | 9. 相机 / 循环 | `fitCamera()` 构图拟合、resize、`animate()` 主循环 |

---

## 常用调节点

**整体观感**
- `M` 对象（427 行）：所有颜色。注意材质是 `color × map` 相乘，改色要一起看贴图底色。
- 灯光：`hemi` / `amb` / `sun` / `fill`（约 55–80 行）。太阳角度改 `sun.position`。
- `camera = new PerspectiveCamera(30, ...)`：视角越小越"长焦"，微缩感越强。
- `camDir0`（约 2185 行）：默认机位方向，y 分量控制俯角。

**构图**
- `fitPts` 数组：决定画面要装下哪些点。加高了建筑/树，记得同步改这里。
- `fitCamera()` 里 `dist = need * 1.0 + 0.05`：系数小于 1 会裁边，大于 1 会留白。

**布局**
- `HALF`（底座半宽）、`STREAM_W`（溪宽）、`streamPts`（溪流中心线）、`roadPts`（土路）。
- `BARN` / `WS` 两个常量是建筑的位置与尺寸，改完记得同步 `fitPts` 和 `blocked()`（草地散布的避让区）。

**动效**
- 水车转速：`animate()` 里 `__wheel.rotation.x -= dt * 0.62`。
- 落叶数量/尺寸：`leaves` 的 `N` 与 `PlaneGeometry(0.24, 0.32)`。
- 炊烟/蒸汽：`smokeChimney` / `steamPot` / `steamPie` 的 `rise / drift / size / life / opacity`。
- 水花：`splashes` 的 `reset()` 里改喷发位置和速度。

---

## 踩过的坑（改之前先看一眼）

1. **不要用 ExtrudeGeometry 挖洞做溪流**。洞一旦越出外轮廓，earcut 三角化直接失败，整块底板变实心。现在是"湿泥岸带 + 水面带"叠在草皮上，水车下半部靠水面平面遮住来伪装入水。
2. **`ribbon()` 的索引顺序**必须是 `(a,b,c, b,d,c)`，否则法线朝下，地面/水面全黑。
3. **Phong 材质手动挂 envMap 会整体发黑**（MULTIPLY 混合 + PMREM 采样问题）。环境反射只给玻璃用，金属保持普通 Phong。
4. **`shadow.camera` 改完必须 `updateProjectionMatrix()`**，否则还是默认 ±5 的视锥。
5. 描边是背面外扩（`olMat` 里的 `transformed += normalize(normal) * oT`），厚度按物体尺寸分档，别给细小物件用大厚度。

---

## 性能

当前约 1670 draw call / 8 万三角面。想再优化：
- `scene.traverse` 里那段"小物件自动关投影"的阈值（0.42）可以调大。
- 静态道具（干草、栅栏、菜畦、稻草）可以用 `BufferGeometryUtils.mergeGeometries` 合并，能砍掉一半以上调用。
- 落叶/野花/草簇已经是 `InstancedMesh`，不要再拆成独立 mesh。

## 调试方式

用 puppeteer-core + 本机 Chrome 截图迭代（比手点快）：

```
chrome --headless=new --disable-gpu --enable-unsafe-swiftshader --use-angle=swiftshader
```

无头实例务必带独立 `--user-data-dir`，否则会抢你正在用的浏览器配置。
