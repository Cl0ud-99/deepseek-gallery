import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const res = await esbuild.build({
  entryPoints: [path.join(root, 'src/main.js')],
  bundle: true,
  format: 'iife',
  minify: true,
  target: ['chrome100'],
  write: false,
  legalComments: 'none',
  plugins: [{
    name: 'three-alias',
    setup(build) {
      build.onResolve({ filter: /^three$/ }, () => ({ path: path.join(root, 'vendor/three.module.js') }));
      build.onResolve({ filter: /^three\/addons\// }, (args) => ({
        path: path.join(root, 'vendor/addons/', args.path.replace('three/addons/', '')),
      }));
    },
  }],
});

const code = res.outputFiles[0].text;
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
html = html.replace(/<script type="importmap">[\s\S]*?<\/script>\s*/, '');
html = html.replace(
  /<script type="module" src="\.\/src\/main\.js"><\/script>/,
  () => `<script>\n${code}\n</script>`
);
html = html.replace('<title>GRAND HOTEL — Alpine Diorama</title>', '<title>GRAND HOTEL · 阿尔卑斯缆车旅馆微缩模型</title>');
fs.writeFileSync(path.join(root, 'grand-hotel-diorama.html'), html);
console.log('bundle size', (code.length / 1024).toFixed(0), 'KB; html', (html.length / 1024 / 1024).toFixed(2), 'MB');
