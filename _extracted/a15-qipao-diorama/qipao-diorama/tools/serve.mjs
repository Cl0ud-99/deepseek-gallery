import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT || 5290);
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json', '.png':'image/png', '.jpg':'image/jpeg', '.webp':'image/webp' };
const handler = (req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const fp = path.join(ROOT, path.normalize(p).replace(/^([/\\])+/, ''));
  if (!fp.startsWith(ROOT)) { res.writeHead(403); res.end('no'); return; }
  fs.readFile(fp, (err, data) => {
    if (err) { res.writeHead(404); res.end('404 ' + p); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(fp).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  });
};
http.createServer(handler).listen(PORT, '127.0.0.1', () => console.log('http://127.0.0.1:' + PORT));
