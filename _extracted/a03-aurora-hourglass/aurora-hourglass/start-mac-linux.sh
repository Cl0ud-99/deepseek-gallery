#!/usr/bin/env bash
cd "$(dirname "$0")" || exit 1
PORT=8080
echo "=========================================================="
echo "  Aurora Hourglass - local preview server"
echo "  Open: http://localhost:${PORT}/src/"
echo "  Press Ctrl+C to stop."
echo "=========================================================="
if command -v python3 >/dev/null 2>&1; then
  python3 -m http.server "$PORT" &
elif command -v python >/dev/null 2>&1; then
  python -m http.server "$PORT" &
else
  echo "[ERROR] Python not found. Just double-click index.html, or use any static server."
  exit 1
fi
sleep 1
(open "http://localhost:${PORT}/src/" 2>/dev/null || xdg-open "http://localhost:${PORT}/src/" 2>/dev/null || echo "Please open http://localhost:${PORT}/src/ manually")
wait
