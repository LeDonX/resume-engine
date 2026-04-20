# resume-engine

这个仓库有两个工作区，请分开理解：

- 根目录主应用：在线简历编辑器，入口链是 `index.html -> src/main.js -> src/app/index.js`
- `editor-next/`：独立原型，用来验证下一代约束式编辑器，不接入根应用构建

## 先从哪里读

- 如果你是大模型 / 自动化 coding agent：先看 [`AGENTS.md`](./AGENTS.md)
- 想快速定位代码：再看 [`CODEMAP.md`](./CODEMAP.md)
- 想理解根应用模块边界：看 [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- 想进入独立原型：看 [`editor-next/README.md`](./editor-next/README.md)

## 根目录主应用

- 入口：`index.html`
- 启动薄层：`src/main.js`
- 应用编排：`src/app/create-resume-app.js`
- 表单渲染：`src/form/render.js`
- 预览与分页：`src/preview/render.js`
- 草稿持久化：`src/persistence/draft-store.js`
- 头像流程：`src/avatar/controller.js`
- 数据与主题：`src/core/config.js`、`src/core/resume-model.js`
- 全局样式：`src/styles/main.css`

主应用支持实时编辑、A4 分页打印、JSON 导入导出、本地草稿恢复、头像上传裁切，以及多版式切换。

## 常用命令

### 根目录主应用

```bash
npm install
npm run dev
npm run build
npm run preview
npm run preview:cloudflare
```

### 根目录测试

根目录 `package.json` 没有 `npm test` 脚本，但仓库里有自动化测试文件：

```bash
node --test app-contracts.test.js resume-layout-controls.test.js resume-layout-spacing-scope.test.js
```

### `editor-next/`

```bash
npm --prefix editor-next test
npm --prefix editor-next run serve
```

## 构建与部署入口

- Vite：`vite.config.js`
- Tailwind：`tailwind.config.js`
- PostCSS：`postcss.config.js`
- Cloudflare Pages：`wrangler.jsonc`
- 构建输出：`dist-static/`

## 当前测试面

- 根目录：`app-contracts.test.js`、`resume-layout-controls.test.js`
- `editor-next/`：`tests/*.test.js`

如果你准备改运行时代码，不要先从旧印象里的单体 `src/main.js` 开始。现在它只负责启动，真正的逻辑已经拆到 `src/app`、`src/core`、`src/form`、`src/preview`、`src/avatar`、`src/persistence`。
