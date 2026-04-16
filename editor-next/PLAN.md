# 约束式多版式编辑器重构计划

> 隔离约束：本计划对应的后续实现、原型、实验代码默认都只允许放在 `editor-next/` 目录下，不直接改动当前项目的 `src/`、`index.html`、现有版式实现或现有导出链路。只有在你后续明确批准集成时，才考虑把隔离工作区中的成果并入主项目。

## 1. Project Goal

把当前“左侧表单驱动 + 右侧预览”的简历生成器，升级成一个**约束式多版式编辑器**：

- 左侧主要负责样式、系统、布局预设与当前选中区块属性
- 预览区成为主编辑面，支持直接编辑内容
- 区块允许在规则约束下拖拽换位、跨允许区域移动、按档位缩放
- classic / cards / future layouts 都基于同一套编辑器内核，不再互相充当母版
- 保留当前 A4、flow-based、打印友好的分页模型

## 2. MVP Scope

### Included

- 新增 editor 内核概念：`content / style / layout`
- 给所有内容实体与渲染区块添加稳定 ID
- 建立 preset-driven 布局系统，首先支持 `cards` 与 `classic`
- 预览区支持选中区块、直接编辑核心文本
- cards 版支持受约束拖拽换位与尺寸档位切换
- 左侧收缩为样式 / 布局 / 当前选中区块 inspector
- 保留现有导入导出与打印链路

### First preset priority

- Phase 1 的交互实现优先围绕 `cards` preset 展开
- `classic` 先迁移到统一 schema，但不要求立即具备 cards 同级交互丰富度

## 3. Out of Scope

- 任意 x/y 自由摆放
- 元素重叠、旋转、绝对定位画布
- 像素级 resize
- 自定义 PDF 引擎
- 一期内重写为全新前端框架
- 复杂多人协作或版本历史

## 4. Core User Flows

### Flow A: 直接编辑内容
1. 用户点击预览区块
2. 区块进入选中态
3. 用户点击文本字段直接编辑
4. 失焦 / Enter 提交
5. 预览重排并分页

### Flow B: 调整版式
1. 用户选中区块
2. 左侧 inspector 展示当前 zone / 顺序 / 尺寸档位
3. 用户拖拽区块到合法槽位，或点击切换尺寸档位
4. 系统更新 `layout.blocks`
5. 重新渲染并重新分页

### Flow C: 调整风格
1. 用户在左侧修改主题、字号、留白、图标风格等
2. 系统更新 `style`
3. 所有 preset 在同一套 style state 下重渲染

## 5. Technical Approach

### 5.1 三层数据模型

```ts
type EditorDocument = {
  content: ResumeContent;
  style: ResumeStyle;
  layout: LayoutState;
};
```

- `content`: 简历内容本体
- `style`: 主题、字体、间距、图标等系统状态
- `layout`: preset、grid、zone、block placement

### 5.2 稳定 ID

所有内容实体和渲染区块必须具备稳定 ID。

示例：
- `edu_01`
- `exp_02`
- `proj_01`
- `block_profile`
- `block_summary`
- `block_skills`

### 5.3 preset-driven 架构

每个版式都通过 `LayoutPreset` 描述：

- 页面网格定义
- zones 分区
- block rules
- interaction policy

`cards` 与 `classic` 共用同一内核，不再分别在 `main.js` 里硬编码整套结构。

### 5.4 交互模型

- 选中：区块显示 outline / toolbar / handles
- 直编：点击文本进入编辑态，提交后写回 `content`
- 拖拽：只允许 block 级拖拽到合法 zone / slot
- 缩放：通过 `S/M/L` 或 `4列/8列` 等档位修改 `colSpan / rowSpan`，不做像素 resize

### 5.5 分页策略

继续沿用当前 flow-based pagination，不切换到自由画布分页。

要求：
- interaction UI 不参与测量高度
- layout 改变后重新测量分页
- cards/classic/future 统一走同一分页入口

## 6. Architecture / Module Breakdown

### Existing constraints

当前阻力主要来自：

- `src/main.js` 过于单体
- `renderForm()` / `renderResume()` 基本依赖 `innerHTML` 全量重绘
- `buildClassic...` 与 `buildCard...` 把结构和版式强耦合
- 预览 DOM 缺乏稳定 metadata，无法可靠承接直编/拖拽

### Target module shape

建议逐步引入这些模块（可以先在 `src/` 下逐步拆文件，而不是一次性大重构）：

