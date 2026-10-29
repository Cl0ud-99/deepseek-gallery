import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';

const result = await build({
  entryPoints: ['src/main.js'],
  bundle: true,
  format: 'iife',
  outfile: 'app.js',
  minify: true,
  sourcemap: false,
  target: ['chrome100', 'safari15.4', 'firefox100'],
  legalComments: 'none',
  logLevel: 'info',
});
console.log('app.js built');

// optional single-file edition
const inline = process.argv.includes('--single');
if (inline) {
  const js = await readFile('app.js', 'utf8');
  const css = await readFile('style.css', 'utf8');
  let html = await readFile('index.html', 'utf8');
  html = html.replace('<link rel="stylesheet" href="./style.css" />', () => `<style>\n${css}\n</style>`);
  html = html.replace('<script src="./app.js"></script>', () => `<script>\n${js}\n</script>`);
  await mkdir('dist', { recursive: true });
  await writeFile('dist/晚霞织梦染坊.html', html);
  await writeFile('dist/dream-weaver-atelier.html', html);
  console.log('single-file edition written to dist/晚霞织梦染坊.html');
}