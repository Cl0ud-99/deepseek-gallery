# 新增一件作品的检查清单

页面在 `boot()` 时会跑 `selfCheck()`，缺项会直接打在控制台。
但只要少一步，卡片就可能打不开或者没图，所以照着这份清单走。

## 四步

1. **放源码**
   `_extracted/aXX-<名字>/index.html`（或它自己的入口路径）。
   建议先确认能单独打开、不依赖服务器。

2. **拍预览**
   ```bash
   # 把条目加到 _tools/targets.json：
   #   { "id": "A23", "rel": "a23-xxx/index.html", "wait": 7000 }
   node _tools/framed-shot.mjs A23
   ```
   产出 `previews/A23.png`（1440×900，自动取景、整件入画）。

3. **出墙面图与缩略图**
   ```
   previews/wall/A23.jpg     1200×750  q78
   previews/thumbs/A23.jpg    720×450  q80
   ```
   都是 16:9，与页面里的卡片比例一致。

4. **写进数据**
   `index.html` 里两处：
   ```js
   var WORKS = [ … {id:"A23",en:"English Name",cn:"中文副标题"}, … ];
   var SRC   = { …, "A23":"_extracted/a23-xxx/index.html" };
   ```
   id 必须是 `A` + 两位数字；两处都要有。

## 会自检出来、但不会崩的情况

| 情况 | 表现 |
|---|---|
| SRC 里缺这一条 | 控制台告警，点击不打开（不会出现空白 iframe） |
| 墙面图缺失 | 卡片显示编号占位（`.noimg`），布局不塌 |
| id 重复 / 命名不规范 | 控制台列出 |
| SRC 里有孤儿条目 | 控制台列出 |

## 不用改的地方

网格列数（固定 4 列）、行数、滚动条、移轴层、缓冲区、转场动画——
全部按 `WORKS.length` 与实测布局算，新增一件不需要动任何一条。
