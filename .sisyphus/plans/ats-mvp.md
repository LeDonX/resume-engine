# ATS MVP：基本信息模块重构与交互增强

## TL;DR
> **Summary**: 在不破坏当前分页预览与 PDF 导出的前提下，将“联系方式”升级为“基本信息”模块，补齐可视化图标选择、拖拽排序、空项自动隐藏与一致化视觉。
> **Deliverables**:
> - 基本信息固定字段模型（手机/邮箱/期望薪资/出生年月/学历）
> - 预设图标选择器 + 高级自定义图标
> - 拖拽排序（手柄触发）+ 键盘可达上下移动兜底
> - 预览空项隐藏与图标圆形一致化
> - 分页/打印回归验证方案
> **Effort**: Medium
> **Parallel**: YES - 3 waves
> **Critical Path**: T1 数据契约 → T2 表单渲染 → T3 事件与排序 → T4 预览渲染 → T5 分页/打印回归

## Context
### Original Request
- 用户要求将“联系方式”改为“基本信息”，并指定固定字段：手机、邮箱、期望薪资、出生年月、学历。
- 图标必须可视化选择（非手输代码），但保留高级自定义入口。
- 需要拖拽排序。
- 预览自动隐藏空值项。
- 图标视觉统一为圆形容器风格。
- 旧 `contacts` 结构无需兼容。
- 最终计划输出必须包含：范围边界、技术方案、里程碑、文件级改动计划、风险与回滚策略、验收标准。

### Interview Summary
- 已确认不做类型自动识别映射，仅做“图标选择 + 内容输入 + 可选链接”。
- 已确认需要拖拽排序，同时保留非拖拽操作路径（可访问性兜底）。
- 已确认空值预览隐藏是期望行为。

### Metis Review (gaps addressed)
- Guardrail 1：仅改 `basicInfo` 链路，避免改动分页核心算法。
- Guardrail 2：排序后以 `resumeData.basicInfo` 为唯一真源，立即 `renderAll + saveDraft`。
- Guardrail 3：图标自定义失效时回退到默认图标，避免预览空白。
- Guardrail 4：空值隐藏仅影响预览，不删除表单数据。

## 范围边界（做什么/不做什么）
### 做什么（IN）
- 将“联系方式”文案和数据语义统一升级为“基本信息”。
- 固定初始化 5 项字段并支持拖拽排序。
- 提供预设图标可视化选择和高级自定义图标入口。
- 预览隐藏空值项；当全部为空时隐藏整段基本信息区块。
- 保持图标容器为统一圆形样式。
- 确保分页预览和打印导出路径不回归。

### 不做什么（OUT）
- 不扩展 ATS 打分、关键词建议、后端存储。
- 不重构教育/技能/工作/项目模块数据结构。
- 不引入多模板切换。
- 不兼容旧 `contacts` 数据导入。

## 技术方案
### 方案总览
- **数据层**：新增 `basicInfo` 结构，字段为 `id/label/value/url/iconPreset/iconMode/customIcon`。
- **渲染层**：左侧表单新增“基本信息卡片列表”，每卡包含拖拽手柄、上下移动按钮、内容输入、链接输入、图标选择器。
- **交互层**：
  - 图标选择：默认预设网格；高级模式输入 Font Awesome 类。
  - 排序：`SortableJS` handle-only 拖拽；键盘/无拖拽环境用上移下移按钮。
- **预览层**：`renderBasicInfo` 先过滤空值，再按顺序渲染统一圆形图标行。
- **稳定性层**：复用现有 `renderResume`、`rerenderResumeNow` 与分页流程，不改分页核心函数。

### 关键实现决策
- 数据真源：仅 `resumeData.basicInfo`。
- 排序持久化：拖拽结束或按钮移动后，立即 `renderAll()` 与 `saveDraft()`。
- 自定义图标回退：自定义类为空或非法时，回退到 preset 图标。
- 空项策略：仅预览隐藏，不动表单值。

