import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const scripts = [
  'vendor/three.min.js',
  'src/core.js',
  'src/textures.js',
  'src/ground.js',
  'src/building.js',
  'src/interiors.js',
  'src/street.js',
  'src/effects.js',
  'src/optimize.js',
  'src/main.js'
];
let js = '';
for (const s of scripts) {
  js += '\n/* ---- ' + s + ' ---- */\n' + fs.readFileSync(path.join(ROOT, s), 'utf8');
}
js = js.replace(/<\/script/gi, '<\\/script');
// strip the external script tags; they all collapse into one inline block
const inlined = index.replace(/(?:[ \t]*<script src="[^"]+"><\/script>\s*)+/, () =>
  '<script>\n' + js + '\n</script>\n'
);
if (/<script src=/.test(inlined)) throw new Error('bundle still contains external scripts');
fs.mkdirSync(path.join(ROOT, 'standalone'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'standalone', 'qipao-diorama.html'), inlined);
console.log('standalone:', (inlined.length / 1024 / 1024).toFixed(2), 'MB');
