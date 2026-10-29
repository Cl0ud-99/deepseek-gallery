# 归档入口

19 件 Three.js 程序化微缩场景。三个文件按用途分：

| 文件 | 用途 |
|---|---|
| **index.html** | 可视化清单。双击打开，带缩略图，可按题材 / 可改性 / 关键词筛选，点卡片看详档 |
| **catalog.md** | 纯文本总表 + 4 个筛选视图 + 横向结论。适合在编辑器里快速扫 |
| **profiles.md** | 逐件详档：是什么 / 里面有什么 / 技术实现 / 怎么打开 / 已知坑 / 优化切入点 |

目录：

```
_packages/   19 个原始压缩包，统一 aNN-slug.zip 命名
_extracted/  解压后的源码工作副本，与 zip 同名（aNN-slug/）
previews/    19 张实拍预览图，1440×900，本机 Chrome + SwiftShader 逐件渲染
  └ _pkg_originals/  A01/A02 包内自带的成品图（备查，未用于清单）
_tools/      shot.mjs —— 截图脚本，改完作品可重出图
```

合计约 245MB（zip 87MB + 解压 135MB + 预览图 24MB）。

## 重新出预览图

19 张图不是包内素材，是打开程序实拍的。想更新某几件：

```bash
node archive/_tools/shot.mjs            # 全部重截（约 7 分钟）
node archive/_tools/shot.mjs A15,A17    # 只重截指定编号
```

需要 `npm install puppeteer-core`（在本目录的上一级，已有 node_modules 则跳过）。脚本会起本地静态服务器
`127.0.0.1:8899` 再驱动无头 Chrome —— 走 http 而不是 `file://`，是因为 A03/A11/A12 等用 ES Module 与
importmap，`file://` 下会被 CORS 挡住。软件渲染（SwiftShader）保证没有独显也能出图。

## 编号对照

| | | | |
|---|---|---|---|
| A01 双峰黑色旅舍 | A02 烟灰缸迷宫 | A03 极光沙漏 | A04 秋日农场 |
| A05 海崖咖啡馆 | A06 云端飞艇邮局 | A07 倒悬采石场 | A08 红移档案 |
| A09 阿尔卑斯大酒店 | A10 灯塔 | A11 月球前哨 | A12 时间断裂实验舱 |
| A13 森之便利店 | A14 破冰船 | A15 1936 上海 | A16 66 号公路餐厅 |
| A17 双峰红房间 | A18 晚霞织梦染坊 | A19 怪奇物语双世界 | |

## 命名规则

统一 `aNN-slug` 全英文小写短名，zip 与解压目录同名：

| | |
|---|---|
| `a01-twin-peaks-lodge` | `a11-lunar-outpost` |
| `a02-ashtray-maze` | `a12-monach-stutter-lab` |
| `a03-aurora-hourglass` | `a13-mori-mart` |
| `a04-autumn-farm` | `a14-polar-icebreaker` |
| `a05-cliff-lighthouse-cafe` | `a15-qipao-diorama` |
| `a06-cloud-post-office` | `a16-route66-diner` |
| `a07-fbc-quarry` | `a17-twin-peaks-red-room` |
| `a08-fbc-redshift` | `a18-whale-dream-atelier` |
| `a09-grand-hotel` | `a19-stranger-things` |
| `a10-lighthouse` | |

## 重命名时修掉的三处

- `a13-mori-mart/mori-mart/readme.txt` —— 原包文件名是乱码（zip 用了非 UTF-8 编码），内容未改。
- `a19-stranger-things/stranger-things/readme.txt` —— 同上。
- `a18-whale-dream-atelier/…/dist/sunset-dream-loom.html` —— 原为中文名，改为英文短名；同目录的乱码重复副本已删（与 `dream-weaver-atelier.html` 内容完全一致）。

压缩包内容未做任何修改，只改了归档层的文件名。