### 默认规则（已应用）
- `期望薪资`、`出生年月`、`学历`按自由文本处理，不做格式或枚举强约束。
- 基本信息所有项都保留“可选链接”输入；链接为空时按普通文本渲染。
- 若高级自定义图标无效，回退到该项预设图标；若预设缺失则回退 `fas fa-circle`。

## 里程碑
- **M1 数据与文案基线**：完成 `basicInfo` 模型、normalize 逻辑、文案替换。
- **M2 交互完善**：完成图标选择器（预设+高级）与排序能力（拖拽+上下移动）。
- **M3 预览一致性**：完成空项隐藏与圆形图标统一。
- **M4 稳定性验收**：完成分页/打印/导入导出回归验证并收敛风险。

## 文件级改动计划
- **文件**：`简历.html`
  - 数据模型与归一化：`简历.html:287`, `简历.html:372`, `简历.html:506`
  - 基本信息表单渲染：`简历.html:655`, `简历.html:891`
  - 图标解析与预览渲染：`简历.html:404`, `简历.html:904`, `简历.html:1021`
  - 拖拽排序与动作路由：`简历.html:12`, `简历.html:593`, `简历.html:1287`, `简历.html:1374`
  - 分页与打印回归挂点：`简历.html:1024`, `简历.html:1105`, `简历.html:1149`, `简历.html:1284`

## Execution Strategy
### Parallel Execution Waves
Wave 1（数据与基础渲染）: T1, T2  
Wave 2（交互能力）: T3, T4  
Wave 3（预览与稳定性）: T5, T6, T7

### Dependency Matrix
- T1 blocks: T2/T3/T4/T5
- T2 blocks: T3/T4/T5
- T3 blocks: T6
- T4 blocks: T6
- T5 blocks: T6
- T6 blocks: T7
- T7 blocks: Final Verification

## TODOs
> Implementation + Test = ONE task. Every task includes executable acceptance + QA.

- [x] 1. 数据契约重构：`contacts` → `basicInfo`

  **What to do**: 定义并固定 `basicInfo` 默认 5 项（手机/邮箱/期望薪资/出生年月/学历）；在 `sampleResumeData` 与 `normalizeResumeData` 中只保留 `basicInfo` 语义；补齐缺失项但不重排用户已有顺序。  
  **Must NOT do**: 不实现旧 `contacts` 兼容迁移；不增加非确认字段。

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: 单文件、结构化改动明确
  - Skills: `[]` — 本任务不依赖额外技能
  - Omitted: `git-master` — 不涉及历史检索

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: 2,3,4,5,6 | Blocked By: none

  **References**:
  - Pattern: `简历.html:287` — 数据常量定义区
  - Pattern: `简历.html:372` — normalize 入口与字段兜底
  - API/Type: `简历.html:506` — 归一化输出对象结构

  **Acceptance Criteria**:
  - [x] `resumeData` 中存在 `basicInfo` 且包含 5 个默认项
  - [x] 导入缺字段 JSON 时，`basicInfo` 自动补齐默认项
  - [x] 代码中不再存在 `contacts` 业务逻辑路径

  **QA Scenarios**:
  ```
  Scenario: 基础模型可用
    Tool: Bash
    Steps: rg "basicInfo|contacts" "简历.html"
    Expected: 命中 basicInfo 实现；contacts 仅允许 0 个业务引用
    Evidence: .sisyphus/evidence/task-1-schema-rg.txt

  Scenario: 缺字段导入兜底
    Tool: Playwright
    Steps: 导入仅含姓名和岗位的 JSON -> 查看基本信息编辑区
    Expected: 仍渲染 5 项基本信息卡片
    Evidence: .sisyphus/evidence/task-1-schema-import.png
  ```

  **Commit**: YES | Message: `refactor(resume): replace contacts schema with basic-info contract` | Files: `简历.html`