1. `editor-document`：`resumeData -> EditorDocument` 适配
2. `layout-presets`：classic/cards/future 的 preset 定义
3. `block-registry`：blockType 到 renderer 的映射
4. `interaction-controller`：selection / inline edit / drag / resize
5. `layout-ops`：合法 zone 检查、排序、span clamping
6. `render-metadata`：给 DOM 注入 `data-block-id`、`data-zone-id`、`data-content-ref`

## 7. Milestones and Order of Work

### Phase 1 — Foundation

目标：建立可重构地基，不做激进 UX 变化。

交付：
- 自动化测试基线
- 稳定 ID
- `EditorDocument`
- cards/classic preset schema
- 预览 DOM metadata
- 仅支持 block selection foundation

### Phase 2 — Cards MVP Editor

目标：cards 版成为首个可用的约束式编辑版式。

交付：
- 预览直编
- cards 版受约束拖拽换位
- cards 版尺寸档位切换
- 左侧 inspector
- 打印一致性回归

### Phase 3 — Multi-preset Expansion

目标：把统一内核扩展到 classic，并为 future preset 留出稳定接入方式。

交付：
- classic 迁移到 preset 驱动
- future preset 接口稳定
- interaction/controller 抽象完成
- 更好的快捷键和交互提示

## 8. File-Level Change Plan

### `index.html`
- 保留 split shell
- 为左侧 inspector 与预览交互容器预留稳定挂点

### `src/main.js`
- 抽离 `resumeData -> EditorDocument`
- 让 classic/cards 不再直接写死结构，而是读 preset + block rules
- 把 `renderResume()` 改造成“schema -> blocks -> pages”管线
- 为 block 输出 metadata

### `src/styles/main.css`
- 新增 block selected / drag-over / resize-handle / inline-editing 状态样式
- 让 cards/classic 的视觉样式与交互态分离

### `src/resume-layout-controls.js`
- 重用为左侧 style/system/layout 控制来源
- 新增 selected-block inspector 所需配置项

### New files recommended
- `src/editor/document.js`
- `src/editor/layout-presets/cards.js`
- `src/editor/layout-presets/classic.js`
- `src/editor/layout-ops.js`
- `src/editor/block-registry.js`
- `src/editor/interaction-controller.js`
- `src/editor/preset-types.js`

## 9. Risks and Rollback Strategy

### Risks
1. 全量 rerender 导致选区/caret 丢失
2. 分页在拖拽/编辑后抖动
3. cards 版先做起来后，classic 迁移成本被低估
4. interaction 层和 style 层纠缠
5. import/export 与旧草稿兼容复杂

### Rollback strategy
- 每一阶段保持现有 classic/cards 可渲染
- 先通过 adapter 保留旧数据结构
- 任何阶段失败时，可退回“只有 metadata、没有直编/拖拽”版本

## 10. Validation Strategy

### 10.1 Test harness decision

Phase 1 必须先补测试底座，建议明确为：

- 纯逻辑测试：`node --test`
- 预览与交互验证：真实浏览器验证 + 可重复的 headless Edge 截图/PDF 校验
- 打印回归：浏览器 `--print-to-pdf` 产物比对

如果执行期决定引入浏览器自动化依赖，可在 Phase 1 明确加入 `@playwright/test`；若不引入，则至少保留基于 Edge headless 的脚本化验证路径。

### 10.2 Phase 1 QA scenarios

#### Task: 稳定 ID 注入
- Tools: `node --test`
- Steps:
  1. 对 `normalizeResumeData()` / adapter 层输入无 ID 的旧草稿
  2. 运行测试，断言 education / skills / experiences / projects 都获得稳定 ID
  3. 再次运行 adapter，断言已存在 ID 不被覆盖
- Pass criteria:
  - 所有内容实体拥有稳定 ID
  - 同一份输入重复运行不产生新 ID 漂移

#### Task: `resumeData -> EditorDocument` adapter
- Tools: `node --test`
- Steps:
  1. 输入 classic/cards 两种草稿数据
  2. 运行 adapter
  3. 断言输出包含 `content/style/layout`
  4. 断言 `layout.presetId`、zones、blocks 数量符合预期
- Pass criteria:
  - 输出结构稳定
  - cards/classic 都能映射到统一 schema

#### Task: preset schema 与约束规则
- Tools: `node --test`
- Steps:
  1. 对 `cards` / `classic` preset 执行 schema 校验
  2. 检查非法 zone、非法 span、非法 blockType
  3. 检查固定区块（如 profile）不能落入非法区域
- Pass criteria:
  - 非法配置抛错或返回 reject
  - 合法配置全部通过

#### Task: 预览 DOM metadata
- Tools: `node --test` + 真实浏览器手工检查
- Steps:
  1. 渲染 cards 页面
  2. 检查 block wrapper 是否输出 `data-block-id` / `data-zone-id` / `data-block-type`
  3. 手工确认点击区块不会破坏现有视觉
