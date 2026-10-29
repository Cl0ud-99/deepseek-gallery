import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const scripts = [
  'vendor/three.min.js', 'src/core.js', 'src/textures.js', 'src/base.js',
  'src/pyramid.js', 'src/interior.js', 'src/industry.js', 'src/effects.js', 'src/main.js'
];
let js = '';
for (const s of scripts) js += '\n/* ---- ' + s + ' ---- */\n' + fs.readFileSync(path.join(ROOT, s), 'utf8');
js = js.replace(/<\/script/gi, '<\\/script');
const inlined = index.replace(/(?:[ \t]*<script src="[^"]+"><\/script>\s*)+/, () =>
  '<script>\n' + js + '\n</script>\n'
);
if (/<script src=/.test(inlined)) throw new Error('bundle still contains external scripts');
fs.mkdirSync(path.join(ROOT, 'standalone'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'standalone', 'fbc-quarry-07.html'), inlined);
console.log('standalone:', (inlined.length / 1024 / 1024).toFixed(2), 'MB');