- [x] 2. 表单区重命名与固定字段编辑卡片

  **What to do**: 将“联系方式”改为“基本信息”；渲染 5 项卡片，包含标签、内容输入、可选链接、拖拽手柄、上下移动按钮。  
  **Must NOT do**: 不提供新增/删除基本信息项；不改变其它模块 UI。

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: 表单结构和交互控件布局
  - Skills: `[]`
  - Omitted: `frontend-ui-ux` — 当前视觉需严格贴合既有风格，不做风格重设计

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: 3,4 | Blocked By: 1

  **References**:
  - Pattern: `简历.html:655` — 基本信息表单渲染函数
  - Pattern: `简历.html:891` — 表单总装配顺序
  - Pattern: `简历.html:257` — 左侧面板布局约束

  **Acceptance Criteria**:
  - [x] 左侧显示“基本信息”标题，且仅 5 项
  - [x] 每项都有内容输入与链接输入
  - [x] 每项都有拖拽手柄与上下移动按钮

  **QA Scenarios**:
  ```
  Scenario: 基本信息表单结构
    Tool: Playwright
    Steps: 打开页面 -> 统计 #basic-info-list .basic-info-item 数量
    Expected: 数量=5，且标题文本为“基本信息”
    Evidence: .sisyphus/evidence/task-2-form-structure.json

  Scenario: 非目标区块不受影响
    Tool: Playwright
    Steps: 检查“教育背景/工作经历/项目经验”区块仍存在
    Expected: 3 个区块标题均可见
    Evidence: .sisyphus/evidence/task-2-form-regression.png
  ```

  **Commit**: YES | Message: `feat(form): render fixed basic-info cards with reorder controls` | Files: `简历.html`

- [x] 3. 图标选择器：预设可视化 + 高级自定义

  **What to do**: 提供预设图标网格选择；保留高级模式输入 Font Awesome 类名；图标选择后立即反映到表单预览。  
  **Must NOT do**: 不要求用户默认输入图标 class；不引入额外 UI 框架。

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: 需要可视化交互控件
  - Skills: `[]`
  - Omitted: `playwright` — 实现阶段不绑定自动化框架

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 5 | Blocked By: 2

  **References**:
  - Pattern: `简历.html:287` — 预设图标常量
  - Pattern: `简历.html:404` — 图标解析与回退逻辑
  - Pattern: `简历.html:1374` — action 路由扩展点

  **Acceptance Criteria**:
  - [x] 每项可打开图标选择器并选中预设图标
  - [x] 高级模式可输入 class 并实时生效
  - [x] 自定义值为空时回退预设图标

  **QA Scenarios**:
  ```
  Scenario: 预设图标选择
    Tool: Playwright
    Steps: 打开第2项选择器 -> 选择 location 图标
    Expected: 预览区对应项图标 class 包含 fa-location-dot
    Evidence: .sisyphus/evidence/task-3-icon-preset.json

  Scenario: 高级自定义回退
    Tool: Playwright
    Steps: 切到高级自定义 -> 清空 customIcon
    Expected: 图标回退到该项 preset 图标，不出现空白
    Evidence: .sisyphus/evidence/task-3-icon-fallback.png
  ```

  **Commit**: YES | Message: `feat(icon): add visual picker with advanced custom override` | Files: `简历.html`

