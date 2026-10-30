Route 66 Diner · 复古加油站
=================================
本包含两部分：可直接运行的成品 + 完整可读源码。

【成品 · 双击即用】
  index.html
    完全自包含单文件版（Three.js 与场景代码已全部内联、压缩）。
    无需联网、无需安装、无需本地服务器，直接双击用 Chrome / Edge 打开即可。

【源码 · 可读可改】
  src/
    index.html   源码入口（importmap 指向本地 ./lib/）
    scene.js     场景全部逻辑：几何、材质、着色器、动画、交互（未压缩）
    lib/         three.module.js (r160) + 所需 addons
    BUILD.md     本地预览 / 修改后重新打包说明

操作：
  左键拖拽 = 旋转视角
  右键拖拽 = 平移
  滚轮     = 缩放

可选参数（加在地址栏 URL 后）：
  ?nopost=1              关闭后处理
  ?cam=x,y,z,tx,ty,tz    指定初始机位

许可：Three.js (MIT) 已随包内联保留版权注释。
