# CODEMAP

这份文档只做一件事，帮你在当前仓库里快速找到该改的代码。

如果你是大模型 / 自动化 coding agent，请先看根目录 `AGENTS.md`，再把这里当作第二层详细索引。

仓库里有两个工作区：

- 根目录主应用：`index.html -> src/main.js -> src/app/index.js`
- `editor-next/`：独立原型，不接入根应用的构建与部署链

## 如果你要改 X，请先看这里

- 改启动链、挂载顺序、全局公开接口：先看 `index.html`、`src/main.js`、`src/app/index.js`
- 改应用编排、导入导出、重置、打印、表单动作：先看 `src/app/create-resume-app.js`
- 改 DOM 壳层 id、事件绑定方式：先看 `src/app/dom.js`、`src/app/bind-events.js`
- 改左侧表单 HTML、控件区块、`data-action` / `data-section` 协议：先看 `src/form/render.js`
- 改右侧预览、版式模板、分页、打印页输出：先看 `src/preview/render.js`
- 改草稿存储、头像 sidecar、草稿升级：先看 `src/persistence/draft-store.js`
- 改头像上传、裁切、缩放、拖拽：先看 `src/avatar/controller.js`、`src/avatar/avatar-utils.js`
- 改默认数据、常量、布局列表、主题列表、存储 key：先看 `src/core/config.js`
- 改数据归一化、主题变量、图标解析、项目渲染模型：先看 `src/core/resume-model.js`
- 改布局控制滑杆范围或 CSS 变量输出：先看 `src/resume-layout-controls.js`
- 改全局样式、打印样式、四套简历版式外观：先看 `src/styles/main.css`
- 改 `editor-next/` 原型入口、拖拽约束、preset 模板、原型持久化：先看 `editor-next/README.md`，再进 `editor-next/src/`

## 主应用 Path | Purpose

| Path | Purpose |
| --- | --- |
| `index.html` | 页面壳，定义 `#form-root`、`#resume-root` 和顶部按钮 id，并加载 `/src/main.js` |
| `src/main.js` | 根应用启动薄层，只导入样式并调用 `startResumeApp()` |
| `src/app/index.js` | 应用真正入口，串起 DOM 获取、`createResumeApp()`、事件绑定、`window.__resumeApp__` |
| `src/app/create-resume-app.js` | 主编排文件，维护 `resumeData`、表单动作、导入导出、打印、重渲染、草稿恢复 |
| `src/app/dom.js` | 根应用依赖的 DOM 节点定位函数 |
| `src/app/bind-events.js` | 表单委托事件、按钮事件、窗口重排和打印事件绑定 |
| `src/app/public-api.js` | 公开给自动化和调试的浏览器 API 封装 |
| `src/core/config.js` | 常量、默认示例数据、主题与版式选项、存储 key、头像限制 |
| `src/core/resume-model.js` | `normalizeResumeData()`、主题变量、图标解析、项目 render model |
| `src/core/utils.js` | 小型纯函数工具，如 `cloneData()`、`linesToArray()`、`escapeHtml()` |
| `src/form/render.js` | 左侧编辑面板 HTML 渲染，含头像裁切弹窗、主题切换、联系方式拖拽区 |
| `src/preview/render.js` | 四套版式 builder、分页测量、打印页输出、预览根节点渲染 |
| `src/avatar/controller.js` | 头像上传、裁切确认、编辑器 UI 同步等交互控制 |
| `src/avatar/avatar-utils.js` | 头像 frame 归一化、拖拽换算、图片 meta 处理 |
| `src/persistence/draft-store.js` | `localStorage` 草稿、IndexedDB 头像 sidecar、草稿解析与升级 |
| `src/resume-layout-controls.js` | 布局控制项范围、归一化逻辑、CSS 变量生成 |
| `src/styles/main.css` | 全局布局、四套版式样式、打印样式、头像裁切样式 |
| `app-contracts.test.js` | 根应用契约测试，覆盖预览 block 结构和草稿 sidecar 协议 |
| `resume-layout-controls.test.js` | 布局控制测试，覆盖 legacy spacing 折叠和 CSS 变量输出 |
| `package.json` | 根应用开发、构建、预览、Cloudflare 部署脚本 |
| `vite.config.js` | Vite 构建入口和 `dist-static/` 输出配置 |
| `tailwind.config.js` | Tailwind 扫描范围与 safelist |
| `postcss.config.js` | PostCSS 插件配置 |
| `wrangler.jsonc` | Cloudflare Pages 输出目录配置 |

## 主要热点矩阵

