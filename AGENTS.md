# AGENTS

本文件是**给大模型/自动化 coding agent** 用的快速导航入口，不是面向最终用户的介绍文档。

目标：收到一个改动请求后，先用这份文档决定**去哪几个文件读、哪些隐式契约不能破、要跑哪些验证**。

## 0. 作用范围

- 主工作区：根目录主应用
- 独立工作区：`editor-next/`
- 默认不要把两者混成一个系统理解
- 如果用户没有明确提到 `editor-next/`，默认只看根目录主应用

## 1. 代码入口链

### 根目录主应用

```text
index.html
  -> src/main.js
    -> src/app/index.js:startResumeApp()
      -> src/app/dom.js:getAppDom()
      -> src/app/create-resume-app.js:createResumeApp()
      -> src/app/bind-events.js:bindResumeAppEvents()
      -> src/app/public-api.js:createResumeAppPublicApi()
```

### `editor-next/`

```text
editor-next/index.html
  -> editor-next/src/ui/app.js
```

## 2. 改 X 时先看哪里

| 任务 | 先读文件 | 再联读 | 关键符号 |
| --- | --- | --- | --- |
| 启动/挂载失败 | `src/main.js` | `src/app/index.js`, `src/app/dom.js`, `index.html` | `startResumeApp`, `getAppDom` |
| 表单改动 | `src/form/render.js` | `src/app/create-resume-app.js` | `renderFormHtml`, `applyFieldUpdate`, `handleAction` |
| 按钮动作不生效 | `src/app/bind-events.js` | `src/app/create-resume-app.js`, `src/form/render.js` | `bindResumeAppEvents`, `handleFormClick` |
| 预览/分页/打印 | `src/preview/render.js` | `src/app/create-resume-app.js`, `src/styles/main.css` | `renderResume`, `buildLayoutColumnBlocks`, `paginateColumnBlocks`, `handleBeforePrint`, `handleAfterPrint` |
| 简历版式新增/修改 | `src/preview/render.js` | `src/core/resume-model.js`, `src/styles/main.css` | `buildLayoutColumnBlocks`, 各 layout builder |
| 主题/颜色/变量 | `src/core/resume-model.js` | `src/resume-layout-controls.js`, `src/styles/main.css` | `buildResumeThemeVars`, `buildResumeThemeInlineStyle`, `buildResumeLayoutControlVars` |
| 数据模型/默认值 | `src/core/config.js` | `src/core/resume-model.js`, `src/core/utils.js` | `sampleResumeData`, `normalizeResumeData` |
| 草稿恢复/导入导出 | `src/app/create-resume-app.js` | `src/persistence/draft-store.js`, `src/core/config.js` | `initializeApp`, `exportData`, `handleImportFileChange`, `createDraftStore` |
| 头像上传/裁切 | `src/avatar/controller.js` | `src/avatar/avatar-utils.js`, `src/form/render.js`, `src/app/create-resume-app.js` | `createAvatarController`, `handleAvatarUpload`, `confirmAvatarCrop` |
| 浏览器自动化接口 | `src/app/public-api.js` | `src/app/index.js`, `src/app/create-resume-app.js` | `createResumeAppPublicApi`, `window.__resumeApp__` |
| `editor-next` 拖拽/模板/preset | `editor-next/src/ui/app.js` | `editor-next/src/ui/renderers.js`, `editor-next/src/core/document.js`, `editor-next/src/core/layout-ops.js`, `editor-next/src/core/presets.js` | `renderApp`, `createEditorDocument`, `moveBlock` |

## 3. 关键隐式契约（不要随便改）

### 根应用 DOM 契约

`index.html` 里的这些 id 被运行时代码直接依赖：

- `form-root`
- `resume-root`
- `form-status`
- `reset-data`
- `export-data`
- `import-data`
- `import-file`
- `print-pdf`

### 根应用表单协议

`src/form/render.js` 输出、`src/app/create-resume-app.js` 消费：

- `data-section`
- `data-field`
- `data-index`
- `data-multiline`
- `data-action`

如果你改了表单 DOM，通常要同时改 `render.js` 和 `create-resume-app.js`。

### 根应用预览协议

`src/preview/render.js:buildLayoutColumnBlocks()` 必须返回：

```js
{ leftBlocks: string[], rightBlocks: string[] }
```

分页和打印链路依赖这个 shape。

### 根应用存储协议

- localStorage key: `resume-generator-draft-v1`
- draft version: `2`
- avatar sentinel: `__resume-avatar-sidecar__`

这些值由 `src/core/config.js` 和 `src/persistence/draft-store.js` 共同定义；不要只改单边。

### 浏览器公开接口

`window.__resumeApp__` 当前由 `src/app/public-api.js` 暴露，改方法名/删除方法会影响自动化检查。

## 4. 高风险联动关系

这些地方不要只改一个文件：

1. **表单字段**
   - 改：`src/form/render.js`
   - 同时检查：`src/app/create-resume-app.js`

2. **版式/分页/打印**
   - 改：`src/preview/render.js`
   - 同时检查：`src/styles/main.css`, `src/app/create-resume-app.js`

3. **主题变量/布局控制**
   - 改：`src/core/resume-model.js` 或 `src/resume-layout-controls.js`
   - 同时检查：`src/styles/main.css`, `src/form/render.js`

4. **头像流程**
   - 改：`src/avatar/controller.js` 或 `src/avatar/avatar-utils.js`
   - 同时检查：`src/app/create-resume-app.js`, `src/form/render.js`, `src/persistence/draft-store.js`

5. **草稿与导入导出**
   - 改：`src/persistence/draft-store.js` 或 `src/app/create-resume-app.js`
   - 同时检查：`src/core/config.js`, `app-contracts.test.js`

## 5. 验证命令

### 根应用

```bash
node --test app-contracts.test.js resume-layout-controls.test.js resume-layout-spacing-scope.test.js
npm run build
```

### `editor-next/`

```bash
npm --prefix editor-next test
```

## 6. 文档读取顺序

给模型的推荐读取顺序：

1. `AGENTS.md`（先定范围和落点）
2. `CODEMAP.md`（看热点矩阵和具体文件）
3. `ARCHITECTURE.md`（只在需要理解运行时链路/隐式契约时再读）

`README.md` 主要是给人类的仓库入口说明，不是代码级导航真相源。
