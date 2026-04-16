import Sortable from '../../node_modules/sortablejs/modular/sortable.esm.js';
import {
  activateDocumentTemplate,
  activateDocumentPreset,
  createEditorDocument,
  readEditPathValue,
  updateDocumentContent,
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

function createEditStatusGroup() {
  const group = document.createElement('div');
  group.className = 'inspector-group';

  const label = document.createElement('span');
  label.className = 'inspector-label';
  label.textContent = '当前编辑目标';

  const title = document.createElement('strong');
  title.textContent = formatEditTarget(state.activeEditPath);

  const copy = document.createElement('small');
  copy.textContent = state.activeEditPath
    ? 'Enter / 失焦提交，Esc 取消当前字段编辑。'
    : '点击右侧带描边的文字即可进入直编。';

  const hintList = document.createElement('ul');
  hintList.className = 'inspector-list inspector-list--compact';

  const hintEntries = [
    ['草稿值', state.activeEditPath ? state.draftValue || '（空值）' : '—'],
    ['快捷键', 'Enter 保存 / Esc 取消'],
    ['提交方式', 'blur 自动提交']
  ];

  hintEntries.forEach(([term, value]) => {
    const item = document.createElement('li');
    const itemLabel = document.createElement('span');
    const itemValue = document.createElement('code');

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
  group.className = 'inspector-group';

  const label = document.createElement('span');
  label.className = 'inspector-label';
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
  description.textContent = activeOption?.description || '尺寸档位由 preset 约束，并写回当前 session layout。';

  const detailList = document.createElement('ul');
  detailList.className = 'inspector-list inspector-list--compact';

  [
    ['允许尺寸', options.map((option) => option.value).join(' / ')],
    ['当前档位', selectedBlock.size],
    ['应用方式', '语义档位，不使用像素拖拽']
  ].forEach(([term, value]) => {
    const item = document.createElement('li');
    const itemLabel = document.createElement('span');
    const itemValue = document.createElement('code');

    itemLabel.textContent = term;
    itemValue.textContent = value;
    item.append(itemLabel, itemValue);
    detailList.append(item);
  });

  group.append(label, title, controls, description, detailList);
  return group;
}

function createInspector(selectedBlock, preset, activeTemplate) {
  const panel = document.createElement('section');
  panel.className = 'inspector-panel';

  const title = document.createElement('h2');
  title.className = 'panel-title';
  title.textContent = '区块检查器';

  const description = document.createElement('p');
  description.className = 'panel-copy';
  description.textContent = 'Phase 2-C 在共享文档模型上加入 preset 驱动的尺寸档位、布局持久化与预览响应。';

  const presetInfo = document.createElement('div');
  presetInfo.className = 'inspector-group';
  presetInfo.innerHTML = `<span class="inspector-label">当前版式</span><strong>${preset.label} · ${activeTemplate.label}</strong><small>${activeTemplate.description || preset.description}</small>`;

  const blockInfo = document.createElement('div');
  blockInfo.className = 'inspector-group';

  if (selectedBlock) {
    blockInfo.innerHTML = `
      <span class="inspector-label">已选中区块</span>
      <strong>${selectedBlock.title}</strong>
      <ul class="inspector-list">
        <li><span>Block ID</span><code>${selectedBlock.id}</code></li>
        <li><span>Block Type</span><code>${selectedBlock.type}</code></li>
        <li><span>Zone</span><code>${selectedBlock.zoneId}</code></li>
        <li><span>Order</span><code>${selectedBlock.order}</code></li>
        <li><span>Content Ref</span><code>${selectedBlock.contentRef}</code></li>
        <li><span>Size</span><code>${selectedBlock.size}</code></li>
        <li><span>Locked</span><code>${selectedBlock.locked ? '是' : '否'}</code></li>
      </ul>
    `;
  } else {
    blockInfo.innerHTML = '<span class="inspector-label">已选中区块</span><strong>尚未选择</strong>';
  }

  const movementInfo = document.createElement('div');
  movementInfo.className = 'inspector-group';

  if (selectedBlock) {
    const movementStatus = state.activeMoveBlockId === selectedBlock.id
      ? '正在拖动'
      : selectedBlock.locked
        ? '位置锁定'
        : '可通过拖动手柄排序';

    movementInfo.innerHTML = `
      <span class="inspector-label">布局移动</span>
      <strong>${movementStatus}</strong>
      <ul class="inspector-list inspector-list--compact">
        <li><span>允许 Zone</span><code>${selectedBlock.allowedZoneIds.join(' / ')}</code></li>
        <li><span>当前状态</span><code>${state.activeMoveBlockId === selectedBlock.id ? '拖动进行中' : '手柄待命'}</code></li>
        <li><span>交互范围</span><code>同区换位 / 合法跨区 / 非法回退</code></li>
      </ul>
    `;
  } else {
    movementInfo.innerHTML = '<span class="inspector-label">布局移动</span><strong>尚未选择</strong>';
  }

  panel.append(title, description, presetInfo, blockInfo, movementInfo, createSizeInspectorGroup(selectedBlock, preset), createEditStatusGroup());
  return panel;
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

function createPresetSwitcher() {
  const wrap = document.createElement('div');
  wrap.className = 'preset-switcher';

  listPresets().forEach((preset) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'preset-button';
    button.textContent = preset.label;
    button.dataset.active = String(state.presetId === preset.id);
    button.addEventListener('click', () => {
      commitActiveEdit({ rerender: false });
      resetActiveMoveState();
      state.presetId = preset.id;
      state.sessionDocument = activateDocumentPreset(state.sessionDocument, preset);
      ensureSelectedBlock(state.sessionDocument.layout);
      renderApp();
    });
    wrap.append(button);
  });

  return wrap;
}

function createTemplateSwitcher(preset) {
  const wrap = document.createElement('div');
  wrap.className = 'preset-switcher';

  const label = document.createElement('span');
  label.className = 'inspector-label';
  label.textContent = '布局模板';

  const copy = document.createElement('small');
  copy.textContent = '模板切换只替换当前 preset 的布局层，内容编辑与该模板已保存的排序/尺寸会继续保留。';

  wrap.append(label, copy);

  listPresetTemplates(preset).forEach((template) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'preset-button';
    button.textContent = template.label;
    button.title = template.description || template.label;
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
    wrap.append(button);
  });

  return wrap;
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
    <p class="kicker">隔离工作区 · Phase 2-C</p>
    <h1>约束式多版式编辑器原型</h1>
    <p>共享文档模型驱动 cards / classic 与模板切换预览，当前实现直编、受约束拖动、尺寸档位与模板级布局持久化闭环。</p>
  `;

  sidebar.append(masthead, createPresetSwitcher(), createTemplateSwitcher(preset), createInspector(selectedBlock, preset, activeTemplate));

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
