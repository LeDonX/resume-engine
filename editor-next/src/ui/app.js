import Sortable from '../../node_modules/sortablejs/modular/sortable.esm.js';
import {
  activateDocumentTemplate,
  activateDocumentPreset,
  createEditorDocument,
  readEditPathValue,
  updateDocumentContent,
  updateDocumentStyle,
  updateDocumentLayout
} from '../core/document.js';
import { getBlock, getBlockSizeOptions, moveBlock, resizeBlock } from '../core/layout-ops.js';
import { readPersistedEditorState, writePersistedEditorState } from '../core/persistence.js';
import { getPreset, getPresetLayoutTemplate, listPresetTemplates, listPresets } from '../core/presets.js';
import { sampleResumeSeed } from '../sample-document.js';
import { renderPreview } from './renderers.js';
import {
  SORTABLE_GROUP_NAME,
  canDropBlockInZone,
  canStartSortableDrag,
  createSortableMovePlan,
  getSortableTargetOrder,
  getZoneDragState
} from './sortable-controller.js';

const INITIAL_PRESET_ID = 'cards';

const STYLE_CONTROL_OPTIONS = Object.freeze({
  accent: [
    { value: 'emerald', label: '翡翠', note: '沉稳绿色高亮，保持当前卡片气质。' },
    { value: 'cobalt', label: '钴蓝', note: '更偏工具感，适合经典正文阅读。' },
    { value: 'amber', label: '琥珀', note: '强调重点与结果信息。' },
    { value: 'plum', label: '绛紫', note: '让卡片更有展示氛围。' }
  ],
  density: [
    { value: 'compact', label: '紧凑', note: '压缩留白，接近打印密度。' },
    { value: 'comfortable', label: '常规', note: '平衡阅读舒适度与信息量。' },
    { value: 'airy', label: '舒展', note: '给重点模块更多呼吸感。' }
  ],
  fontPair: [
    { value: 'serif-sans', label: '宋体标题', note: '标题偏内容展示，正文保持清晰。' },
    { value: 'sans-humanist', label: '人文无衬线', note: '更像现代产品文档。' },
    { value: 'serif-editorial', label: '编辑感衬线', note: '适合卡片展示与摘要。' }
  ],
  surface: [
    { value: 'mist', label: '雾米', note: '柔和暖底，适合 cards 首选体验。' },
    { value: 'paper', label: '纸白', note: '更接近传统打印与 classic。' },
    { value: 'slate', label: '石板', note: '深色预览，更像控制台样稿。' }
  ]
});

function createSessionDocument() {
  return createEditorDocument(sampleResumeSeed, getPreset(INITIAL_PRESET_ID));
}

function createDefaultDurableState() {
  return {
    presetId: INITIAL_PRESET_ID,
    selectedBlockId: 'block_profile',
    sessionDocument: createSessionDocument()
  };
}

function createEditingState(durableState) {
  return {
    activeEditPath: null,
    activeMoveBlockId: null,
    draftValue: '',
    sessionDocument: durableState.sessionDocument
  };
}

const restoredDurableState = readPersistedEditorState(globalThis.localStorage, createDefaultDurableState);

const state = {
  ...createEditingState(restoredDurableState),
  presetId: restoredDurableState.presetId,
  selectedBlockId: restoredDurableState.selectedBlockId
};

const sortableInstances = [];

function currentPreset() {
  return getPreset(state.presetId);
}

function currentDocument() {
  return state.sessionDocument;
}

function persistDurableState() {
  writePersistedEditorState(globalThis.localStorage, state);
}

function currentTemplateId() {
  return state.sessionDocument.activeTemplateIdByPreset?.[state.presetId]
    || state.sessionDocument.activeTemplateId
    || currentPreset().defaultTemplateId;
}

function currentTemplate() {
  return getPresetLayoutTemplate(currentPreset(), currentTemplateId());
}

function getCurrentFieldValue(editPath) {
  return String(readEditPathValue(state.sessionDocument.content, editPath) ?? '');
}

