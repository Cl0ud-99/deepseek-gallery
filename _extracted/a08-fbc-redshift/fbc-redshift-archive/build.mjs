import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
let esbuild;
try {
  esbuild = require('esbuild');
} catch {
  try {
    // development fallback used inside the DSH workspace this piece was born in
    esbuild = require('../dream-whale-atelier/node_modules/esbuild');
  } catch {
    console.error('esbuild is required to rebuild. Run: npm install');
    process.exit(1);
  }
}
const DEV = process.argv.includes('--dev');
const OUT_NAME = DEV ? 'FBC-Redshift-Archive.debug.html' : 'FBC-Redshift-Archive.html';

const order = ['00-core.js','01-base.js','02-hall.js','03-details.js','04-floating.js','04b-batch.js','05-life.js'];
let source = '';
for (const file of order) {
  source += '\n' + await readFile(join(here, 'src', file), 'utf8') + '\n';
}
const css = await readFile(join(here, 'src', 'style.css'), 'utf8');
const body = await readFile(join(here, 'src', 'body.html'), 'utf8');

const result = await esbuild.build({
  stdin: {
    contents: source,
    resolveDir: here,
    sourcefile: 'fbc-redshift-main.js',
    loader: 'js',
  },
  bundle: true,
  format: 'iife',
  target: ['chrome100', 'safari15.4', 'firefox100'],
  minify: !DEV,
  legalComments: 'none',
  write: false,
  logLevel: 'info',
  alias: { three: join(here, 'vendor', 'three', 'three.module.js') },
});
const js = result.outputFiles[0].text;

const html = [
  '<!DOCTYPE html>',
  '<html lang="zh-CN">',
  '<head>',
  '  <meta charset="utf-8" />',
  '  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />',
  '  <meta name="theme-color" content="#050505" />',
  '  <meta name="description" content="联邦控制局超自然档案大厅——一座在异界红光中失重的粗野主义微缩模型。" />',
  '  <title>联邦控制局 · 悬浮档案大厅</title>',
  '  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 64 64\'%3E%3Crect width=\'64\' height=\'64\' fill=\'%23070707\'/%3E%3Cpath d=\'M32 10 55 50H9z\' fill=\'none\' stroke=\'%23d22a2a\' stroke-width=\'3\'/%3E%3Ccircle cx=\'32\' cy=\'38\' r=\'8\' fill=\'%23798282\'/%3E%3C/svg%3E" />',
  '  <style>',
  css,
  '  </style>',
  '</head>',
  '<body>',
  body,
  '<script>',
  js,
  '<' + '/script>',
  '</body>',
  '</html>',
].join('\n');

await mkdir(join(here, 'dist'), { recursive: true });
await writeFile(join(here, 'dist', OUT_NAME), html);
console.log('built dist/' + OUT_NAME, (html.length / 1024 / 1024).toFixed(2) + ' MB', 'source', source.split('\n').length, 'lines', 'bundle', (js.length / 1024 / 1024).toFixed(2) + ' MB', DEV ? '(unminified)' : '');