| 变更主题 | 先看文件 | 关键符号 | 相关测试 |
| --- | --- | --- | --- |
| 启动与公开接口 | `src/main.js`, `src/app/index.js`, `src/app/public-api.js` | `startResumeApp`, `createResumeAppPublicApi` | `app-contracts.test.js` |
| DOM 壳与事件绑定 | `src/app/dom.js`, `src/app/bind-events.js`, `index.html` | `getAppDom`, `bindResumeAppEvents` | 无专门测试，改后至少跑根应用构建 |
| 表单输入和按钮动作 | `src/app/create-resume-app.js`, `src/form/render.js` | `handleFormInput`, `handleFormClick`, `applyFieldUpdate`, `handleAction`, `renderFormHtml` | 无专门测试，改后至少跑根应用构建 |
| 版式切换与预览渲染 | `src/app/create-resume-app.js`, `src/preview/render.js` | `renderResume`, `buildLayoutColumnBlocks`, `buildClassicLeftColumnBlocks`, `buildCardRightColumnBlocks` | `app-contracts.test.js` |
| 分页与打印 | `src/preview/render.js`, `src/app/create-resume-app.js`, `src/styles/main.css` | `paginateColumnBlocks`, `createMeasurePage`, `renderResumePage`, `handleBeforePrint`, `handleAfterPrint` | `app-contracts.test.js` |
| 数据模型与归一化 | `src/core/config.js`, `src/core/resume-model.js`, `src/core/utils.js` | `sampleResumeData`, `normalizeResumeData`, `normalizeBasicInfoList`, `buildProjectRenderModel` | `app-contracts.test.js` |
| 布局控制滑杆 | `src/resume-layout-controls.js`, `src/form/render.js`, `src/core/resume-model.js` | `clampResumeLayoutControl`, `normalizeResumeLayoutControlsForLayout`, `buildResumeLayoutControlVars` | `resume-layout-controls.test.js` |
| 草稿持久化 | `src/persistence/draft-store.js`, `src/core/config.js` | `createDraftStore`, `buildDraftStoragePayload`, `parseDraftStoragePayload`, `syncAvatarSidecar` | `app-contracts.test.js` |
| 头像上传与裁切 | `src/avatar/controller.js`, `src/avatar/avatar-utils.js`, `src/form/render.js` | `createAvatarController`, `createAvatarCropState`, `calculateAvatarFrameFromDrag`, `normalizeAvatarFrame` | 无专门测试，改后至少跑根应用构建 |
| 样式和视觉层 | `src/styles/main.css`, `src/core/resume-model.js`, `src/resume-layout-controls.js` | `buildResumeThemeVars`, `buildResumeThemeInlineStyle`, CSS 变量 `--resume-*` | `resume-layout-controls.test.js` |

## 运行时入口链

```text
index.html
  -> /src/main.js
    -> startResumeApp() in src/app/index.js
      -> getAppDom()
      -> createResumeApp({ dom })
      -> bindResumeAppEvents({ app, dom })
      -> window.__resumeApp__ = createResumeAppPublicApi(app)
      -> await app.initializeApp()
         -> loadDraft()
         -> renderAll()
            -> renderForm()
               -> renderFormHtml(...)
            -> renderResume(...)
               -> buildLayoutColumnBlocks(...)
               -> paginateColumnBlocks(...)
               -> resumeRoot.innerHTML = ...
```

## 测试 / 配置 / 部署位置

- 根应用测试文件：`app-contracts.test.js`、`resume-layout-controls.test.js`
- 根应用测试命令：`node --test app-contracts.test.js resume-layout-controls.test.js`
- 根应用脚本入口：`package.json`
- 构建输出目录：`dist-static/`
- 构建配置：`vite.config.js`
- Tailwind 扫描与 safelist：`tailwind.config.js`
- PostCSS：`postcss.config.js`
- Cloudflare Pages：`wrangler.jsonc`
- 根目录的 `playwright-screen-snapshot.md` 是一次性检查产物，不是代码导航真相源

## `editor-next/` 在仓库里的位置

`editor-next/` 不是根应用的下一层模块，而是独立原型工作区。

- 入口链：`editor-next/index.html -> editor-next/src/ui/app.js -> renderPreview()`
- 本地运行：`editor-next/server.js`
- 原型核心：`editor-next/src/core/document.js`、`editor-next/src/core/layout-ops.js`、`editor-next/src/core/persistence.js`、`editor-next/src/core/presets.js`
- preset 定义：`editor-next/src/presets/cards.js`、`editor-next/src/presets/classic.js`
- 原型测试：`editor-next/tests/*.test.js`
- 隔离约束：根目录 Vite 构建和 Cloudflare 配置只面向主应用，不会把 `editor-next/` 打包进 `dist-static/`
