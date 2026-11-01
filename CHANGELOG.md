# Changelog

## 0.2.0 — 2026-11-02

Nine new dioramas, and the gallery grows from 23 to 32 works.

**New works** — Jiangnan Garden, Las Vegas — Sunset Boulevard, Tulou Reunion Night,
Corner Cat Café, Arrival, Orbital Station, Wandering Earth — Planetary Engine,
Lakeside Shrine — Gaius, Independence Day — Area 51. They are inserted between the
existing entries rather than appended.

**Gallery**

- Portrait framing for all nine new scenes (camera fit per aspect ratio).
- Outline thickness normalised: screen-space cap of ~1.2 px on mobile; the heavier
  scenes (tulou, orbital, wandering, colossus, area 51) were reduced, lighter ones untouched.
- New loading states: flat Apple-style ring spinner on the boot screen, the card-to-scene
  transition and the scene loader.
- Prewarm: the current card's scene is built in a hidden viewer after 1.1 s idle, so opening
  it hands over instantly.
- Buttons now scale up slightly on press (1.15 on hover devices, 1.06 on touch).
- Every scene page title is now English.

**Builds**

- Single-file sizes normalised to 629–831 KB; the tulou build now uses the minified
  three.js runtime (fixed the export-map rewrite in build.sh min).

## test 0.1.7 — 2026-10-31

Mobile gallery pass: vertical card spacing and snap timing, full-screen viewer,
grid FLIP both ways, press feedback, 23 new card previews, and the complete A07
ambience wired into the gallery host.

## 0.0.7 — 2026-10-30

### A05 and A16 are no longer locked — full source recovered

Both entries had shipped as minified-only exports: three.js and the entire scene fused into one IIFE
with short generated identifiers, so the archive documented them as unmodifiable. The original source
packages arrived today and both contain a readable tree:

| | built file | source | three.js |
|---|---|---|---|
| A05 Cliff Lighthouse Café | 588 KB | `src/scene.js` — 1,564 lines | r160 |
| A16 Route 66 Diner | 591 KB | `src/scene.js` — 2,179 lines | r160 |

Each package is two-part: the shipped single file, plus `src/` with an import-map entry point, the
scene module and a local `lib/` holding `three.module.js` and the addons actually used
(EffectComposer / RenderPass / ShaderPass / UnrealBloomPass / OutputPass / RoundedBoxGeometry), plus a
`BUILD.md` describing how to re-bundle with esbuild.

**The built files are byte-identical to what 0.0.6 shipped** (verified by sha256 on both), so nothing
in the rendered scenes changes and every measurement in `AUDIT.md` and `README.md` still holds. Only
the packaging and the documentation changed.

Impact on the archive:

- the "minified, uneditable" tier is now **empty** — 13 entries are modular, 6 are single-file-readable
- package sizes: A05 152 KB → 450 KB, A16 156 KB → 459 KB; unpacked archive 134 MB → 136 MB
- `index.html` no longer renders filter chips that would match nothing (the "成品锁死" chip is gone)
- `catalog.md` / `profiles.md` / `README.md` / `AUDIT.md` updated: A05 and A16 now carry entry,
  build and optimisation sections instead of "no source, cannot edit"

Both files remain candidates for the same treatment as A09: A05 has 935 mergeable meshes, A16 has 990,
and they share one scene skeleton, so a single batcher could serve both.

## 0.0.6 — 2026-10-30

### A15 — removed the gramophone from the second-floor balcony

The balcony carried a gramophone with a flared brass horn. Measured against the geometry it could
never have worked: the horn is **0.86 wide** while the balcony is only about 0.8 deep, so the whole
assembly ran from z=0.73 (inside the window opening) to z=1.72 (past the railing). From the street it
read as "a gramophone wedged into a second-floor windowsill" — the horn covered most of the window.

Removed the `balconyGramophone(bal, -0.18, 3.83, 1.07)` call in `src/interiors.js`. The balcony keeps
its wrought-iron railing, stone parapet, three-tier flower stand and the stone urns with potted
sprays. The gramophone motif survives downstairs — the record shop still has its brass-horn machine.
The function definition is left in place, so restoring it is one uncommented line.

