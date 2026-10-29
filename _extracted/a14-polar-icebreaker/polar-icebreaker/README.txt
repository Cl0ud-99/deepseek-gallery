极地科考破冰船 · 三维微缩景观
================================

一个可以自由拖拽 / 旋转 / 缩放观看的微缩三维模型，纯网页实现，没有任何 UI 元素。


一、目录里有什么
----------------
polar-icebreaker.html          ← 双击这个就能看。three.js 已内联，完全离线，不联网也能跑
source/
  polar-icebreaker-cdn.html    ← 源码版（约 58 KB），依赖 CDN，方便改代码
  build.py                     ← 把源码版重新打包成上面的离线单文件
  vendor/
    three.module.js            ← three.js r169
    OrbitControls.js           ← 轨道控制器


二、怎么打开
------------
直接双击 polar-icebreaker.html 即可，Chrome / Edge / Firefox 都行。
不需要装 Python、不需要开服务器、不需要联网。

如果浏览器提示"已阻止本地文件"，右键该文件 → 打开方式 → 选浏览器即可；
或者把整个文件夹拖进浏览器窗口。


三、怎么改
----------
推荐改 source/polar-icebreaker-cdn.html（体积小，编辑器不卡）。
它只有 1800 多行，结构大致是：

  0. 基础环境        场景 / 相机 / 渲染器 / 轨道控制
  1. 材质与工具函数   toon() 卡通材质、outline() 描边、box/cyl/sph 等
  2. 底座            方形双层截面：上层冰盖（带裂口）+ 下层玻璃水箱
  3. 浮冰 / 冰山      程序化生成的碎冰块与蓝冰冰山
  4. 船体             程序化放样生成的船壳，三段色带
  5. 上层建筑         三层玻璃幕舱室 + 内部家具（餐厅 / 实验室 / 舰桥）
  6. 外部装备         直升机、吊臂、帐篷、雪地摩托、钻机、雷达罩……
  7. 水下             独角鲸、磷虾群、冰川根部
  8. 动效             浮冰起伏、旋翼转动、雷达旋转、雪花、白气、水面
  9. 主循环           animate()

改完源码版之后，在本文件夹执行：

    python build.py

它会把源码重新内联成上一级的 polar-icebreaker.html（覆盖旧的）。
只需要 Python 3，不需要装任何第三方库。

如果不想装 Python，也可以直接改离线版：场景代码在文件最末尾，
搜 "场景代码" 就能定位到（前面那一大坨是 three.js 本体，不用管）。


四、几个可能用得上的调参点
--------------------------
- 相机初始位置：搜 camera.position.set
- 视角远近限制：搜 controls.minDistance / maxDistance
- 自动旋转：搜 controls.autoRotateSpeed（转速）、idleTimer = setTimeout（无操作多久开始自转）
- 画面整体明暗：搜 keyLight / HemisphereLight
- 船体配色：搜 hullRed（调色板对象 C 在 150 行附近）
- 雪花数量：搜 const count = 1700


五、依赖与许可
--------------
three.js r169，MIT License，版权归 three.js authors 所有。
离线版里保留了完整的许可声明，可以自由修改和分发。
场景本身（几何、材质、动画）全部是代码程序化生成，没有外部图片或模型文件。
