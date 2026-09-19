# 月亮露馅了

一个小红书中秋互动人格测试小工具：通过选择月皮和馅料、调整夹心比例、接住随机配料、揉月、压模与烘烤，生成专属月饼和人格结果册。

这是面向小红书 Builder Hub 小工具的离线 H5 项目。入口为仓库根目录的 `index.html`，运行时资源全部在 `assets/`，无需服务端或外部网络。

## 玩法与结果

1. 拖动月光碎片补圆月亮，选择月皮、主馅和夹心比例。
2. 在随机掉落的配料中接住一个，或全部躲开；部分路径会出现可选的命运分岔。
3. 画圈揉月、长按压模，观察火候并决定何时取出，再切开月饼。
4. 查看基于选择与操作行为生成的 16 种人格母型之一，以及五页结果册。调整次数或火候满足条件时会出现附加页。

结果册包含月饼切面、人格描述、行为证据、配方和关系侧写。可以生成 1080 × 1440 的分享图、将结果保存在本机，并在再次打开工具时翻看上一轮。进行中的步骤支持刷新后恢复。拖拽、揉月、压模和切开也提供键盘操作兜底。

人格结果是互动内容，不是心理诊断。随机配料本身不直接决定人格分数；评分使用用户的选择与操作行为。

## 项目结构

| 路径 | 用途 |
| --- | --- |
| `index.html` | 离线 H5 入口 |
| `assets/content.js` | 配料、文案与人格结果内容 |
| `assets/engine.js` | 会话记录、评分与结果分类 |
| `assets/visuals.js` | 月亮、月饼和分享图的 Canvas 绘制 |
| `assets/app.js`、`assets/style.css` | 页面状态、交互与样式 |
| `scripts/` | 构建上传 ZIP、执行平台约束预检 |
| `tests/` | 逻辑、打包、平台契约和浏览器测试 |

## 本地预览与测试

从仓库根目录启动静态服务，再打开 `http://127.0.0.1:4223/`：

```powershell
python -m http.server 4223 --bind 127.0.0.1
```

在另一个终端运行 Node 内置测试。浏览器测试需要 Python、Playwright 和已安装的 Chromium：

```powershell
node --test tests/engine.test.js tests/platform-contract.test.js tests/package.test.js tests/visuals.test.js
python tests/browser_flow_test.py
python tests/browser_edge_test.py
```

浏览器主流程覆盖全部制作步骤、结果册、刷新恢复及 320 / 375 / 430 px 宽度；边界流程覆盖全部躲开、隐藏页、键盘路径、损坏缓存降级、切开与结果人格一致性，以及模拟的相册 JSBridge。需要安装浏览器测试依赖时运行 `pip install playwright` 和 `python -m playwright install chromium`。

## 构建小红书上传包

在 Windows PowerShell 中，从仓库根目录运行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\build-upload.ps1 -OutputPath .\moon-leaks-tool-upload.zip
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\preflight-upload.ps1 -ZipPath .\moon-leaks-tool-upload.zip
```

上传的是生成的 ZIP，不是整个 Git 仓库。ZIP 根目录包含 `index.html` 及 `assets/` 中的五个运行文件；测试、脚本、README 和截图不会打入上传包。

项目不使用 CDN、网络请求、模块脚本、Worker、WASM、内联脚本或行内事件。普通浏览器可以预览分享图；写入相册仅在宿主提供相应 `window.xhs.miniTool` JSBridge 时可用。本地预检和浏览器测试通过，不等于 Builder Hub 上传、扫码预览、iOS / Android 真机或平台审核已通过。

## 代码同步

本目录是 [`Surge-Dan/moon-leaks`](https://github.com/Surge-Dan/moon-leaks) 的工作目录。后续修改完成并通过相关测试后，只提交本项目文件并推送到 `origin/main`；若远端出现冲突或推送失败，先确认原因，不强制覆盖远端。
