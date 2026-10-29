# Changelog

## 0.0.3 — 2026-10-30

### Measured cost, on the site

The probe results from 0.0.1 were sitting in a JSON file. They are now part of the index:

- every card shows its measured **draw calls per frame** — amber above 2,500, yellow above 1,800
- a new sort group in the toolbar: **默认顺序 / 开销 ↓ / 开销 ↑**
- the detail modal adds an **实测开销** row: calls per frame plus triangle count, with the
  measurement conditions stated
- the header stat block gains **7,047 — 最高 draw call / 帧**

These are the same 1280×800 SwiftShader measurements described in the README's performance
section, so the site and the repo now agree.

### Fixed: duplicated filter chips

The original `buildChips()` appended into `#fTheme` and `#fEdit` without clearing them first, so
every click on a filter chip rendered a *second* full row of chips on top of the existing one —
after two clicks the toolbar showed three copies of every chip. `buildChips()` now clears all three
containers before rebuilding.

## 0.0.2 — 2026-10-30

### English names for all 19 projects

Previously the naming was inconsistent — nine entries used an English title with a Chinese subtitle
(A01 `Twin Peaks · Black Lodge` / 黑色旅舍), nine used the reverse (A03 `极光星海 · 倒置沙漏天文台` /
`Aurora Hourglass`). All nineteen are now `English name（中文名）`, and the English name matches the
directory slug so the archive, the zips and the repo all line up.

| # | was | now |
|---|---|---|
| A01 | Twin Peaks · Black Lodge | Black Lodge |
| A02 | ASHTRAY MAZE / A-07 | Ashtray Maze |
| A03 | 极光星海 · 倒置沙漏天文台 | Aurora Hourglass |
| A04 | 秋日农场 | Autumn Farm |
| A05 | Cliff Lighthouse Café | Cliff Lighthouse Café (unchanged) |
| A06 | 云端蒸汽飞艇邮政局 | Cloud Post Office |
| A07 | FBC QUARRY 07 | FBC Quarry 07 |
| A08 | FBC / RED SHIFT ARCHIVE | Redshift Archive |
| A09 | GRAND HOTEL | Grand Hotel |
| A10 | THE LIGHTHOUSE | The Lighthouse |
| A11 | 月球前哨站 | Lunar Outpost |
| A12 | 莫纳奇 · 时间断裂实验舱 | Stutter Lab |
| A13 | 森のコンビニ | Mori Mart |
| A14 | 极地科考破冰船 | Polar Icebreaker |
| A15 | 綺羅弄 · 旗袍與留聲 | Qipao Diorama |
| A16 | Route 66 · Desert Diner | Route 66 Diner |
| A17 | Glastonbury Grove · The Red Room | The Red Room |
| A18 | 晚霞织梦染坊 | Sunset Dream Loom |
| A19 | 怪物语 · 双世界镜像场景 | Hawkins / Upside Down |

Applied to `index.html` (card titles), `catalog.md` (总表), `profiles.md` (headings) and `README.md`.

### Online preview

- **Site** — every card now carries a `在线预览 ↗` link, and the detail modal has an
  **在线预览** block with *▶ 在页面内运行*: the live scene loads in an iframe on demand rather than
  on page load, so nineteen WebGL contexts never run at once. Closing the modal unmounts the iframe
  and stops its render loop.
- **Homepage** — `README.md` rewritten in English and rebuilt as a visual gallery: all 19 entries
  are linked thumbnails, each with its draw-call / three.js / size line underneath.
- **Thumbnails** — `previews/thumbs/Axx.jpg`, 720×450, 0.8 MB for all 19, generated from the
  full-size renders.

### Verified

- All 19 live URLs return 200 on GitHub Pages.
- Card → modal → iframe → close round-trip tested in headless Chrome: 19 links, no JS errors,
  iframe unloaded on close.

## 0.0.1 — 2026-10-30

First snapshot of the archive.

- 19 procedural Three.js dioramas, original zips plus unpacked working copies
- Three layers of documentation: `README.md`, `catalog.md` (Chinese), `profiles.md` (Chinese)
- `index.html` visual index — thumbnails, theme/editable/keyword filters, detail modals
- `previews/` — 19 screenshots, 1440×900, rendered from the running scenes
- `_tools/shot.mjs` — preview renderer (pre-existing)
- `_tools/probe.mjs` — **new**: instruments the WebGL context and measures draw calls per frame for
  every entry without needing a debug handle. Results in `_tools/probe-result.json`.

Findings from that first measurement, which corrected the archive's own conclusions:

- A09 Grand Hotel issues ~7,047 draw calls per frame — the highest in the collection, and the entry
  whose documentation said "no performance data".
- A11 Lunar Outpost measures 889 — one of the cheapest — despite being recommended first for
  optimisation on the strength of its (excellent) notes.
- A09 does three full scene traversals per frame: normal prepass + shadow pass + colour pass.