- [x] 4. 排序能力：拖拽手柄优先 + 键盘可达兜底

  **What to do**: 初始化 `Sortable`（handle-only）；支持拖拽排序；保留上移/下移按钮作为键盘和无拖拽环境兜底。  
  **Must NOT do**: 不允许整卡可拖（避免输入框冲突）；不在拖拽过程中频繁全量 rerender。

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: 交互状态与数据一致性敏感
  - Skills: `[]`
  - Omitted: `artistry` — 需求为常规交互，不需非常规路径

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 6 | Blocked By: 2

  **References**:
  - External: `https://github.com/SortableJS/Sortable/blob/031649b8116565e02419e8aa2d252d7d8c82b9da/README.md#L377-L397` — handle-only 推荐
  - Pattern: `简历.html:12` — Sortable 依赖入口
  - Pattern: `简历.html:593` — `moveItem` 数组重排工具
  - Pattern: `简历.html:1287` — sortable 初始化位置

  **Acceptance Criteria**:
  - [x] 拖拽后顺序变化立即反映到预览
  - [x] 上移/下移按钮可达且顺序正确
  - [x] 排序后刷新页面顺序仍保留（localStorage 草稿）

  **QA Scenarios**:
  ```
  Scenario: 拖拽排序生效
    Tool: Playwright
    Steps: 拖拽第5项到第1项
    Expected: 预览第1项文本变为原第5项文本
    Evidence: .sisyphus/evidence/task-4-dnd-order.json

  Scenario: 键盘兜底路径
    Tool: Playwright
    Steps: 点击第1项“下移”按钮两次
    Expected: 第1项内容在预览中顺位后移两位
    Evidence: .sisyphus/evidence/task-4-button-order.png
  ```

  **Commit**: YES | Message: `feat(order): enable handle-drag sorting with button fallback` | Files: `简历.html`

- [x] 5. 预览渲染：空值自动隐藏 + 统一圆形图标

  **What to do**: 在 `renderBasicInfo` 过滤空 `value`；全部为空时返回空字符串并在左栏不渲染整个“基本信息”区块；图标容器保持统一圆形样式。  
  **Must NOT do**: 不删除表单中的空值输入；不更改整体简历模板色彩与排版。

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: 纯渲染逻辑收敛
  - Skills: `[]`
  - Omitted: `oracle` — 逻辑简单且已有实现先例

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: 6,7 | Blocked By: 3,4

  **References**:
  - Pattern: `简历.html:904` — 基本信息预览渲染
  - Pattern: `简历.html:1021` — 左栏区块组装
  - Pattern: `简历.html:918` — 图标容器视觉规范（圆形）

  **Acceptance Criteria**:
  - [x] 清空某项 `value` 后，预览对应项立即隐藏
  - [x] 清空全部 5 项后，左栏不显示"基本信息"区块
  - [x] 可见项图标容器均保持 `w-8 h-8 rounded-full`

  **QA Scenarios**:
  ```
  Scenario: 单项空值隐藏
    Tool: Playwright
    Steps: 清空第1项内容
    Expected: 预览列表项数量减少 1
    Evidence: .sisyphus/evidence/task-5-hide-one.json

  Scenario: 全空整段隐藏
    Tool: Playwright
    Steps: 清空 5 项内容
    Expected: 左栏无“基本信息”标题
    Evidence: .sisyphus/evidence/task-5-hide-all.png
  ```

  **Commit**: YES | Message: `feat(preview): hide empty basic-info items and section` | Files: `简历.html`

- [x] 6. 事件总线与持久化一致性收口

  **What to do**: 扩展 `handleAction` 与 `applyFieldUpdate` 以覆盖 `basicInfo` 全路径；关闭选择器时机一致；每次变更都触发 `render` + `saveDraft`。  
  **Must NOT do**: 不引入重复状态源；不绕开既有 `renderAll/renderResume` 路径。

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: 全链路状态一致性
  - Skills: `[]`
  - Omitted: `deep` — 不涉及跨模块复杂建模

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: 7 | Blocked By: 3,4,5

  **References**:
  - Pattern: `简历.html:1157` — 字段更新入口
  - Pattern: `简历.html:1374` — action 分发入口
  - Pattern: `简历.html:1248` — JSON 导入导出路径

  **Acceptance Criteria**:
  - [x] 输入、模式切换、图标选择、排序均能持久化到草稿
  - [x] 页面刷新后状态恢复与刷新前一致
  - [x] 无控制台 runtime error

  **QA Scenarios**:
  ```
  Scenario: 状态持久化
    Tool: Playwright
    Steps: 修改第3项文本+图标+顺序 -> 刷新页面
    Expected: 三项变更均保留
    Evidence: .sisyphus/evidence/task-6-persist.json

  Scenario: 导入异常容错
    Tool: Playwright
    Steps: 导入非法 JSON
    Expected: 显示导入失败状态，页面不崩溃
    Evidence: .sisyphus/evidence/task-6-import-error.png
  ```

  **Commit**: YES | Message: `fix(state): unify basic-info actions with draft persistence` | Files: `简历.html`

