import { build } from 'esbuild';
import fs from 'node:fs';

const res = await build({
  entryPoints: ['src/app.js'],
  bundle: true,
  format: 'esm',
  minify: true,
  target: ['es2020'],
  write: false,
  legalComments: 'none'
});

let code = res.outputFiles[0].text;
code = code.replace(/<\/script/gi, '<\\/script');

const tpl = fs.readFileSync('src/index.template.html', 'utf8');
const out = tpl.replace('/*__APP_BUNDLE__*/', () => code);
fs.writeFileSync('index.html', out);
console.log('built index.html', (out.length / 1024).toFixed(0) + ' KB');