function resetActiveEditState() {
  state.activeEditPath = null;
  state.draftValue = '';
}

function resetActiveMoveState() {
  state.activeMoveBlockId = null;
}

function destroySortableInstances() {
  while (sortableInstances.length > 0) {
    sortableInstances.pop()?.destroy();
  }
}

function clearZoneHoverState(previewRoot) {
  previewRoot.querySelectorAll('[data-zone-id]').forEach((zoneElement) => {
    delete zoneElement.dataset.hoverDropState;
  });
}

function syncZoneDragState(previewRoot, blockId) {
  previewRoot.querySelectorAll('[data-sortable-zone-list="true"]').forEach((zoneList) => {
    const zoneElement = zoneList.closest('[data-zone-id]');
    if (!zoneElement) {
      return;
    }

    zoneElement.dataset.moveZoneState = getZoneDragState(
      state.sessionDocument.layout,
      currentPreset(),
      blockId,
      zoneList.dataset.zoneId
    );
  });
}

function mountSortables(previewRoot) {
  destroySortableInstances();

  previewRoot.querySelectorAll('[data-sortable-zone-list="true"]').forEach((zoneList) => {
    const sortable = Sortable.create(zoneList, {
      animation: 180,
      chosenClass: 'sortable-chosen',
      dragClass: 'sortable-drag',
      draggable: '[data-sortable-item="true"]',
      easing: 'cubic-bezier(0.2, 0.84, 0.32, 1)',
      fallbackTolerance: 4,
      filter: '[data-edit-path], [data-active-edit-control="true"], [data-size-toggle="true"]',
      ghostClass: 'sortable-ghost',
      group: {
        name: SORTABLE_GROUP_NAME,
        pull: (_to, _from, dragEl) => canStartSortableDrag(state.sessionDocument.layout, dragEl?.dataset?.blockId),
        put: (to, _from, dragEl) => canDropBlockInZone(
          state.sessionDocument.layout,
          currentPreset(),
          dragEl?.dataset?.blockId,
          to?.dataset?.zoneId
        )
      },
      handle: '[data-drag-handle="true"]',
      onEnd: (event) => {
        const blockId = event.item?.dataset?.blockId || state.activeMoveBlockId;
        const targetZoneId = event.to?.dataset?.zoneId;

        resetActiveMoveState();
        clearZoneHoverState(previewRoot);
        syncZoneDragState(previewRoot, null);

        if (!blockId || !targetZoneId) {
          renderApp();
          return;
        }

        const plan = createSortableMovePlan(
          state.sessionDocument.layout,
          currentPreset(),
          blockId,
          targetZoneId,
          getSortableTargetOrder(event)
        );

        if (!plan.shouldMove) {
          renderApp();
          return;
        }

        const nextLayout = moveBlock(
          state.sessionDocument.layout,
          currentPreset(),
          blockId,
          plan.targetState.targetZoneId,
          plan.targetState.targetOrder
        );

        state.sessionDocument = updateDocumentLayout(state.sessionDocument, nextLayout);
        state.selectedBlockId = blockId;
        renderApp();
      },
      onMove: (event) => {
        const targetZoneId = event.to?.dataset?.zoneId;
        const blockId = event.dragged?.dataset?.blockId;
        const hoveredZone = event.to?.closest?.('[data-zone-id]');

        clearZoneHoverState(previewRoot);

        if (!targetZoneId || !blockId || !hoveredZone) {
          return false;
        }

        const plan = createSortableMovePlan(
          state.sessionDocument.layout,
          currentPreset(),
          blockId,
          targetZoneId,
          getSortableTargetOrder(event)
        );

        hoveredZone.dataset.hoverDropState = plan.targetState.state;

        if (plan.targetState.state === 'invalid') {
          return false;
        }

        return true;
      },
      onStart: (event) => {
        const blockId = event.item?.dataset?.blockId;
        if (!blockId) {
          return;
        }

        if (state.activeEditPath) {
          commitActiveEdit({ rerender: false });
        }

        state.selectedBlockId = blockId;
        state.activeMoveBlockId = blockId;
        syncZoneDragState(previewRoot, blockId);
      },
      preventOnFilter: false,
      sort: true
    });

    sortableInstances.push(sortable);
  });
}

