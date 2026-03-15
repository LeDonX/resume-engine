# resume-engine

一个基于 **Vite + Vanilla JavaScript + Tailwind CSS** 的在线简历编辑器，支持实时预览、A4 自动分页、JSON 导入导出、头像上传裁切，以及通过浏览器打印导出 PDF。

## 功能特性

- **所见即所得编辑**：左侧表单编辑，右侧实时预览。
- **A4 自动分页**：会按内容高度自动拆分页，适合直接打印或导出 PDF。
- **JSON 导入 / 导出**：可将简历数据保存为 JSON，也可再次导入继续编辑。
- **本地草稿自动保存**：草稿保存在浏览器 `localStorage`，刷新页面后可继续编辑。
- **头像上传与裁切**：支持 PNG / JPG / JPEG / WEBP，带交互式裁切面板。
- **主题与信息样式配置**：支持多套主题、图标色板、信息区图标样式。
- **基本信息拖拽排序**：通过 SortableJS 调整基础信息显示顺序。

## 技术栈

- **构建工具**：Vite 5
- **前端实现**：Vanilla JavaScript（无框架）
- **样式系统**：Tailwind CSS + 自定义 CSS
- **交互依赖**：SortableJS、Font Awesome、Noto Sans SC
- **部署目标**：Cloudflare Pages

## 环境要求

- Node.js **20+**
- npm

## 快速开始

```bash
npm install
npm run dev
```

启动后使用浏览器访问 Vite 提供的本地地址即可。

## 可用脚本

```bash
npm run dev
npm run build
npm run preview
npm run preview:cloudflare
npm run deploy:cloudflare
```

### 脚本说明

- `npm run dev`：启动本地开发服务器
- `npm run build`：构建静态产物到 `dist-static/`
- `npm run preview`：本地预览构建结果
- `npm run preview:cloudflare`：使用 Wrangler 在本地预览 Cloudflare Pages 输出
- `npm run deploy:cloudflare`：构建并发布到 Cloudflare Pages

## 项目结构

```text
resume-engine/
├─ src/
│  ├─ main.js              # 应用主逻辑：状态、渲染、导入导出、分页、打印
│  └─ styles/main.css      # 全局样式、编辑器布局、打印与头像裁切样式
├─ docs/
│  └─ cloudflare-deployment.md
├─ tests/
│  └─ fixtures/            # 手动验证用的 JSON / 图片样例
├─ dist-static/            # 构建输出目录
├─ index.html              # 主页面入口
├─ vite.config.js          # Vite 构建配置
├─ tailwind.config.js      # Tailwind 扫描与 safelist 配置
├─ postcss.config.js       # PostCSS 配置
├─ wrangler.jsonc          # Cloudflare Pages 配置
└─ package.json
```

## 数据说明

应用内部使用 JSON 作为简历数据格式，核心字段包括：

- `documentTitle`
- `resumeTheme`
- `profileImage`
- `avatarFrame`
- `name`
- `role`
- `summary`
- `basicInfo`
- `education`
- `skills`
- `experiences`
- `projects`

可以参考示例数据：

- `tests/fixtures/new-schema-sample.json`

## 本地草稿

- 草稿会自动保存到浏览器 `localStorage`
- 当前存储 key：`resume-generator-draft-v1`
- 如需恢复到示例数据，可使用界面中的“重置”按钮

## 导出 PDF

界面右上角提供“**生成 PDF**”按钮，本质上是触发浏览器打印流程：

1. 先重新渲染分页
2. 调用 `window.print()`
3. 使用浏览器的“另存为 PDF”导出

建议优先使用 Chrome / Edge，以获得更稳定的 A4 打印结果。

## Cloudflare Pages 部署

项目已配置 Cloudflare Pages：

- 构建输出目录：`dist-static/`
- Pages 配置文件：`wrangler.jsonc`

详细说明见：

- `docs/cloudflare-deployment.md`

## 测试与验证

当前仓库**没有配置自动化测试脚本**，`tests/fixtures/` 主要用于手动验证：

- JSON 导入结构
- 头像文件类型与边界情况

建议在修改核心逻辑后至少执行：

```bash
npm run build
```

## 适用场景

- 快速生成中文求职简历
- 维护可重复导入的简历 JSON 数据
- 自定义主题风格并导出 PDF
- 部署为静态站点，随时在线编辑和预览
