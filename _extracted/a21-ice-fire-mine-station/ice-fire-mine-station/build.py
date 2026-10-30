import os, glob, io

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, 'src')

files = sorted(glob.glob(os.path.join(SRC, '*.js')))
parts = []
for f in files:
    with open(f, encoding='utf-8') as fh:
        parts.append('/* ==== %s ==== */\n' % os.path.basename(f) + fh.read())
js = '\n'.join(parts)

html = '''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<title>冰火交融 · 矿山街角驿站</title>
<link rel="icon" href="data:,">
<style>
  html, body { margin:0; padding:0; height:100%; overflow:hidden; background:#04060c; }
  body { opacity:0; transition:opacity 1.4s ease; }
  body.ready { opacity:1; }
  #c { display:block; width:100vw; height:100vh; outline:none; touch-action:none; cursor:grab; filter:saturate(1.12) contrast(1.03); }
  #c:active { cursor:grabbing; }
  #vig { position:fixed; inset:0; pointer-events:none;
         background: radial-gradient(ellipse 62% 62% at 50% 46%, rgba(0,0,0,0) 38%, rgba(2,4,10,0.55) 100%); }
</style>
</head>
<body>
<canvas id="c"></canvas>
<div id="vig"></div>
<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"
  }
}
</script>
<script type="module">
__JS__
</script>
</body>
</html>
'''.replace('__JS__', js)

out = os.path.join(ROOT, 'index.html')
with open(out, 'w', encoding='utf-8') as fh:
    fh.write(html)
print('built', out, len(html), 'bytes,', len(files), 'files')
