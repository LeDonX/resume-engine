# ATS 短周期 UX/性能优化批次

## TL;DR
> **Summary**: 在不改视觉风格与数据模型的前提下，完成一轮短周期 UX/性能优化，重点解决输入卡顿体感、误操作防护、可访问性微优化，以及按钮+系统打印双链路稳态。
> **Deliverables**:
> - 输入路径渲染/保存节流（中等内容编辑无明显卡顿）
> - 重置/导入替换的“仅脏状态确认”防误操作
> - 图标按钮可访问性与状态播报可达性增强
> - 按钮打印 + Ctrl/Cmd+P 路径统一预打印稳定化
> **Effort**: Short
> **Parallel**: YES - 2 waves
> **Critical Path**: 1（脏状态）→ 2（输入性能）→ 4（打印稳态）→ 5（回归收口）

## Context
### Original Request
- 用户要求在 ATS-MVP 完成后，规划“下一批优化项”。
- 已确认优先级：UX/性能先行。
- 已确认规模：短周期。
- 已确认验收主目标：体感体验优先。
- 已确认范围解释：选择“核心三项 + 打印稳态”。
- 已确认策略：手测 + Playwright 点验（不在本批搭建完整测试基建）。

### Interview Summary
- 打印稳态需覆盖两条路径：按钮触发与 Ctrl/Cmd+P（系统打印）。
- 性能验收阈值：中等内容场景连续编辑“无明显卡顿”。
- 防误操作策略：仅在草稿 dirty 状态下弹确认。

### Metis Review (gaps addressed)
- Guardrail 1：禁止扩展为大规模架构重构（保持短周期）。
- Guardrail 2：所有验收标准必须为 agent 可执行、二值可判定。
- Guardrail 3：避免把“体感优化”写成不可验证的主观描述，需配套可执行检查步骤。

## Work Objectives
### Core Objective
在 `简历.html` 单文件内完成 UX/性能短周期优化，并保持现有业务语义、样式风格、ATS-MVP 功能边界不变。

### Deliverables
- 输入更新链路降频：输入过程中减少全量重分页频率与无效保存写入。
- 脏状态判定：实现 `dirty` 标志并用于 reset/import 确认策略。
- 可访问性补强：图标按钮具备明确可访问名称，状态消息变为 live region。
- 打印稳态补强：按钮打印与系统打印都走统一预渲染路径。

### Definition of Done (verifiable conditions with commands)
- `lsp_diagnostics` 对 `E:\aispace\myresume\简历.html` 返回 0 errors。
- Node 语法检查通过：`new Function(scriptContent)` 不抛错。
- Playwright 场景验证通过：
  - 中等内容连续输入后仍可立即交互（无明显阻塞行为）
  - dirty 状态下 reset/import 会弹确认，取消后数据不变
  - 图标按钮有 `aria-label`，`#form-status` 具备 `role=status` + `aria-live=polite`
  - 点击打印按钮与触发 `beforeprint` 时都先执行预渲染

### Must Have
- 仅改 `简历.html`。
- 仅脏状态确认（非脏状态不弹）。
- 打印双路径统一预渲染（按钮 + 系统打印）。
- 每项任务都包含 happy + failure/edge QA 场景与证据路径。

### Must NOT Have (guardrails, AI slop patterns, scope boundaries)
- 不做 UI 视觉重设计。
- 不改 `basicInfo` 数据契约与既有字段语义。
- 不引入新依赖、不搭建完整测试框架。
- 不实施大规模模块拆分重构。
- 不扩展 ATS 评分、后端存储、模板系统等新能力。

## Verification Strategy
> ZERO HUMAN INTERVENTION — all verification is agent-executed.
- Test decision: tests-after（Playwright spot checks + LSP + syntax check）
- QA policy: Every task includes executable scenarios and evidence artifacts.
- Evidence: `.sisyphus/evidence/task-{N}-{slug}.{ext}`

## Execution Strategy
### Parallel Execution Waves
> 将 shared dependency（dirty state）前置，后续任务并行实施。

Wave 1: 1（dirty-state 基线）

Wave 2: 2（输入性能） + 3（可访问性微优化） + 4（打印双路径稳态）

Wave 3: 5（综合回归与收口）

### Dependency Matrix (full, all tasks)
- 1 blocks: 2, 4, 5
- 2 blocks: 5
- 3 blocks: 5
- 4 blocks: 5
- 5 blocks: Final Verification

### Agent Dispatch Summary (wave → task count → categories)
- Wave 1 → 1 task → `quick`
- Wave 2 → 3 tasks → `unspecified-high` + `visual-engineering`
- Wave 3 → 1 task → `unspecified-high`

## TODOs
> Implementation + Test = ONE task. Never separate.

