# editor-next

`editor-next/` 是独立原型工作区，不是根应用里的一个子模块。

它当前已经有自己的入口、源码、测试和本地服务：

- 页面入口：`index.html`
- 本地静态服务：`server.js`
- 源码目录：`src/`
- 测试目录：`tests/`
- 原型依赖与脚本：`package.json`

## 隔离约束

1. 与新编辑器原型相关的代码默认都留在 `editor-next/` 内。
2. 根目录主应用仍按自己的入口链运行，不自动读取这里的代码。
3. 根目录 Vite 构建和 Cloudflare Pages 配置不打包 `editor-next/`。
4. 如果未来要把这里的成果接回主应用，需要单独做集成决策，不在这里隐式完成。

## 入口链

```text
editor-next/index.html
  -> ./src/ui/app.js
    -> readPersistedEditorState(...)
    -> createEditorDocument(...)
    -> renderApp()
      -> renderPreview(...)
      -> mountSortables(...)
```

本地运行时由 `server.js` 提供静态文件服务，默认地址是 `http://127.0.0.1:4173`。

## 目录导航

| Path | Purpose |
| --- | --- |
| `index.html` | 原型页面入口，加载 `src/ui/styles.css` 和 `src/ui/app.js` |
| `server.js` | 原型本地静态服务，只服务 `editor-next/` 目录内文件 |
| `src/ui/app.js` | 原型主编排层，维护 session state、直编状态、拖拽状态、持久化回写 |
| `src/ui/renderers.js` | 预览 DOM 渲染器，负责 block 工具条、可编辑字段、预览块输出 |
| `src/ui/sortable-controller.js` | Sortable 相关拖拽合法性判断和 move plan 生成 |
| `src/ui/styles.css` | 原型 UI 与预览样式 |
| `src/core/document.js` | 统一文档模型、edit path 读写、preset / template 激活、layout 存储形态 |
| `src/core/layout-ops.js` | block 移动、尺寸切换、zone 排序与合法性约束 |
| `src/core/persistence.js` | 原型持久化协议、localStorage 读写、坏数据恢复 |
| `src/core/presets.js` | preset registry、preset/template 查询入口 |
| `src/core/preset-types.js` | preset schema 校验 |
| `src/core/ids.js` | 实体 id 与 highlight id 归一化 |
| `src/presets/cards.js` | `cards` preset 和两个 layout template 定义 |
| `src/presets/classic.js` | `classic` preset 和默认 template 定义 |
| `src/sample-document.js` | 原型默认 seed 文档 |
| `tests/adapter.test.js` | preset schema、block 移动、尺寸约束测试 |
| `tests/document.test.js` | 文档模型、preset/template 切换、edit path、layout 持久测试 |
| `tests/ids.test.js` | 实体 id 归一化测试 |
| `tests/persistence.test.js` | localStorage 持久化与恢复测试 |
| `tests/sortable-controller.test.js` | 拖拽合法性与 move plan 测试 |

## 当前原型关注点

- 统一文档模型：`createEditorDocument()`
- 多 preset / 多 template 切换：`activateDocumentPreset()`、`activateDocumentTemplate()`
- 受约束 block 移动与尺寸档位：`moveBlock()`、`resizeBlock()`
- 预览内直编：`readEditPathValue()`、`updateDocumentContent()`
- 原型持久化：`readPersistedEditorState()`、`writePersistedEditorState()`

## 常用命令

在 `editor-next/` 目录下运行：

```bash
npm install
npm test
npm run serve
```

如果你从仓库根目录执行，可以用：

```bash
npm --prefix editor-next test
npm --prefix editor-next run serve
```

## 和根应用的关系

- 根应用是当前可运行的简历编辑器
- `editor-next/` 是独立原型，用来验证统一文档模型、preset 模板、拖拽约束和直编体验
- 两边都在同一个仓库里，但不是同一个运行时，也不是同一个构建产物