- [x] 7. 分页与打印回归验证（零功能扩展）

  **What to do**: 在不改分页核心算法前提下，验证基本信息改动不会引入分页错位、截断或打印异常；保留打印前强制重算。  
  **Must NOT do**: 不重写 `paginateColumnBlocks`。

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: 回归影响面较广
  - Skills: `[]`
  - Omitted: `quick` — 需要系统性回归而非单点检查

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: Final Verification | Blocked By: 5,6

  **References**:
  - Pattern: `简历.html:1024` — 分页算法
  - Pattern: `简历.html:1105` — 预览渲染入口
  - Pattern: `简历.html:1149` — 打印前强制重算
  - Pattern: `简历.html:1284` — 打印按钮行为

  **Acceptance Criteria**:
  - [x] 多页内容可见，分割提示正常显示
  - [x] 点击"生成 PDF"前会触发重算流程
  - [x] 控制台无分页相关 runtime error

  **QA Scenarios**:
  ```
  Scenario: 长内容分页稳定
    Tool: Playwright
    Steps: 构造超长工作经历 + 检查 .resume-page 数量
    Expected: 页数>1，末页内容可见
    Evidence: .sisyphus/evidence/task-7-pagination.json

  Scenario: 打印触发链路
    Tool: Playwright
    Steps: mock window.print -> 点击“生成 PDF”
    Expected: print 被调用且无异常
    Evidence: .sisyphus/evidence/task-7-print-call.json
  ```

  **Commit**: YES | Message: `test(regression): verify pagination and print with basic-info updates` | Files: `简历.html`

## 风险与回滚策略
- **风险 R1：排序后索引错位** → 回滚策略：禁用拖拽，仅保留上下移动按钮路径；保留 `moveItem`。
- **风险 R2：图标自定义导致空白** → 回滚策略：统一回退 `fas fa-circle`。
- **风险 R3：空值隐藏被误解为丢数据** → 回滚策略：增加状态提示文案“仅隐藏预览，不删除输入”。
- **风险 R4：分页抖动** → 回滚策略：仅保留 `renderResume` 调用，不改 `paginateColumnBlocks` 算法。
- **风险 R5：外部 CDN 依赖失效** → 回滚策略：临时降级为上下移动排序（禁用 Sortable 初始化）。

## Final Verification Wave (4 parallel agents, ALL must APPROVE)
- [x] F1. Plan Compliance Audit — oracle
- [x] F2. Code Quality Review — unspecified-high
- [x] F3. Real Manual QA — unspecified-high (+ playwright if UI)
- [x] F4. Scope Fidelity Check — deep

### Gate Status Notes
- F1 当前结论为 **REJECT**（阻塞）：`normalizeBasicInfoList` 未严格白名单 5 个 preset id，且 `resolveBasicInfoIcon` 未覆盖“非空但无效 custom class”回退。
- 关闭 F1 的最小修复：
  1) 导入归一化仅允许 5 个预设 id，并保证最终输出严格 5 项。  
  2) 自定义图标增加 class 有效性判断，非法时回退 preset。  
  3) 补充两条证据：unknown-id 导入、invalid-custom-icon 回退。

## F1 修复子计划（补充波次）

