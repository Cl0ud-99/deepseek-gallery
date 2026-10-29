#!/usr/bin/env python3
"""Create a fully self-contained, offline single-file build of ASHTRAY MAZE."""
from pathlib import Path
import re, sys

ROOT = Path(__file__).resolve().parent.parent
INDEX = ROOT / "index.html"
OUT = ROOT / "standalone" / "ashtray-maze.html"

html = INDEX.read_text(encoding="utf-8")
script_tags = re.findall(r'<script src="([^"]+)"></script>', html)
if not script_tags:
    sys.exit("no external scripts found")

for rel in script_tags:
    src = ROOT / rel
    code = src.read_text(encoding="utf-8")
    # A literal </script> inside an inline script would terminate the HTML script.
    code = code.replace("</script", "<\\/script")
    tag = f'<script src="{rel}"></script>'
    html = html.replace(tag, "<script>\n" + code + "\n</script>")

html = html.replace("</head>", "<!-- Single-file build: all code, fonts, and textures are inline. -->\n</head>", 1)
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(html, encoding="utf-8")

leftovers = re.findall(r'<script[^>]+src=', html)
print(f"wrote {OUT} ({OUT.stat().st_size / 1024:.0f} KiB)")
print("external script references:", len(leftovers))
