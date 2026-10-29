import { build } from 'esbuild';
import fs from 'node:fs';

const result = await build({
  entryPoints: ['src/main.js'],
  bundle: true,
  format: 'iife',
  minify: true,
  write: false,
  target: 'es2020',
  legalComments: 'none',
});

const js = result.outputFiles[0].text;

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<title>灯塔 · THE LIGHTHOUSE</title>
<style>
  html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #000; }
  body { cursor: grab; -webkit-user-select: none; user-select: none; }
  body:active { cursor: grabbing; }
  canvas { display: block; width: 100%; height: 100%; }
</style>
</head>
<body>
<script>
${js}
</script>
</body>
</html>
`;

fs.writeFileSync('lighthouse.html', html);
console.log('built lighthouse.html', (html.length / 1024).toFixed(0) + 'kb');