function commitActiveEdit(options = {}) {
  const { rerender = true } = options;

  if (!state.activeEditPath) {
    return false;
  }

  state.sessionDocument = updateDocumentContent(state.sessionDocument, state.activeEditPath, state.draftValue);
  resetActiveEditState();

  if (rerender) {
    renderApp();
  }

  return true;
}

function cancelActiveEdit(options = {}) {
  const { rerender = true } = options;

  if (!state.activeEditPath) {
    return false;
  }

  resetActiveEditState();

  if (rerender) {
    renderApp();
  }

  return true;
}

function beginEdit(editPath, blockId) {
  state.selectedBlockId = blockId || state.selectedBlockId;
  resetActiveMoveState();
  state.activeEditPath = editPath;
  state.draftValue = getCurrentFieldValue(editPath);
  renderApp();
}

function startNextEdit(editPath, blockId) {
  if (state.activeEditPath === editPath) {
    return;
  }

  if (state.activeEditPath) {
    commitActiveEdit({ rerender: false });
  }

  beginEdit(editPath, blockId);
}

function ensureSelectedBlock(layout) {
  if (getBlock(layout, state.selectedBlockId)) {
    if (!getBlock(layout, state.activeMoveBlockId) || state.activeMoveBlockId !== state.selectedBlockId) {
      resetActiveMoveState();
    }

    return;
  }

  state.selectedBlockId = layout.blocks[0]?.id || null;
  resetActiveMoveState();
}

function formatEditTarget(editPath) {
  if (!editPath) {
    return '未进入直编';
  }

  return editPath;
}

function currentStyle() {
  return state.sessionDocument.style || {};
}

function getStyleOptionLabel(group, value) {
  return STYLE_CONTROL_OPTIONS[group]?.find((option) => option.value === value)?.label || value;
}

function updateStyleField(field, value) {
  if (currentStyle()[field] === value) {
    return;
  }

  state.sessionDocument = updateDocumentStyle(state.sessionDocument, {
    [field]: value
  });
  renderApp();
}

function createConsoleSection({ eyebrow, title, description, bodyClassName = '', compact = false }) {
  const section = document.createElement('section');
  section.className = `console-section${compact ? ' console-section--compact' : ''}`;

  const header = document.createElement('div');
  header.className = 'console-section__header';

  const eyebrowElement = document.createElement('span');
  eyebrowElement.className = 'console-section__eyebrow';
  eyebrowElement.textContent = eyebrow;

  const titleElement = document.createElement('h2');
  titleElement.className = 'console-section__title';
  titleElement.textContent = title;

  const descriptionElement = document.createElement('p');
  descriptionElement.className = 'console-section__description';
  descriptionElement.textContent = description;

  header.append(eyebrowElement, titleElement, descriptionElement);

  const body = document.createElement('div');
  body.className = ['console-section__body', bodyClassName].filter(Boolean).join(' ');

  section.append(header, body);

  return { section, body };
}

function createSegmentedOptionGroup({ field, label, options, value, onChange }) {
  const wrap = document.createElement('div');
  wrap.className = 'field-group';

  const fieldLabel = document.createElement('div');
  fieldLabel.className = 'field-group__label-row';

  const title = document.createElement('span');
  title.className = 'field-group__label';
  title.textContent = label;

  const current = document.createElement('strong');
  current.className = 'field-group__value';
  current.textContent = getStyleOptionLabel(field, value);

  fieldLabel.append(title, current);

  const controls = document.createElement('div');
  controls.className = 'segmented-control';

  options.forEach((option) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'segmented-control__button';
    button.dataset.active = String(option.value === value);
    button.title = option.note || option.label;
    button.textContent = option.label;
    button.addEventListener('click', () => onChange(option.value));
    controls.append(button);
  });

  const note = document.createElement('small');
  note.className = 'field-group__hint';
  note.textContent = options.find((option) => option.value === value)?.note || '';

  wrap.append(fieldLabel, controls, note);
  return wrap;
}

