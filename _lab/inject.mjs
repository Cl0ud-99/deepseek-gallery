/**
 * inject.mjs — 把 _lab/ambience.js 内联进 19 个场景入口
 *
 *   node _lab/inject.mjs           # 全部注入
 *   node _lab/inject.mjs --strip   # 全部移除
 *
 * 幂等：每次先删掉旧的 <!-- AMB:start --> … <!-- AMB:end --> 再重新插入。
 * 只改 _extracted/ 下的成品入口，不改任何 src/。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '_extracted');
const ENGINE = fs.readFileSync(path.join(__dirname, 'ambience.js'), 'utf8');

export const TARGETS = [
  ['A01', 'a01-twin-peaks-lodge/TwinPeaks-BlackLodge/TwinPeaks-BlackLodge.html'],
  ['A02', 'a02-ashtray-maze/ashtray-maze/standalone/ashtray-maze.html'],
  ['A03', 'a03-aurora-hourglass/aurora-hourglass/index.html'],
  ['A04', 'a04-autumn-farm/index.html'],
  ['A05', 'a05-cliff-lighthouse-cafe/cliff-lighthouse-cafe/index.html'],
  ['A06', 'a06-cloud-post-office/cloud-post-office/index.html'],
  ['A07', 'a07-fbc-quarry/fbc-quarry/standalone/fbc-quarry-07.html'],
  ['A08', 'a08-fbc-redshift/fbc-redshift-archive/dist/FBC-Redshift-Archive.html'],
  ['A09', 'a09-grand-hotel/grand-hotel-diorama/grand-hotel-diorama.html'],
  ['A10', 'a10-lighthouse/lighthouse-scene/lighthouse.html'],
  ['A11', 'a11-lunar-outpost/lunar-outpost/index-offline.html'],
  ['A12', 'a12-monach-stutter-lab/monach_stutter_lab/monach_stutter_lab.html'],
  ['A13', 'a13-mori-mart/mori-mart/index.html'],
  ['A14', 'a14-polar-icebreaker/polar-icebreaker/polar-icebreaker.html'],
  ['A15', 'a15-qipao-diorama/qipao-diorama/standalone/qipao-diorama.html'],
  ['A16', 'a16-route66-diner/route66-diner/index.html'],
  ['A17', 'a17-twin-peaks-red-room/twin-peaks-red-room/standalone/twin-peaks-red-room.html'],
  ['A18', 'a18-whale-dream-atelier/whale-dream-atelier/dist/dream-weaver-atelier.html'],
  ['A19', 'a19-stranger-things/hawkins-mirror/hawkins-mirror.html']
];

const START = '<!-- AMB:start -->';
const END = '<!-- AMB:end -->';
const strip = html => html.replace(new RegExp('\\n?' + START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\s\\S]*?' + END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');

const mode = process.argv.includes('--strip');
let changed = 0, skipped = 0;

for (const [id, rel] of TARGETS) {
  const fp = path.join(ROOT, rel);
  if (!fs.existsSync(fp)) { console.log(id, 'MISSING', rel); continue; }
  let html = fs.readFileSync(fp, 'utf8');
  const before = html.length;
  html = strip(html);
  if (!mode) {
    const block = '\n' + START + '\n<script>window.__AMB_PRESET__=' + JSON.stringify(id) + ';</script>\n<script>\n' + ENGINE + '\n</script>\n' + END + '\n';
    const i = html.lastIndexOf('</body>');
    html = i >= 0 ? html.slice(0, i) + block + html.slice(i) : html + block;
  }
  if (html.length === before && !mode) { skipped++; continue; }
  fs.writeFileSync(fp, html);
  changed++;
  console.log(id, (mode ? 'stripped' : 'injected'), (before / 1024 | 0) + 'KB ->', (html.length / 1024 | 0) + 'KB');
}
console.log('---');
console.log(mode ? ('removed from ' + changed) : ('injected into ' + changed + ', unchanged ' + skipped));
