# 主应用架构说明

## 文档范围

本文只描述根目录主应用，不描述 `editor-next/`。

根应用入口链：`index.html -> src/main.js -> src/app/index.js`

`editor-next/` 是独立原型，有自己的入口、测试和本地服务，见 `editor-next/README.md`。

## 先建立正确心智

当前主应用已经不是“所有逻辑都堆在 `src/main.js`”的结构。

- `src/main.js` 现在只是启动薄层
- 运行时编排集中在 `src/app/create-resume-app.js`
- 数据、表单、预览、头像、持久化已经拆到独立目录

如果你要读代码，不要把旧印象里的单体 `src/main.js` 当成事实。

## 目录与模块边界

| 路径 | 角色 | 当前边界 |
| --- | --- | --- |
| `index.html` | DOM 壳 | 提供 `#form-root`、`#resume-root`、导入导出和打印按钮 |
| `src/main.js` | 启动薄层 | 导入 `src/styles/main.css`，调用 `startResumeApp()` |
| `src/app/index.js` | 装配入口 | 获取 DOM、创建 app、绑定事件、挂 `window.__resumeApp__` |
| `src/app/create-resume-app.js` | 主编排层 | 持有 `resumeData` 和 UI 运行时状态，处理初始化、表单动作、重渲染、导入导出、打印 |
| `src/app/dom.js` | DOM 定位 | 统一收口页面 id 依赖 |
| `src/app/bind-events.js` | 事件壳 | 把 DOM 事件转发到 app 方法 |
| `src/app/public-api.js` | 测试 / 自动化接口 | 公开 `getResumeData()`、`rerender()`、头像裁切相关方法 |
| `src/core/config.js` | 静态配置 | 常量、默认数据、主题列表、布局列表、草稿 key、头像限制 |
| `src/core/resume-model.js` | 数据模型与主题模型 | `normalizeResumeData()`、图标解析、项目 render model、主题 CSS 变量 |
| `src/core/utils.js` | 纯工具函数 | clone、字符串数组转换、HTML escape、数值钳制 |
| `src/form/render.js` | 左侧表单渲染 | 输出整块表单 HTML，包含头像裁切弹窗和布局主题控件 |
| `src/preview/render.js` | 右侧预览与分页 | 四套版式 builder、分页测量、打印页拼装 |
| `src/avatar/controller.js` | 头像交互控制 | 上传、裁切确认、编辑器同步、状态回写 |
| `src/avatar/avatar-utils.js` | 头像算法与元数据 | frame 归一化、拖拽换算、图片 meta 读写 |
| `src/persistence/draft-store.js` | 草稿持久化 | `localStorage` 草稿、IndexedDB 头像 sidecar、草稿恢复和升级 |
| `src/resume-layout-controls.js` | 布局控制域 | 滑杆范围、legacy spacing 折叠、CSS 变量生成 |
| `src/styles/main.css` | 全局视觉层 | 编辑器布局、四套简历版式、打印样式、头像裁切样式 |

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
```

`initializeApp()` 在 `src/app/create-resume-app.js` 里做三件事：

1. `loadDraft()`，尝试恢复本地草稿和头像 sidecar
2. `setCleanSnapshot()`，建立当前干净快照
3. `renderAll()`，同时重建表单和预览

## 应用主流程

### 1. 表单输入到状态

表单事件都绑定在 `formRoot` 上，由 `src/app/bind-events.js` 转发到 app：

- `input` -> `handleFormInput()`
- `change` -> `handleFormChange()`
- `click` -> `handleFormClick()`

`create-resume-app.js` 里的 `applyFieldUpdate()` 和 `handleAction()` 决定如何把 DOM 事件写回 `resumeData`。

这里依赖一套稳定的 `data-*` 协议：

- 输入类：`data-section`、`data-field`、`data-index`、`data-multiline`
- 按钮类：`data-action`，外加 `data-layout`、`data-theme`、`data-shape`、`data-palette`、`data-color` 等附加字段

所以改表单时，通常要同时改两处：

- `src/form/render.js` 输出的 DOM 属性
- `src/app/create-resume-app.js` 里的更新逻辑

### 2. 状态到表单 / 预览

`renderAll()` 是主刷新入口：

```text
renderAll()
  -> renderForm()
     -> renderFormHtml(...)
  -> renderResume(resumeData, activeRenderMode)
```

表单不是局部 patch，而是整块重建 HTML。重建后会重新执行：

- `avatarController.initAvatarFrameEditor()`
- `initBasicInfoSortable()`

这就是为什么事件层采用委托，而不是给每个控件单独绑监听器。

### 3. 状态到预览与分页

预览主链在 `src/preview/render.js`：

```text
renderResume()
  -> buildResumeThemeVars() / buildResumeThemeInlineStyle()
  -> buildLayoutColumnBlocks(layout, data, profileImage)
  -> paginateColumnBlocks(leftBlocks, ...)
  -> paginateColumnBlocks(rightBlocks, ...)
  -> renderResumePage(...)
  -> resumeRoot.innerHTML = ...