function createMetaList(entries, options = {}) {
  const { compact = false } = options;
  const list = document.createElement('ul');
  list.className = compact ? 'console-meta-list console-meta-list--compact' : 'console-meta-list';

  entries.forEach(([label, value]) => {
    const item = document.createElement('li');
    const itemLabel = document.createElement('span');
    const itemValue = document.createElement('strong');

    itemLabel.textContent = label;
    itemValue.textContent = value;
    item.append(itemLabel, itemValue);
    list.append(item);
  });

  return list;
}

function createDocumentPresetSection(preset, activeTemplate) {
  const { section, body } = createConsoleSection({
    eyebrow: 'Document / Preset',
    title: '文档与场景',
    description: '在不同预设场景间切换，同时保留每个 preset / template 的已编辑内容与布局。',
    bodyClassName: 'console-stack'
  });

  const summaryCard = document.createElement('div');
  summaryCard.className = 'console-summary-card';
  summaryCard.append(createMetaList([
    ['当前 preset', preset.label],
    ['当前模板', activeTemplate.label],
    ['选中区块', state.selectedBlockId || '未选择']
  ]));

  const switcher = document.createElement('div');
  switcher.className = 'button-cluster';

  listPresets().forEach((entry) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'cluster-button';
    button.dataset.active = String(state.presetId === entry.id);
    button.textContent = entry.label;
    button.addEventListener('click', () => {
      commitActiveEdit({ rerender: false });
      resetActiveMoveState();
      state.presetId = entry.id;
      state.sessionDocument = activateDocumentPreset(state.sessionDocument, entry);
      ensureSelectedBlock(state.sessionDocument.layout);
      renderApp();
    });
    switcher.append(button);
  });

  const hint = document.createElement('small');
  hint.className = 'console-hint';
  hint.textContent = preset.description;

  body.append(summaryCard, switcher, hint);
  return section;
}

function createTemplateSection(preset) {
  const { section, body } = createConsoleSection({
    eyebrow: 'Template',
    title: '模板排版',
    description: '只替换当前 preset 的布局骨架；已保存的排序和尺寸按模板分别保留。',
    bodyClassName: 'console-stack'
  });

  const switcher = document.createElement('div');
  switcher.className = 'button-cluster';

  listPresetTemplates(preset).forEach((template) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'cluster-button cluster-button--wide';
    button.dataset.active = String(currentTemplateId() === template.id);
    button.addEventListener('click', () => {
      if (template.id === currentTemplateId()) {
        return;
      }

      commitActiveEdit({ rerender: false });
      resetActiveMoveState();
      state.sessionDocument = activateDocumentTemplate(state.sessionDocument, preset, template.id);
      ensureSelectedBlock(state.sessionDocument.layout);
      renderApp();
    });

    const label = document.createElement('strong');
    label.textContent = template.label;
    const copy = document.createElement('small');
    copy.textContent = template.description || template.label;
    button.append(label, copy);
    switcher.append(button);
  });

  body.append(switcher);
  return section;
}