- [ ] 1. 建立草稿脏状态基线（dirty flag + 比较策略）

  **What to do**: 在 `resumeData` 更新链路中引入可复用 dirty 判定（基于当前数据与最近持久化快照比较），并暴露统一读取接口供 reset/import/状态提示复用。
  **Must NOT do**: 不改现有数据模型字段；不新增后端/存储层。

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: 单文件、低耦合状态辅助逻辑
  - Skills: `[]` — 无需额外技能
  - Omitted: `playwright` — 实现阶段不依赖浏览器自动化

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: 2,4,5 | Blocked By: none

  **References**:
  - Pattern: `简历.html:628` — `saveDraft` 当前持久化入口
  - Pattern: `简历.html:636` — `loadDraft` 当前恢复入口
  - Pattern: `简历.html:1407` — 输入更新写入主路径
  - Pattern: `简历.html:1441` — action 路由写入主路径

  **Acceptance Criteria**:
  - [ ] dirty 状态可由统一函数读取，不依赖 UI 文案判断
  - [ ] 首次加载默认数据后 dirty=false
  - [ ] 用户编辑后 dirty=true；成功保存后 dirty=false

  **QA Scenarios**:
  ```
  Scenario: dirty 状态基本流
    Tool: Playwright
    Steps: 打开页面 -> 读取 dirty 初值 -> 修改“姓名”输入 -> 再读取 dirty -> 触发保存路径后再读取 dirty
    Expected: false -> true -> false
    Evidence: .sisyphus/evidence/task-1-dirty-flow.json

  Scenario: 无变更不误报 dirty
    Tool: Playwright
    Steps: 打开页面 -> 不做任何输入 -> 检查 dirty
    Expected: 始终 false
    Evidence: .sisyphus/evidence/task-1-dirty-nochange.json
  ```

  **Commit**: NO | Message: `n/a` | Files: `简历.html`

- [ ] 2. 输入体验优化：输入链路渲染/保存节流

  **What to do**: 将输入事件路径从“每次输入都全量重分页+写存储”调整为可控节流，保持内容即时可见但减少密集重排；复用现有调度模式（如 `rerenderResumeSoon` 思路）。
  **Must NOT do**: 不牺牲数据正确性；不延迟到用户明显感知“输入后长时间不更新”。

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: 涉及性能体感与状态一致性平衡
  - Skills: `[]`
  - Omitted: `frontend-ui-ux` — 非视觉改版任务

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 5 | Blocked By: 1

  **References**:
  - Pattern: `简历.html:1388` — 现有 `rerenderResumeSoon` 调度器
  - Pattern: `简历.html:1323` — `renderResume` 全量分页入口
  - Pattern: `简历.html:1242` — `paginateColumnBlocks` 成本热点
  - Pattern: `简历.html:1407` — 输入更新触发点

  **Acceptance Criteria**:
  - [ ] 中等内容下连续输入无明显卡顿
  - [ ] 输入后预览在可接受延迟内同步
  - [ ] 不出现输入值丢失、覆盖、回跳

  **QA Scenarios**:
  ```
  Scenario: 中等内容连续输入顺滑
    Tool: Playwright
    Steps: 构造中等长度文本并连续输入到“个人简介”与“工作内容”字段 -> 期间执行按钮点击可交互检查
    Expected: 输入连续、界面可交互、无明显冻结
    Evidence: .sisyphus/evidence/task-2-typing-smooth.json

  Scenario: 高频输入后数据一致性
    Tool: Playwright
    Steps: 快速修改同一字段多次 -> 刷新页面
    Expected: 刷新后值等于最后一次输入
    Evidence: .sisyphus/evidence/task-2-input-consistency.json
  ```

  **Commit**: NO | Message: `n/a` | Files: `简历.html`

- [ ] 3. 可访问性微优化：图标按钮命名 + 状态 live region

  **What to do**: 为 icon-only 交互按钮添加明确可访问名称；将 `#form-status` 升级为可播报状态区域（`role=status`、`aria-live=polite`、`aria-atomic=true`）。
  **Must NOT do**: 不改布局层级与视觉样式；不引入全量无障碍重构。

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: 主要为 DOM 语义与可访问属性完善
  - Skills: `[]`
  - Omitted: `playwright` — 实现阶段不绑定

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 5 | Blocked By: none

  **References**:
  - Pattern: `简历.html:270` — `#form-status` 现有节点
  - Pattern: `简历.html:722` — `renderBasicInfoForm` 按钮生成
  - Pattern: `简历.html:734` — 拖拽手柄按钮
  - Pattern: `简历.html:740` — 上移按钮
  - Pattern: `简历.html:743` — 下移按钮

  **Acceptance Criteria**:
  - [ ] icon-only 按钮具备稳定可访问名称
  - [ ] `#form-status` 具备 live region 属性组合
  - [ ] 现有交互功能不受影响

  **QA Scenarios**:
  ```
  Scenario: 可访问属性存在性检查
    Tool: Playwright
    Steps: 抓取 basicInfo 区域按钮属性 + form-status 属性
    Expected: aria-label 全部存在；form-status 返回 role=status, aria-live=polite, aria-atomic=true
    Evidence: .sisyphus/evidence/task-3-a11y-attrs.json

  Scenario: 语义增强无功能回归
    Tool: Playwright
    Steps: 触发上移/下移/选择图标操作
    Expected: 行为与优化前一致，排序与图标更新正常
    Evidence: .sisyphus/evidence/task-3-a11y-regression.json
  ```

  **Commit**: NO | Message: `n/a` | Files: `简历.html`

