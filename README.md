<div align="center">

# 🌙 月亮露馅了

### 小红书中秋互动人格测试小工具

[![Platform: Builder Hub](https://img.shields.io/badge/Platform-XHS%20Builder%20Hub-ff2442.svg)](https://www.xiaohongshu.com/)
[![Runtime: Offline H5](https://img.shields.io/badge/Runtime-Offline%20H5-111827.svg)](#数据与安全)
[![Tests](https://img.shields.io/badge/Tests-Node%20%2B%20Playwright-16a34a.svg)](#本地开发与验证)
[![Data: Local-first](https://img.shields.io/badge/Data-Local--first-f97316.svg)](#数据与安全)

**从一块月皮和一勺馅开始，做出一只只属于你的月饼，看看你会露出什么样的月亮性格。**

</div>

《月亮露馅了》是一个面向小红书Builder Hub的离线H5互动工具。用户会在制作月饼的过程中做出选择、接住或躲开随机配料、揉月、压模和控制火候；工具把这些选择与操作行为整理成一份有证据的互动人格结果册。

它不是心理诊断，也不是答题器。结果来自一段完整的制作过程：你选了什么、怎么调整、有没有接住配料、什么时候取出月饼，都会成为结果册里的行为线索。

## ✨ 核心特性

- 🥮 **完整月饼制作流程**：选月皮、选主馅、调整夹心比例、接配料、揉月、压模、烘烤和切开。
- 🎨 **暖白色食物画报界面**：原创月饼插画、圆角选项卡与更短的操作提示；视觉素材随ZIP本地打包。
- 🎭 **16种人格母型**：根据用户的选择与操作行为生成结果，不把随机配料直接当成性格分数。
- 📖 **五页结果册**：包含月饼切面、人格描述、行为证据、配方、关系侧写和可选附加页。
- 🌙 **隐藏分岔与彩蛋**：部分选择会进入不同命运路径，满足调整次数或火候条件时会解锁附加内容。
- 🖼️ **可分享的结果图**：生成1080×1440的竖版分享图，适合保存或发布到社交平台。
- 💾 **本地优先**：结果和进行中的步骤保存在本机，刷新后可以恢复上一轮进度。
- ♿ **操作兜底**：切月饼支持划开、键盘操作和始终可见的“直接切开”；揉月与压模也保留键盘路径。

## 给新用户：只需要做一只月饼

打开工具后，按屏幕提示完成下面这段制作流程：

```text
开始制作 → 选月皮和主馅 → 调整夹心比例 → 接住或躲开配料
→ 画圈揉月 → 长按压模 → 控制火候 → 切开月饼 → 阅读结果册
```

你不需要注册账号，也不需要连接服务端。普通浏览器可直接预览；在小红书宿主中，工具会按平台提供的能力尝试写入相册。

## 结果册如何生成

结果册不是随机抽签，而是把制作过程中的可观察行为整理成几类线索：

| 线索 | 示例 | 结果中的呈现 |
| --- | --- | --- |
| **内容选择** | 月皮、主馅、夹心比例 | 人格描述与配方偏好 |
| **过程操作** | 调整次数、揉月轨迹、压模时机 | 行为证据与做事方式 |
| **风险决策** | 接住配料、躲开配料、命运分岔 | 关系侧写与隐藏页 |
| **火候判断** | 取出时机、是否烤过头 | 结果语气与附加内容 |

随机配料用于制造过程变化，但不会单独决定人格分数。人格结果是互动内容，只用于娱乐和自我观察，不构成心理诊断或专业测评。

## 数据与安全

- 会话、结果和恢复信息只保存在浏览器本地，不上传到项目服务端。
- 项目运行时不依赖CDN、网络请求、Worker、WASM、模块脚本或iframe。
- 分享图在普通浏览器中可以预览；写入相册仅在宿主提供`window.xhs.miniTool` JSBridge时可用。
- 本地测试和静态预检通过，不等于Builder Hub上传、扫码预览、iOS/Android真机或平台审核已经通过。

## 项目结构

```text
index.html              # 离线 H5 入口
assets/content.js       # 配料、文案与人格结果内容
assets/engine.js        # 会话记录、评分与结果分类
assets/visuals.js       # 月亮、月饼和分享图的 Canvas 绘制
assets/app.js           # 页面状态、交互和恢复逻辑
assets/style.css        # 基础交互样式
assets/editorial.css    # 暖白画报视觉与响应式布局
assets/mooncake-whole.webp # 本地原创月饼插画
assets/mooncake-cut-*.webp # 五种主馅对应的本地切面插画
assets/filling-*.webp # 五种主馅的本地食材插画
docs/                   # 设计定稿与插画原始素材，不进入上传包
scripts/                # 上传 ZIP 构建与平台约束预检
tests/                  # 逻辑、打包、平台契约和浏览器测试
```

## 本地开发与验证

从仓库根目录启动静态服务，再打开 `http://127.0.0.1:4223/`：

```powershell
python -m http.server 4223 --bind 127.0.0.1
```

在另一个终端运行Node和浏览器测试。浏览器测试需要Python、Playwright和已安装的Chromium：

```powershell
node --test tests/engine.test.js tests/platform-contract.test.js tests/package.test.js tests/visuals.test.js
python tests/browser_flow_test.py
python tests/browser_edge_test.py
```

浏览器主流程覆盖全部制作步骤、结果册、刷新恢复、划开月饼及320/375/430px宽度；边界流程覆盖全部躲开、隐藏页、键盘路径、损坏缓存降级、短划取消与一键切开、切开与结果人格一致性，以及模拟的相册JSBridge。需要安装浏览器测试依赖时运行：

```powershell
pip install playwright
python -m playwright install chromium
```

## 构建小红书上传包

上传的是生成的ZIP，不是整个Git仓库。ZIP根目录只包含`index.html`和`assets/`中的运行文件；测试、脚本、README和截图不会打入上传包。

在Windows PowerShell中，从仓库根目录运行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\build-upload.ps1 -OutputPath .\moon-leaks-tool-upload.zip
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\preflight-upload.ps1 -ZipPath .\moon-leaks-tool-upload.zip
```

## 贡献与反馈

欢迎提交Issue或Pull Request。为了方便定位问题，请尽量提供：

- 可复现的操作路径或脱敏后的缓存数据；
- 浏览器、屏幕宽度和运行环境；
- 期望结果与实际结果之间的差异。

请不要上传真实账号、Cookie、个人敏感信息或未脱敏的用户数据。涉及视觉布局的问题，欢迎附上截图或最小复现文件。

## 代码同步

本目录是[`Surge-Dan/moon-leaks`](https://github.com/Surge-Dan/moon-leaks)的工作目录。后续修改完成并通过相关测试后，只提交本项目文件并推送到`origin/main`；如果远端出现冲突或推送失败，先确认原因，不强制覆盖远端。

## 许可证

当前仓库未单独声明开源许可证。若要公开分发或复用，请先补充明确的许可证文件，并同步更新本节。