function createStyleControlsSection() {
  const style = currentStyle();
  const { section, body } = createConsoleSection({
    eyebrow: 'Style',
    title: '视觉风格',
    description: '用现有 style state 驱动预览气质，让卡片版与经典版都能看到真实风格变化。',
    bodyClassName: 'console-stack'
  });

  body.append(
    createSegmentedOptionGroup({
      field: 'accent',
      label: '强调色',
      options: STYLE_CONTROL_OPTIONS.accent,
      value: style.accent,
      onChange: (value) => updateStyleField('accent', value)
    }),
    createSegmentedOptionGroup({
      field: 'density',
      label: '信息密度',
      options: STYLE_CONTROL_OPTIONS.density,
      value: style.density,
      onChange: (value) => updateStyleField('density', value)
    }),
    createSegmentedOptionGroup({
      field: 'fontPair',
      label: '字体系',
      options: STYLE_CONTROL_OPTIONS.fontPair,
      value: style.fontPair,
      onChange: (value) => updateStyleField('fontPair', value)
    }),
    createSegmentedOptionGroup({
      field: 'surface',
      label: '预览底色',
      options: STYLE_CONTROL_OPTIONS.surface,
      value: style.surface,
      onChange: (value) => updateStyleField('surface', value)
    })
  );

  return section;
}

function createLayoutControlsSection(preset, activeTemplate) {
  const selectedBlock = getBlock(state.sessionDocument.layout, state.selectedBlockId);
  const { section, body } = createConsoleSection({
    eyebrow: 'Layout',
    title: '布局控制',
    description: '拖动仍在右侧画布直接完成；这里聚合当前模板、zone 分配和尺寸策略。',
    bodyClassName: 'console-stack'
  });

  const zoneSummary = preset.zones.map((zone) => {
    const blockCount = state.sessionDocument.layout.blocks.filter((block) => block.zoneId === zone.id).length;
    return [zone.label, `${blockCount} 个区块`];
  });

  const layoutCard = document.createElement('div');
  layoutCard.className = 'console-summary-card';
  layoutCard.append(createMetaList([
    ['模板标识', activeTemplate.id],
    ['可用 zone', String(preset.zones.length)],
    ['拖动状态', state.activeMoveBlockId ? '拖动中' : '待命']
  ], { compact: true }));

  const zonesCard = document.createElement('div');
  zonesCard.className = 'console-summary-card';
  zonesCard.append(createMetaList(zoneSummary, { compact: true }));

  const sizeCard = document.createElement('div');
  sizeCard.className = 'console-summary-card';

  const sizeTitle = document.createElement('strong');
  sizeTitle.className = 'summary-card__title';
  sizeTitle.textContent = selectedBlock
    ? `${selectedBlock.title} · 尺寸档位`
    : '先在画布里选中区块';

  sizeCard.append(sizeTitle, createSizeInspectorGroup(selectedBlock, preset));
  body.append(layoutCard, zonesCard, sizeCard);
  return section;
}

function createSelectedBlockSection(selectedBlock, preset) {
  const activeTemplate = currentTemplate();
  const { section, body } = createConsoleSection({
    eyebrow: 'Selected block',
    title: '区块详情',
    description: '保留必要信息与操作提示，避免原来那种偏调试面板的冗长输出。',
    bodyClassName: 'console-stack'
  });

  if (!selectedBlock) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = '点击右侧任意区块后，这里会显示该模块的尺寸、可落位区域和直编状态。';
    body.append(empty);
    return section;
  }

  const status = selectedBlock.locked
    ? '位置锁定'
    : state.activeMoveBlockId === selectedBlock.id
      ? '正在拖动'
      : '可编辑 / 可排序';

  const blockCard = document.createElement('div');
  blockCard.className = 'console-summary-card';
  blockCard.append(createMetaList([
    ['区块名称', selectedBlock.title],
    ['内容类型', selectedBlock.type],
    ['当前 zone', preset.zones.find((zone) => zone.id === selectedBlock.zoneId)?.label || selectedBlock.zoneId],
    ['尺寸档位', selectedBlock.size],
    ['移动状态', status],
    ['模板上下文', activeTemplate.label]
  ]));

  const movementCard = document.createElement('div');
  movementCard.className = 'console-summary-card';

  const movementTitle = document.createElement('strong');
  movementTitle.className = 'summary-card__title';
  movementTitle.textContent = '交互说明';

  const movementCopy = document.createElement('p');
  movementCopy.className = 'summary-card__copy';
  movementCopy.textContent = selectedBlock.locked
    ? '该区块固定在当前版式语义位置，仍可直编内容，但不参与换位和尺寸切换。'
    : '右侧画布仍是主要操作面：点击文字进入直编，拖动手柄换位，尺寸档位写回当前模板布局。';

  const allowedZones = document.createElement('div');
  allowedZones.className = 'pill-row';
  selectedBlock.allowedZoneIds.forEach((zoneId) => {
    const pill = document.createElement('span');
    pill.className = 'info-pill';
    pill.textContent = preset.zones.find((zone) => zone.id === zoneId)?.label || zoneId;
    allowedZones.append(pill);
  });

  movementCard.append(movementTitle, movementCopy, allowedZones);
  body.append(blockCard, movementCard, createEditStatusGroup());
  return section;
}

