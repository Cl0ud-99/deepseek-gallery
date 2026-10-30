#!/bin/bash
# 把引擎、后期与场景模块拼成一个自包含的 HTML
set -e
cd "$(dirname "$0")"
OUT="carnival.html"

{
  cat src/_head.html
  cat lib/three.min.js
  echo ""
  echo "</script>"
  echo "<script>"
  cat lib/CopyShader.js
  echo ""
  cat lib/EffectComposer.js
  echo ""
  cat lib/MaskPass.js
  echo ""
  cat lib/ShaderPass.js
  echo ""
  cat lib/RenderPass.js
  echo ""
  cat lib/LuminosityHighPassShader.js
  echo ""
  cat lib/UnrealBloomPass.js
  echo ""
  cat lib/OrbitControls.js
  echo ""
  echo "</script>"
  echo "<script>"
  cat src/01_core.js
  echo ""
  cat src/02_world.js
  echo ""
  cat src/03_carousel.js
  echo ""
  cat src/04_booths.js
  echo ""
  cat src/05_props.js
  echo ""
  cat src/06_anim.js
  echo ""
  echo "</script>"
  echo "</body>"
  echo "</html>"
} > "$OUT"

echo "built: $OUT  $(wc -c < "$OUT") bytes"
