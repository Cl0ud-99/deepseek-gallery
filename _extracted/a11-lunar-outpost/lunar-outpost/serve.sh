#!/usr/bin/env bash
cd "$(dirname "$0")" || exit 1
PORT=8080
URL="http://localhost:$PORT/index-offline.html"
echo ""
echo "  月球前哨站 · 本地预览"
echo "  $URL"
echo "  (Ctrl+C 停止)"
echo ""
if command -v python3 >/dev/null 2>&1; then
  ( sleep 1; command -v open >/dev/null 2>&1 && open "$URL"; command -v xdg-open >/dev/null 2>&1 && xdg-open "$URL" ) &
  python3 -m http.server "$PORT"
elif command -v python >/dev/null 2>&1; then
  ( sleep 1; command -v open >/dev/null 2>&1 && open "$URL"; command -v xdg-open >/dev/null 2>&1 && xdg-open "$URL" ) &
  python -m http.server "$PORT"
else
  echo "  未找到 python，改用 npx serve"
  npx --yes serve -l "$PORT" .
fi
