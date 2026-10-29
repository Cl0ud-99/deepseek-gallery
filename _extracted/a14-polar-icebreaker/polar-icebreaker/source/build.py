# -*- coding: utf-8 -*-
"""
把 source/polar-icebreaker-cdn.html（依赖 CDN 的精简版）打包成
上一级目录的 polar-icebreaker.html（内联 three.js、完全离线、双击即开）。

用法：在本文件所在目录执行  python build.py
改完场景代码后跑一次即可，不用联网。
"""
import os, re, io

HERE = os.path.dirname(os.path.abspath(__file__))
SRC_HTML = os.path.join(HERE, 'polar-icebreaker-cdn.html')
THREE = os.path.join(HERE, 'vendor', 'three.module.js')
ORBIT = os.path.join(HERE, 'vendor', 'OrbitControls.js')
OUT = os.path.join(os.path.dirname(HERE), 'polar-icebreaker.html')

html = io.open(SRC_HTML, encoding='utf-8').read()
three = io.open(THREE, encoding='utf-8').read()
orbit = io.open(ORBIT, encoding='utf-8').read()

# ---- 1. three.module.js：去掉结尾的 export 块，改成 THREE 命名空间对象 ----
idx = three.rfind('\nexport {')
assert idx > 0, 'three.module.js 里找不到 export 块'
three_body = three[:idx]
block = three[idx:]
names = block[block.index('{') + 1: block.rindex('}')]
entries = []
for item in [s.strip() for s in names.split(',') if s.strip()]:
    if ' as ' in item:
        src, alias = [s.strip() for s in item.split(' as ')]
        entries.append('%s: %s' % (alias, src))
    else:
        entries.append(item)
ns = 'const THREE = {\n' + ',\n'.join(entries) + '\n};\n'

# ---- 2. OrbitControls：去掉 import/export，包进 IIFE 避免与 three 顶层重名 ----
orbit = re.sub(r"^import\s*\{[^}]*\}\s*from\s*'three';", '', orbit, count=1, flags=re.S)
assert "from 'three'" not in orbit, 'OrbitControls 的 import 没清干净'
orbit = orbit.replace('export { OrbitControls };', 'return OrbitControls;')
orbit_wrapped = ('/* ---- OrbitControls (three.js examples, MIT) ---- */\n'
                 'const OrbitControls = (() => {\n' + orbit + '\n})();\n')

# ---- 3. 取出场景代码，去掉两条 import ----
m = re.search(r'<script type="module">\n(.*?)\n</script>\s*</body>', html, re.S)
assert m, '找不到场景脚本'
app = re.sub(r"^import \* as THREE from 'three';\s*$", '', m.group(1), flags=re.M)
app = re.sub(r"^import \{ OrbitControls \} from 'three/addons/controls/OrbitControls\.js';\s*$",
             '', app, flags=re.M)

head = re.sub(r'<script type="importmap">.*?</script>\s*', '', html[:m.start()], flags=re.S)

bundle = (
    head
    + '<script type="module">\n'
    + '/* ===== three.js r169 内联版（MIT License, (c) three.js authors）===== */\n'
    + three_body + '\n\n' + ns + '\n'
    + orbit_wrapped + '\n'
    + '/* ===== 场景代码 ===== */\n'
    + '(function () {\n' + app + '\n})();\n'
    + '\n</script>\n</body>\n</html>\n'
)
io.open(OUT, 'w', encoding='utf-8', newline='\n').write(bundle)
print('ok ->', OUT, os.path.getsize(OUT), 'bytes')