- [x] R1. `normalizeBasicInfoList` 白名单收敛（仅 5 个 preset id）

  **What to do**: 在 `简历.html:372` 的归一化流程中，只接收 `BASIC_INFO_PRESETS` 定义的 id；丢弃 unknown id；最终输出严格 5 项。保留“已知 id 的用户排序”，缺失项按 preset 顺序补齐。  
  **Must NOT do**: 不新增字段；不改动 `basicInfo` 之外的数据链路。

  **Acceptance Criteria**:
  - [x] 导入包含 unknown id 的 JSON 后，`resumeData.basicInfo` 只含 5 个允许 id
  - [x] 允许 id 的用户顺序可保留；缺失项被自动补齐

  **QA Scenarios**:
  ```
  Scenario: unknown id 导入过滤
    Tool: Playwright
    Steps: 导入包含 {id:"foo"} 的 basicInfo JSON -> 读取预览与导出 JSON
    Expected: foo 不出现；仅 5 个 preset id
    Evidence: .sisyphus/evidence/f1-r1-unknown-id-filter.json

  Scenario: 缺失项补齐与顺序保持
    Tool: Playwright
    Steps: 导入仅含 3 个合法 id 且人为调序 -> 刷新
    Expected: 前 3 项顺序保持；其余 2 项按 preset 追加
    Evidence: .sisyphus/evidence/f1-r1-order-and-fill.json
  ```

- [x] R2. `resolveBasicInfoIcon` 无效 custom class 回退

  **What to do**: 在 `简历.html:406` 增加 custom class 有效性判断（最小规则：`fa` 前缀 + 类名格式）；当 `iconMode=custom` 且 class 无效时，回退 `iconPreset`。  
  **Must NOT do**: 不阻断有效自定义 class；不改变 preset 选择行为。

  **Acceptance Criteria**:
  - [x] `customIcon` 为空时回退 preset（既有行为保留）
  - [x] `customIcon` 非空但无效时也回退 preset（新增行为）

  **QA Scenarios**:
  ```
  Scenario: invalid custom class 回退
    Tool: Playwright
    Steps: 设 iconMode=custom, customIcon="abc"
    Expected: 预览图标回退为 preset 图标，不渲染无效 class
    Evidence: .sisyphus/evidence/f1-r2-invalid-class-fallback.png

  Scenario: valid custom class 保持
    Tool: Playwright
    Steps: 设 customIcon="fas fa-star"
    Expected: 预览图标为星形，不回退
    Evidence: .sisyphus/evidence/f1-r2-valid-class-keep.png
  ```

- [x] R3. F1 复审收口

  **What to do**: 完成 R1/R2 后仅重跑 F1（oracle）；若仍有阻塞，再补一轮最小修复并复审。  
  **Must NOT do**: 不扩展到非阻塞优化项。

  **Acceptance Criteria**:
  - [x] F1 输出 `APPROVE`
  - [x] `Final Verification Wave` 四项均为 `[x]`

  **QA Scenarios**:
  ```
  Scenario: F1 gate 通过
    Tool: task(subagent_type="oracle")
    Steps: 对 .sisyphus/plans/ats-mvp.md + 当前代码状态执行 Plan Compliance Audit
    Expected: Verdict = APPROVE
    Evidence: .sisyphus/evidence/f1-r3-oracle-approve.md
  ```

## 验收标准
- 功能验收：基本信息 5 项可编辑、可排序、图标可选可自定义。
- 视觉验收：预览图标容器统一为圆形，文案统一为“基本信息”。
- 行为验收：空值项不显示；全部空值时整段隐藏。
- 稳定性验收：分页预览与打印导出无截断回归。
- 数据验收：导出/导入 JSON 后，`basicInfo` 顺序与内容保持一致。

## Commit Strategy
- 建议单提交：`feat(resume): upgrade contacts to basic-info with icon picker and sortable order`

## Success Criteria
- 业务目标、交互目标、视觉目标、稳定性目标全部满足；无 P1/P2 回归。