- Pass criteria:
  - 每个可交互区块都可被唯一定位
  - 视觉无回归

#### Task: 分页基线锁定
- Tools: `node --test`（如有测量适配） + headless Edge 截图/PDF
- Steps:
  1. 对默认 cards 示例数据输出屏幕截图与 PDF
  2. 记录第一页区块顺序与页数
  3. 对 classic 示例重复上述动作
- Pass criteria:
  - 生成稳定基线文件
  - 后续变更可对比页数、区块顺序和关键区域位置

### 10.3 Phase 2 QA scenarios (Cards MVP)

#### Task: 区块选中态
- Tools: 真实浏览器手工验证 + headless Edge 截图
- Steps:
  1. 打开 cards preset
  2. 点击 `summary`、`skills`、`projects`
  3. 检查选中 outline 和 inspector 状态是否同步
- Pass criteria:
  - 同一时刻仅一个区块为 selected
  - 左侧 inspector 显示正确 block ID / zone / 尺寸档位

#### Task: 预览直编提交
- Tools: 真实浏览器手工验证
- Steps:
  1. 点击姓名字段进入编辑态
  2. 修改文本并失焦
  3. 刷新页面或触发保存后重新打开
  4. 对 summary、education 一条记录、experience 一条 bullet 各重复一次
- Pass criteria:
  - 文本修改立即反映到预览
  - 保存后内容不丢失
  - 编辑过程中没有出现错误选区跳动到其他块

#### Task: cards 区块换位（同 zone）
- Tools: 真实浏览器手工验证 + 截图
- Steps:
  1. 在左侧 `education` 与 `skills` 之间执行拖拽换位
  2. 在右侧 `summary` 与 `projects`（若规则允许）之间执行换位
  3. 刷新页面后再次检查顺序
- Pass criteria:
  - 视觉顺序变化正确
  - `layout.blocks[].order` 持久化正确
  - 非目标区块未受影响

#### Task: cards 区块跨 zone 移动（仅允许项）
- Tools: 真实浏览器手工验证
- Steps:
  1. 将 `skills` 从 `cards.leftStack` 移动到 `cards.rightStream`
  2. 尝试将 `experiences` 拖到左侧
  3. 尝试将 `profile` 拖出 `leftProfile`
- Pass criteria:
  - 合法移动成功
  - 非法移动显示 reject，不改变最终状态

#### Task: cards 区块尺寸档位切换
- Tools: 真实浏览器手工验证 + 截图
- Steps:
  1. 选中 `summary`，把尺寸从 `S` 调到 `M`
  2. 选中 `skills`，切换不同档位
  3. 观察分页与相邻区块流动
- Pass criteria:
  - 档位变化影响视觉尺寸
  - 无重叠
  - 分页结果稳定且可解释

#### Task: cards 打印一致性回归
- Tools: headless Edge `--screenshot` + `--print-to-pdf`
- Steps:
  1. 在 cards preset 中完成一次内容编辑和一次换位
  2. 导出屏幕截图
  3. 导出 PDF
  4. 对比第一页区块顺序、标题、关键内容是否一致
- Pass criteria:
  - 屏幕预览与 PDF 中区块顺序一致
  - 标题、文本、样式没有明显分叉

### 10.4 Phase 3 QA scenarios (Multi-preset)

#### Task: classic 迁入 preset schema
- Tools: `node --test` + 真实浏览器手工检查
- Steps:
  1. 将 classic 渲染改为走统一 preset schema
  2. 用默认示例渲染 classic
  3. 对比迁移前后的第一页结构、页数、核心区块顺序
- Pass criteria:
  - classic 视觉无明显回归
  - 页数与主区块顺序保持稳定

#### Task: future preset 接口验证
- Tools: `node --test`
- Steps:
  1. 新建一个最小 future preset fixture
  2. 通过 schema 校验
  3. 渲染出最小可见页面
- Pass criteria:
  - 新 preset 不需要复制 builder 逻辑即可接入

#### Task: 键盘与高级交互回归
- Tools: 真实浏览器手工验证
- Steps:
  1. 选中区块
  2. 使用键盘执行 move/resize shortcut（如果该阶段上线）
  3. 检查 focus、selection、分页是否异常
- Pass criteria:
  - 快捷操作结果与鼠标操作一致
  - 不破坏输入和焦点管理

## 11. Acceptance Criteria

### MVP acceptance
- 左侧主要负责样式和系统控制
- 预览区可直接编辑核心内容
- cards 版区块可在规则范围内换位和缩放
- 无任意 x/y 自由摆放
- 打印分页不被破坏