```

当前支持 4 套版式：

- `classic`
- `cards`
- `my-resume`
- `my-resume3`

它们都由 `src/preview/render.js` 同文件实现。

预览层最重要的契约是 `buildLayoutColumnBlocks()` 必须返回：

```js
{
  leftBlocks: string[],
  rightBlocks: string[]
}
```

分页器只认 block 数组，不关心 block 是怎么拼出来的。

## 数据模型边界

### `resumeData` 是唯一主文档状态

无论数据来自默认样例、导入 JSON，还是本地草稿，都会先经过 `normalizeResumeData()`。

当前主字段包括：

- 文档与版式：`documentTitle`、`resumeLayout`、`resumeTheme`
- 布局控制：`fontScale`、`lineHeightScale`、`innerPaddingScale`、`moduleSpacingScale`、`titleScale`、`nameScale`、`roleScale`
- 展示开关：`showExperienceTimeline`、`useThemeTimeline`、`useFlatIcons`、`iconPalette`、`skillBadgeColor`
- 头像：`profileImage`、`avatarImageMeta`、`avatarFrame`、`avatarShape`
- 文本与结构化内容：`name`、`role`、`summary`、`professionalSkillsText`、`basicInfo`、`education`、`skills`、`experiences`、`projects`

### 需要注意的归一化规则

- `basicInfo` 不是自由扩展数组，`normalizeBasicInfoList()` 只接受 `BASIC_INFO_PRESETS` 里的固定 id，并补齐到 5 项
- 旧字段 `classicSpacingScale` / `cardsSpacingScale` 会在 `normalizeResumeLayoutControlsForLayout()` 里折叠进 `moduleSpacingScale`
- `projects` 会先经过 `buildProjectRenderModel()`，只有可渲染字段会进入最终模型

## 头像与草稿持久化

### 头像流程

头像相关逻辑拆成两层：

- `src/avatar/controller.js`：交互控制
- `src/avatar/avatar-utils.js`：frame 算法、meta 处理、图片判断

`createResumeApp()` 通过 `createAvatarController()` 把表单、预览、保存动作串起来。

### 草稿流程

`src/persistence/draft-store.js` 管理根应用的本地持久化。

存储分两层：

- `localStorage`：文本文档草稿
- IndexedDB：头像 sidecar

关键常量都在 `src/core/config.js`：

- `STORAGE_KEY = "resume-generator-draft-v1"`
- `DRAFT_STORAGE_VERSION = 2`
- `DRAFT_AVATAR_SENTINEL = "__resume-avatar-sidecar__"`

草稿恢复链：

```text
loadDraft()
  -> parseDraftStoragePayload()
  -> normalizeResumeData()
  -> readAvatarSidecar() if needed
  -> hydrateAvatarStateIfNeeded()
```

草稿保存链：

```text
saveDraft()
  -> buildDraftStoragePayload()
  -> localStorage.setItem(...)
  -> syncAvatarSidecar() if needed
```

## 打印与公开接口

### 打印

打印按钮只触发 `window.print()`，真正的打印切换靠：

- `handleBeforePrint()` -> `rerenderResumeNow("print")`
- `handleAfterPrint()` -> `scheduleScreenModeRestore()`
- `src/styles/main.css` 里的打印样式

### 浏览器公开接口

`src/app/public-api.js` 把以下能力暴露给 `window.__resumeApp__`：

- `getResumeData()`
- `getLastExportedJson()`
- `getStatusText()`
- `getAvatarCropState()`
- `rerender()`
- 头像裁切和头像 frame 调整相关方法

这层接口主要服务自动化检查和调试，不是稳定 SDK。

## 测试、构建与部署边界

### 测试

- `app-contracts.test.js`：验证版式 builder 仍返回 `{ leftBlocks, rightBlocks }`，以及草稿头像 sidecar 契约
- `resume-layout-controls.test.js`：验证布局控制滑杆范围、legacy spacing 折叠和 CSS 变量输出

根目录测试命令：

```bash
node --test app-contracts.test.js resume-layout-controls.test.js
```

### 构建与部署

- `package.json`：根应用脚本入口
- `vite.config.js`：只把根目录 `index.html` 作为构建输入，输出到 `dist-static/`
- `tailwind.config.js`：只扫描根应用 `index.html` 和 `src/**/*.{js,html}`
- `postcss.config.js`：PostCSS 插件入口
- `wrangler.jsonc`：Cloudflare Pages 输出目录是 `./dist-static`

这也意味着 `editor-next/` 不属于根应用打包输入。
