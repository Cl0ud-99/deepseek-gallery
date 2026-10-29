import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve(process.cwd());
const PORT = Number(process.env.PORT || 5401);
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json', '.png':'image/png', '.jpg':'image/jpeg', '.webp':'image/webp' };
const handler = (req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (req.method === 'POST') {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      const body = Buffer.concat(chunks);
      try {
        if (p === '/upload') {
          const name = (new URL(req.url, 'http://x').searchParams.get('name') || 'shot').replace(/[^a-z0-9_-]/gi,'');
          const text = body.toString();
          let data = body;
          if (text.startsWith('data:image/')) data = Buffer.from(text.split(',')[1], 'base64');
          const out = path.join(ROOT, 'shots', name + '.png');
          fs.mkdirSync(path.dirname(out), { recursive: true });
          fs.writeFileSync(out, data);
          console.log('WROTE', out, data.length);
          res.writeHead(200, {'Content-Type':'text/plain'}); res.end('ok');
          return;
        }
        if (p === '/report') {
          fs.mkdirSync(path.join(ROOT,'shots'), {recursive:true});
          fs.writeFileSync(path.join(ROOT,'shots','report.txt'), body);
          console.log('REPORT', body.toString().slice(0, 4000));
          res.writeHead(200, {'Content-Type':'text/plain'}); res.end('ok');
          return;
        }
        res.writeHead(404); res.end('no');
      } catch(e) { console.error(e); res.writeHead(500); res.end(String(e)); }
    });
    return;
  }
  if (p === '/') p = '/index.html';
  if (p.endsWith('/')) p += 'index.html';
  const fp = path.join(ROOT, path.normalize(p).replace(/^([/\\\\])+/, ''));
  if (!fp.startsWith(ROOT)) { res.writeHead(403); res.end('no'); return; }
  fs.readFile(fp, (err, data) => {
    if (err) { res.writeHead(404); res.end('404 ' + p); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(fp).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  });
};
http.createServer(handler).listen(PORT, '127.0.0.1', () => console.log('http://127.0.0.1:' + PORT));