| | before | after |
|---|---|---|
| draw calls / frame | 944 | **940** |
| scene triangles | 132,892 | 131,810 |

Draw calls barely move because most of the gramophone's ~40 parts had already been merged into static
batches; what changes is the composition, not the cost.

`previews/A15.png` and the gallery thumbnail were re-rendered, and the measures in `index.html`,
`README.md`, `AUDIT.md` and `profiles.md` were updated to match.

## 0.0.5 — 2026-10-30

### Scene-graph audit of all 19 entries

New tool `_tools/audit.mjs` opens every entry in a headless browser and reaches into its scene graph
through the `__THREE_DEVTOOLS__` observer that three.js dispatches from its own `Scene` and
`WebGLRenderer` constructors. That works on all 19 including the fully minified A05/A16, with no
debug handle and no source modifications.

`_tools/overlap.mjs` then transforms every triangle into world space, sorts its three vertices into
a key and looks for keys that repeat — surfaces sitting exactly on top of each other. Outline shells
(`side: BackSide`, or a mesh sharing its parent's geometry instance) are excluded, because those
are deliberately the same geometry drawn twice with a vertex-shader offset.

### What it found

- **23,313 meshes, 3.25M triangles**, of which **4,221 are outline shells** — 18% of all meshes,
  each one costing an extra draw call. A07 has the most (639); A11, whose own README estimated 400,
  actually has 105.
- **No real z-fighting anywhere.** ~2,700 triangles (0.08%) coincide exactly with another triangle,
  and all of them are props placed twice rather than modelling errors. Both copies share a material
  in every case, so they cost triangles, not visible flicker. Worst: A09 424, A15 408, A19 384,
  A03 354, A06 318. A11, A13, A14 and A16 are completely clean.
- **13,132 meshes are still mergeable** by material (upper bound — animated objects are not yet
  excluded). A02 2,128, A07 1,811, A18 1,159, A19 1,068 lead.
- A13 carries 723 distinct materials for 1,095 meshes — the lowest material reuse in the archive.

`AUDIT.md` (Chinese) holds the full per-entry table, the overlap ledger with world positions, and a
per-project optimisation list. `README.md` gains an English summary plus tool references.

## 0.0.4 — 2026-10-30

### A09 Grand Hotel: 7,047 → 1,009 draw calls (-86%)

The most expensive entry in the collection was the one with no documentation and no performance
data at all. Measuring it explained why: its frame renders the scene **three times** — a normal
prepass for outline extraction, the shadow pass, then the colour pass. Every static prop therefore
costs three draw calls instead of one.

Added `src/batch.js`, a static batcher that groups opaque, never-moving meshes by
`material.uuid + castShadow/receiveShadow + renderOrder`, bakes their world matrices and merges each
group into one mesh. It skips animated objects (elevator cars, revolving door, flag, switchboard
lamps, cable-car cabin), anything marked `userData.glass`, ShaderMaterials, InstancedMeshes and
geometry whose attribute sets don't line up.

| | before | after |
|---|---|---|
| draw calls / frame | 7,047 | **1,009** |
| triangles | 344,551 | 344,552 |
| file size | 601 KB | 604 KB |

Because the change is merged geometry, it also shrinks the prepass and shadow passes — that's why
the saving is larger than a plain single-pass batch would give.

**Visual verification.** The original build was re-rendered from the zip under the same settings and
diffed against the new one: 2.3% of pixels differ by more than 24 levels, and the difference mask
contains only 1-pixel edge shifts (sub-degree camera drift between the two captures), snow particles
and the animated flag. No filled regions anywhere — nothing was dropped or displaced.

Add `#stats` to the URL to see the batch counts in the console.

### Also

- `index.html` A09 card now reads 1,009 calls; the header stat drops from 7,047 to 3,574
  (Black Lodge is now the most expensive entry)
- `catalog.md` / `profiles.md`: A09 rows rewritten with the measurement and the fix; the
  "next steps" list now opens with A09 marked done
- `README.md`: gallery + sorted table refreshed from a fresh full run of `probe.mjs`

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
