/* 打包：把 three.js 与全部源码内联为单文件 HTML */
const fs = require('fs');
const path = require('path');

const root = __dirname;
const files = ['vendor/three.min.js', 'src/core.js', 'src/world.js', 'src/interior.js', 'src/fx.js', 'src/main.js'];

let body = '';
for (const f of files) {
  const code = fs.readFileSync(path.join(root, f), 'utf8');
  body += '\n<script>\n' + code + '\n</script>\n';
}

const tpl = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const head = tpl.slice(0, tpl.indexOf('<script'));
const out = head + body + '</body>\n</html>\n';

fs.writeFileSync(path.join(root, 'hawkins-mirror.html'), out, 'utf8');
console.log('built', (out.length / 1024).toFixed(0) + 'KB');