function createEditStatusGroup() {
  const group = document.createElement('div');
  group.className = 'console-summary-card';

  const label = document.createElement('span');
  label.className = 'console-section__eyebrow';
  label.textContent = '当前编辑目标';

  const title = document.createElement('strong');
  title.className = 'summary-card__title';
  title.textContent = formatEditTarget(state.activeEditPath);

  const copy = document.createElement('small');
  copy.className = 'console-hint';
  copy.textContent = state.activeEditPath
    ? 'Enter / 失焦提交，Esc 取消当前字段编辑。'
    : '点击右侧带描边的文字即可进入直编。';

  const hintList = document.createElement('ul');
  hintList.className = 'console-meta-list console-meta-list--compact';

  const hintEntries = [
    ['草稿值', state.activeEditPath ? state.draftValue || '（空值）' : '—'],
    ['快捷键', 'Enter 保存 / Esc 取消'],
    ['提交方式', 'blur 自动提交']
  ];

  hintEntries.forEach(([term, value]) => {
    const item = document.createElement('li');
    const itemLabel = document.createElement('span');
    const itemValue = document.createElement('strong');

    itemLabel.textContent = term;
    itemValue.textContent = value;
    item.append(itemLabel, itemValue);
    hintList.append(item);
  });

  group.append(label, title, copy, hintList);
  return group;
}

function createSizeOptionButton(blockId, option, origin) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'size-tier-button';
  button.dataset.blockId = blockId;
  button.dataset.controlOrigin = origin;
  button.dataset.sizeState = option.state;
  button.dataset.sizeToggle = 'true';
  button.dataset.sizeValue = option.value;
  button.disabled = option.state !== 'valid';
  button.textContent = option.value;
  button.title = option.description || option.label;
  button.addEventListener('click', () => {
    changeBlockSize(blockId, option.value);
  });

  return button;
}

function createSizeInspectorGroup(selectedBlock, preset) {
  const group = document.createElement('div');
  group.className = 'size-console';

  const label = document.createElement('span');
  label.className = 'console-section__eyebrow';
  label.textContent = '尺寸档位';

  if (!selectedBlock) {
    const emptyState = document.createElement('strong');
    emptyState.textContent = '尚未选择';
    group.append(label, emptyState);
    return group;
  }

  const options = getBlockSizeOptions(state.sessionDocument.layout, preset, selectedBlock.id);
  const activeOption = options.find((option) => option.state === 'active') || options[0];

  const title = document.createElement('strong');
  title.className = 'summary-card__title';
  title.textContent = selectedBlock.locked
    ? `当前尺寸 ${selectedBlock.size}（锁定）`
    : `当前尺寸 ${activeOption?.label || selectedBlock.size}`;

  const controls = document.createElement('div');
  controls.className = 'size-tier-group';
  controls.dataset.sizeSurface = 'inspector';

  options.forEach((option) => {
    controls.append(createSizeOptionButton(selectedBlock.id, option, 'inspector'));
  });

  const description = document.createElement('small');
  description.className = 'console-hint';
  description.textContent = activeOption?.description || '尺寸档位由 preset 约束，并写回当前 session layout。';

  const detailList = document.createElement('ul');
  detailList.className = 'console-meta-list console-meta-list--compact';

  [
    ['允许尺寸', options.map((option) => option.value).join(' / ')],
    ['当前档位', selectedBlock.size],
    ['应用方式', '语义档位，不使用像素拖拽']
  ].forEach(([term, value]) => {
    const item = document.createElement('li');
    const itemLabel = document.createElement('span');
    const itemValue = document.createElement('strong');

    itemLabel.textContent = term;
    itemValue.textContent = value;
    item.append(itemLabel, itemValue);
    detailList.append(item);
  });

  group.append(label, title, controls, description, detailList);
  return group;
}