### Architecture acceptance
- `cards` 与 `classic` 都可由 preset schema 描述
- 所有可编辑/可移动区块具备稳定 ID
- 新版式可通过新增 preset 接入，而不是复制一套 builder

## 12. Open Questions and Assumptions

### Assumptions
1. Phase 2 的交互 MVP 以 cards 版优先
2. 区块增删在 MVP 可继续部分依赖左侧 controls
3. `contenteditable` 不作为第一阶段的完整方案，优先采用受控 inline edit 模式
4. `rowSpan` 表示视觉档位/最小高度，不等于绝对固定高度

### Open questions
1. classic 在 Phase 2 是否只迁 schema，不立即开放同等交互？
2. skills / education 是否允许在 cards 中迁入右侧主区作为大卡？
3. future preset 第一类想优先支持什么风格？单栏极简、杂志风，还是时间轴？

## 13. Approval Status

- Planning status: ready for review
- Execution status: not started
- Requires explicit approval before implementation

## 14. File-Level Execution Sequence (Phase 1 First)

### Phase 1 objective

只建立 editor 内核地基，不上线拖拽，不把 cards/classic 的可见结构一次性推翻。

### Step 1 — 建测试底座

#### Files
- `package.json`
- `src/main.js`
- `tests/`（新建）

#### Work
- 增加 `node --test` 可执行入口
- 为 normalization、schema、adapter 预留测试目录
- 抽出当前可以纯函数化验证的逻辑入口

#### Expected output
- 可以独立运行逻辑测试
- 不依赖浏览器也能验证核心 schema/adapter

### Step 2 — 稳定 ID 注入

#### Files
- `src/main.js`
- `src/editor/document.js`（新建）

#### Work
- 给 `basicInfo`、`education`、`skills`、`experiences`、`projects` 增加稳定 ID 生成/保留逻辑
- 旧草稿无 ID 时自动补齐
- 已有 ID 时保持不变

#### Expected output
- 所有内容实体可被稳定引用
- 为后续 block selection / inline edit / drag 提供基础索引

### Step 3 — 引入 `EditorDocument` adapter

#### Files
- `src/editor/document.js`（新建）
- `src/main.js`

#### Work
- 定义 `content / style / layout`
- 写 `resumeData -> EditorDocument`
- cards/classic 先都能映射进统一结构

#### Expected output
- 现有渲染仍可工作
- 内部开始脱离直接依赖旧 `resumeData` 的模板耦合

### Step 4 — 定义 preset schema

#### Files
- `src/editor/preset-types.js`（新建）
- `src/editor/layout-presets/cards.js`（新建）
- `src/editor/layout-presets/classic.js`（新建）
- `src/editor/layout-ops.js`（新建）

#### Work
- 定义 `LayoutPreset`、`ZoneRule`、`BlockRule`
- 先完整落 `cards` preset
- `classic` 先最小映射到相同 schema
- 实现 allowed zones / span clamping / fixed block 规则

#### Expected output
- cards/classic 都能用 preset 描述
- 新版式接入路径清晰

### Step 5 — 给预览区块注入 metadata

#### Files
- `src/main.js`
- `src/styles/main.css`

#### Work
- 在所有主要 block wrapper 上加：
  - `data-block-id`
  - `data-zone-id`
  - `data-block-type`
  - `data-content-ref`
- 增加 selected / hover 的基础样式占位

#### Expected output
- 预览里的每个区块可被唯一识别和选中
- 但仍不启用拖拽/直编

### Step 6 — 建立 selection foundation

#### Files
- `src/main.js`
- `src/resume-layout-controls.js`
- `src/styles/main.css`

#### Work
- 增加当前选中 block state
- 点击预览区块时，高亮并同步左侧 inspector 占位信息
- 左侧显示 block type / zone / order / size tier（只读即可）

#### Expected output
- 用户第一次能“选中预览区块”
- 这是 Phase 2 直编和拖拽的起点

## 15. Phase 1 Atomic Commit Plan

1. `test(core): add node test harness for editor foundation`
2. `feat(core): add stable ids for resume content entities`
3. `feat(core): add editor document adapter`
4. `feat(layout): add cards and classic preset schemas`
5. `refactor(renderer): add block metadata attributes to preview output`
6. `feat(editor): add preview block selection foundation`

## 16. Approval Request

推荐执行范围：**只启动 Phase 1**。

这意味着：
- 会开始重构地基
- 不会在第一阶段直接做完整拖拽
- 不会立即推倒 classic/cards 已有可视效果
- 会优先为 cards/future 的 editor 内核做准备

执行批准口令示例：
- `批准执行`
- `Start work`
- `Approve Phase 1`