- [ ] 4. 打印稳态增强：按钮打印 + 系统打印双路径统一预渲染

  **What to do**: 统一打印前预渲染策略，使点击“生成PDF”与系统 `beforeprint` 路径都执行稳定的 `rerenderResumeNow`（或等价预渲染逻辑）。
  **Must NOT do**: 不破坏既有分页分割提示、不改变导出视觉风格。

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: 涉及浏览器打印事件链与时序一致性
  - Skills: `[]`
  - Omitted: `frontend-ui-ux` — 非视觉设计任务

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 5 | Blocked By: 1

  **References**:
  - Pattern: `简历.html:1582` — 按钮打印触发
  - Pattern: `简历.html:1399` — `rerenderResumeNow` 实现
  - Pattern: `简历.html:1323` — 预览主渲染入口
  - Pattern: `简历.html:1242` — 分页核心测量流程

  **Acceptance Criteria**:
  - [ ] 按钮打印仍在 `window.print` 前执行预渲染
  - [ ] 系统打印路径（beforeprint）也执行预渲染
  - [ ] 多页预览不回归（分页提示仍正确）

  **QA Scenarios**:
  ```
  Scenario: 按钮打印链路
    Tool: Playwright
    Steps: 代理监测 rerender 调用标记 -> 点击“生成PDF”
    Expected: print 前发生预渲染调用
    Evidence: .sisyphus/evidence/task-4-print-button-chain.json

  Scenario: 系统打印链路
    Tool: Playwright
    Steps: 触发 beforeprint 事件（evaluate）
    Expected: 触发后执行预渲染，不抛异常
    Evidence: .sisyphus/evidence/task-4-print-system-chain.json
  ```

  **Commit**: NO | Message: `n/a` | Files: `简历.html`

- [ ] 5. 短周期综合回归与验收收口

  **What to do**: 对任务 1-4 做统一回归，确认 UX 体感、数据一致性、可访问性、打印稳态全部满足；输出证据与结论。
  **Must NOT do**: 不新增功能；不借回归之名扩 scope。

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: 跨模块回归验证密集
  - Skills: [`playwright`] — 需要稳定浏览器验证执行
  - Omitted: `git-master` — 不涉及 git 历史/提交

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: Final Verification | Blocked By: 2,3,4

  **References**:
  - Pattern: `简历.html:1407` — 输入更新
  - Pattern: `简历.html:1539` — reset 路径
  - Pattern: `简历.html:1564` — import 路径
  - Pattern: `简历.html:1582` — print 路径
  - Test: `.sisyphus/notepads/ats-mvp/issues.md:6` — 排序验证优先按钮路径

  **Acceptance Criteria**:
  - [ ] 关键路径无回归（编辑/排序/导入/打印）
  - [ ] 体感阈值达成（中等内容输入无明显卡顿）
  - [ ] 所有本批证据文件均产出并可复核

  **QA Scenarios**:
  ```
  Scenario: 全链路回归
    Tool: Playwright
    Steps: 连续执行编辑 -> 排序按钮 -> 导入替换确认(取消/确认) -> 打印按钮 -> beforeprint 模拟
    Expected: 全流程成功且无阻塞错误
    Evidence: .sisyphus/evidence/task-5-e2e-regression.json

  Scenario: 失败/边界路径
    Tool: Playwright
    Steps: 在 dirty=true 时触发 reset/import 并取消确认
    Expected: 数据不被覆盖，状态保持不变
    Evidence: .sisyphus/evidence/task-5-cancel-guard.json
  ```

  **Commit**: NO | Message: `n/a` | Files: `简历.html`

## Final Verification Wave (4 parallel agents, ALL must APPROVE)
- [ ] F1. Plan Compliance Audit — oracle
- [ ] F2. Code Quality Review — unspecified-high
- [ ] F3. Real Manual QA — unspecified-high (+ playwright if UI)
- [ ] F4. Scope Fidelity Check — deep

## Commit Strategy
- 当前环境非 git 仓库；本批次不要求 commit。
- 若后续初始化 git，再按任务粒度执行原子提交。

## Success Criteria
- 本计划所有 TODO 与 Final Verification 全部勾选完成。
- 交付保持原视觉风格，且不引入超出本批次范围的新能力。
- UX 体感改进在中等内容场景可稳定复现。