function changeBlockSize(blockId, nextSize) {
  const currentBlock = getBlock(state.sessionDocument.layout, blockId);
  if (!currentBlock) {
    return;
  }

  if (state.activeEditPath) {
    commitActiveEdit({ rerender: false });
  }

  const nextLayout = resizeBlock(state.sessionDocument.layout, currentPreset(), blockId, nextSize);
  state.sessionDocument = updateDocumentLayout(state.sessionDocument, nextLayout);
  state.selectedBlockId = blockId;
  renderApp();
}

function renderApp() {
  const app = document.querySelector('#app');
  destroySortableInstances();
  const preset = currentPreset();
  const activeTemplate = currentTemplate();
  const documentModel = currentDocument();
  ensureSelectedBlock(documentModel.layout);
  persistDurableState();
  const selectedBlock = getBlock(documentModel.layout, state.selectedBlockId);

  const shell = document.createElement('main');
  shell.className = 'prototype-shell';

  const sidebar = document.createElement('aside');
  sidebar.className = 'control-sidebar';

  const masthead = document.createElement('header');
  masthead.className = 'sidebar-masthead';
  masthead.innerHTML = `
    <p class="kicker">Editor Next Console</p>
    <h1>文档控制台</h1>
    <p>把左侧从调试式检查器重组为真实的编辑侧栏：文档、模板、风格、布局和区块操作都集中在这里。</p>
  `;

  const sidebarBody = document.createElement('div');
  sidebarBody.className = 'sidebar-console';

  sidebarBody.append(
    createDocumentPresetSection(preset, activeTemplate),
    createTemplateSection(preset),
    createStyleControlsSection(),
    createLayoutControlsSection(preset, activeTemplate),
    createSelectedBlockSection(selectedBlock, preset)
  );

  sidebar.append(masthead, sidebarBody);

  const canvas = document.createElement('section');
  canvas.className = 'preview-stage';

  const stageHeader = document.createElement('div');
  stageHeader.className = 'stage-header';
  stageHeader.innerHTML = `<strong>预览画面</strong><span>${preset.label} · ${activeTemplate.label}：点击区块选中；通过右上角拖动手柄排序；尺寸档位与直编继续共用约束状态</span>`;

  const previewRoot = document.createElement('div');
  renderPreview(previewRoot, documentModel, preset, state.selectedBlockId, {
    activeEditPath: state.activeEditPath,
    activeMoveBlockId: state.activeMoveBlockId,
    draftValue: state.draftValue
  });

  previewRoot.addEventListener('pointerdown', (event) => {
    const dragHandle = event.target.closest('[data-drag-handle="true"]');
    if (!dragHandle) {
      return;
    }

    if (state.activeEditPath) {
      commitActiveEdit({ rerender: false });
    }

    state.selectedBlockId = dragHandle.dataset.blockId || state.selectedBlockId;
  });

  previewRoot.addEventListener('click', (event) => {
    const activeControl = event.target.closest('[data-active-edit-control="true"]');
    if (activeControl) {
      return;
    }

    const dragHandle = event.target.closest('[data-drag-handle="true"]');
    if (dragHandle) {
      if (dragHandle.dataset.blockId && dragHandle.dataset.blockId !== state.selectedBlockId) {
        state.selectedBlockId = dragHandle.dataset.blockId;
        renderApp();
      }

      return;
    }

    const sizeToggle = event.target.closest('[data-size-toggle="true"]');
    if (sizeToggle) {
      changeBlockSize(sizeToggle.dataset.blockId, sizeToggle.dataset.sizeValue);
      return;
    }

    const editableField = event.target.closest('[data-edit-path]');
    if (editableField) {
      const blockElement = editableField.closest('[data-block-id]');
      startNextEdit(editableField.dataset.editPath, blockElement?.dataset.blockId);
      return;
    }

    const blockElement = event.target.closest('[data-block-id]');
    if (!blockElement) {
      return;
    }

    state.selectedBlockId = blockElement.dataset.blockId;
    if (state.activeMoveBlockId && state.activeMoveBlockId !== state.selectedBlockId) {
      resetActiveMoveState();
    }
    renderApp();
  });

  previewRoot.addEventListener('input', (event) => {
    const activeControl = event.target.closest('[data-active-edit-control="true"]');
    if (!activeControl) {
      return;
    }

    state.draftValue = activeControl.value;
  });

  previewRoot.addEventListener('focusout', (event) => {
    const activeControl = event.target.closest('[data-active-edit-control="true"]');
    if (!activeControl || activeControl.dataset.editPath !== state.activeEditPath) {
      return;
    }

    const nextEditable = event.relatedTarget?.closest?.('[data-edit-path]');
    if (nextEditable && nextEditable.dataset.editPath !== state.activeEditPath) {
      const blockId = nextEditable.closest('[data-block-id]')?.dataset.blockId;
      commitActiveEdit({ rerender: false });
      beginEdit(nextEditable.dataset.editPath, blockId);
      return;
    }

    const nextDragHandle = event.relatedTarget?.closest?.('[data-drag-handle="true"]');
    if (nextDragHandle) {
      commitActiveEdit({ rerender: false });
      state.selectedBlockId = nextDragHandle.dataset.blockId || state.selectedBlockId;
      return;
    }

    const nextSizeToggle = event.relatedTarget?.closest?.('[data-size-toggle="true"]');
    if (nextSizeToggle) {
      commitActiveEdit({ rerender: false });
      changeBlockSize(nextSizeToggle.dataset.blockId, nextSizeToggle.dataset.sizeValue);
      return;
    }

    commitActiveEdit();
  });

  previewRoot.addEventListener('keydown', (event) => {
    const activeControl = event.target.closest('[data-active-edit-control="true"]');
    if (activeControl) {
      if (event.key === 'Escape') {
        event.preventDefault();
        cancelActiveEdit();
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        commitActiveEdit();
      }

      return;
    }

    const editableField = event.target.closest('[data-edit-path]');
    if (editableField && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      const blockElement = editableField.closest('[data-block-id]');
      startNextEdit(editableField.dataset.editPath, blockElement?.dataset.blockId);
      return;
    }

    const movementControl = event.target.closest('[data-drag-handle="true"], [data-size-toggle="true"]');
    if (movementControl) {
      return;
    }

    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    const blockElement = event.target.closest('[data-block-id]');
    if (!blockElement) {
      return;
    }

    event.preventDefault();
    state.selectedBlockId = blockElement.dataset.blockId;
    if (state.activeMoveBlockId && state.activeMoveBlockId !== state.selectedBlockId) {
      resetActiveMoveState();
    }
    renderApp();
  });

  canvas.append(stageHeader, previewRoot);
  shell.append(sidebar, canvas);

  app.replaceChildren(shell);
  mountSortables(previewRoot);

  const activeEditor = app.querySelector('[data-active-edit-control="true"]');
  if (activeEditor) {
    activeEditor.focus();

    if (typeof activeEditor.setSelectionRange === 'function') {
      const cursor = activeEditor.value.length;
      activeEditor.setSelectionRange(cursor, cursor);
    }
  }
}

renderApp();
