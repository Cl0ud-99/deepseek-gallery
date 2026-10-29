/**
 * 把 src/main.js 打包并内联进根目录 index.html，生成离线单文件版。
 * 用法：npm install && npm run build
 */
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const dir = path.dirname(fileURLToPath(import.meta.url));
const res = await build({
  entryPoints: [path.join(dir, 'src/main.js')],
  bundle: true,
  format: 'iife',
  minify: true,
  target: 'es2019',
  legalComments: 'none',
  write: false
});
const js = res.outputFiles[0].text.replace(/<\/script>/gi, '<\\/script>');
const devHtml = fs.readFileSync(path.join(dir, 'src/index.html'), 'utf8');
const head = devHtml.slice(0, devHtml.indexOf('<script type="importmap">'));
const out = head + '<script>' + js + '</script>\n</body>\n</html>\n';
fs.writeFileSync(path.join(dir, 'index.html'), out);
console.log('built index.html  (' + (out.length / 1024).toFixed(0) + ' KB)');
