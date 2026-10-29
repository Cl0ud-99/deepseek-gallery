import * as esbuild from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const watch = process.argv.includes('--watch');
mkdirSync('dist', { recursive: true });

// after every successful bundle, inline the JS into a single self-contained HTML
const inlineHtml = {
  name: 'inline-html',
  setup(build) {
    build.onEnd((res) => {
      if (res.errors.length) return;
      const js = readFileSync('dist/app.js', 'utf8');
      const html = readFileSync('index.html', 'utf8');
      const out = html.replace('<script src="dist/app.js"></script>', `<script>\n${js}\n</script>`);
      writeFileSync('TwinPeaks-BlackLodge.html', out);
      console.log(`built TwinPeaks-BlackLodge.html  (${(out.length / 1024).toFixed(0)} KB)`);
    });
  },
};

const options = {
  entryPoints: ['src/main.js'],
  bundle: true,
  outfile: 'dist/app.js',
  format: 'iife',
  target: 'es2020',
  minify: false,
  legalComments: 'none',
  logLevel: 'info',
  plugins: [inlineHtml],
};

if (watch) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
  console.log('watching src/ — 保存文件即自动重新打包');
} else {
  await esbuild.build(options);
}
