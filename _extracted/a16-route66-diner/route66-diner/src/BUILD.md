# Route 66 Diner · 复古加油站 · 源码说明

这里是可以直接阅读和修改的完整源码，未做任何压缩。

## 目录结构

- `index.html` — 源码入口。importmap 把 `three` 与 `three/addons/` 指向本地 `./lib/`。
- `scene.js`   — 场景全部逻辑（几何构建、材质、着色器、动画、相机与交互）。
- `lib/`       — `three.module.js`（r160）以及所需的 addons。

## 本地预览

浏览器在 `file://` 协议下禁止加载本地 ES module（会因 CORS 白屏），
所以源码版需要一个静态服务器：

```bash
cd src
python -m http.server 8000
```

然后浏览器打开 http://localhost:8000/

## 修改后重新打包成单文件（可选）

需要 esbuild：

```bash
cd src
esbuild scene.js --bundle --format=iife --minify \
  --legal-comments=inline \
  --alias:three=./lib/three.module.js \
  --outfile=bundle.js
```

再把 `bundle.js` 内联进一个自包含 HTML 即可（参考包根目录的 `index.html`）。

> 注意：addons 内部使用的是裸导入 `import ... from 'three'`，
> 因此必须带 `--alias:three=./lib/three.module.js`，
> 否则 esbuild 会报 `Failed to resolve "three"`。
