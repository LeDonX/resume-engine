import { getBlockMetadata, getContentByBlock } from '../core/document.js';
import { getBlockSizeOptions, getBlocksForZone } from '../core/layout-ops.js';
import { getZoneDragState } from './sortable-controller.js';

function applyDatasetAttributes(element, metadata) {
  for (const [key, value] of Object.entries(metadata)) {
    element.setAttribute(key, value);
  }
}

function createSectionHeader(block) {
  const header = document.createElement('header');
  header.className = 'block-header';

  const copy = document.createElement('div');
  copy.className = 'block-header__copy';

  const eyebrow = document.createElement('span');
  eyebrow.className = 'block-eyebrow';
  eyebrow.textContent = block.type;

  const title = document.createElement('h3');
  title.className = 'block-title';
  title.textContent = block.title;

  copy.append(eyebrow, title);

  const handle = document.createElement('button');
  handle.type = 'button';
  handle.className = 'drag-handle';
  handle.dataset.blockId = block.id;
  handle.dataset.dragHandle = 'true';
  handle.disabled = Boolean(block.locked);
  handle.title = block.locked ? '该区块位置已锁定' : `拖动 ${block.title}`;
  handle.setAttribute('aria-label', block.locked ? `${block.title} 已锁定` : `拖动 ${block.title}`);

  const grip = document.createElement('span');
  grip.className = 'drag-handle__grip';
  grip.setAttribute('aria-hidden', 'true');
  grip.textContent = '⋮⋮';

  const label = document.createElement('span');
  label.className = 'drag-handle__label';
  label.textContent = block.locked ? '锁定' : '拖动';

  handle.append(grip, label);
  header.append(copy, handle);
  return header;
}

function createSizeTierButtons(layout, preset, block) {
  const options = getBlockSizeOptions(layout, preset, block.id);
  const wrap = document.createElement('div');
  wrap.className = 'size-tier-group';
  wrap.dataset.sizeSurface = 'preview';

  options.forEach((option) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'size-tier-button';
    button.dataset.blockId = block.id;
    button.dataset.controlOrigin = 'preview';
    button.dataset.sizeState = option.state;
    button.dataset.sizeToggle = 'true';
    button.dataset.sizeValue = option.value;
    button.disabled = option.state !== 'valid';
    button.textContent = option.value;
    button.title = option.description || option.label;
    wrap.append(button);
  });

  return wrap;
}

function createSelectedBlockToolbar(layout, preset, block, interactionState, zoneLabel) {
  const activeSizeOption = getBlockSizeOptions(layout, preset, block.id).find((option) => option.state === 'active');
  const toolbar = document.createElement('div');
  toolbar.className = 'block-toolbar';

  const actions = document.createElement('div');
  actions.className = 'block-toolbar__actions';

  const summary = document.createElement('span');
  summary.className = 'block-toolbar__summary';
  summary.textContent = block.locked
    ? `当前位于 ${zoneLabel} · 尺寸 ${block.size}，该区块不参与换位。`
    : interactionState.activeMoveBlockId === block.id
      ? `正在拖动，松手后将按 preset 规则写回布局；当前尺寸为 ${activeSizeOption?.label || block.size}。`
      : `通过右上角拖动手柄换位；当前位于 ${zoneLabel} · 尺寸 ${activeSizeOption?.label || block.size}，支持同区换位与合法跨区移动。`;

  actions.append(createSizeTierButtons(layout, preset, block));
  toolbar.append(actions, summary);
  return toolbar;
}

function createEditableField(config, editingState) {
  const {
    className,
    display = 'block',
    label,
    multiline = false,
    path,
    tag,
    value
  } = config;
  const isActive = editingState.activeEditPath === path;
  const field = document.createElement(tag);

  field.className = [className, 'editable-field', `editable-field--${display}`].filter(Boolean).join(' ');
  field.dataset.editLabel = label;
  field.dataset.editPath = path;
  field.dataset.editMode = multiline ? 'textarea' : 'input';
  field.dataset.editActive = String(isActive);
  field.tabIndex = isActive ? -1 : 0;

  if (isActive) {
    field.classList.add('is-editing');

    const control = document.createElement(multiline ? 'textarea' : 'input');
    control.className = [
      'editable-control',
      multiline ? 'editable-control--textarea' : 'editable-control--input'
    ].join(' ');
    control.dataset.activeEditControl = 'true';
    control.dataset.editLabel = label;
    control.dataset.editPath = path;
    control.value = editingState.draftValue;

    if (!multiline) {
      control.type = 'text';
    } else {
      control.rows = Math.min(Math.max(editingState.draftValue.split('\n').length, 2), 6);
    }

    field.append(control);
    return field;
  }

  field.textContent = value;
  return field;
}

function renderProfile(content, editingState) {
  const wrapper = document.createElement('div');
  wrapper.className = 'profile-card';

  const name = createEditableField(
    {
      className: 'profile-name',
      label: '姓名',
      path: 'profile.name',
      tag: 'h2',
      value: content.name
    },
    editingState
  );

  const role = createEditableField(
    {
      className: 'profile-role',
      label: '职位',
      path: 'profile.role',
      tag: 'p',
      value: content.role
    },
    editingState
  );

  const tagline = createEditableField(
    {
      className: 'profile-tagline',
      label: '个人标语',
      multiline: true,
      path: 'profile.tagline',
      tag: 'p',
      value: content.tagline
    },
    editingState
  );

  const meta = document.createElement('ul');
  meta.className = 'meta-list';
  [content.location, content.email, content.phone].forEach((text) => {
    const item = document.createElement('li');
    item.textContent = text;
    meta.append(item);
  });

  wrapper.append(name, role, tagline, meta);
  return wrapper;
}

function renderSummary(content, editingState) {
  return createEditableField(
    {
      className: 'summary-text',
      label: '个人摘要',
      multiline: true,
      path: 'summary.text',
      tag: 'p',
      value: content.text
    },
    editingState
  );
}

function renderSkills(content, editingState) {
  const list = document.createElement('ul');
  list.className = 'skill-list';

  content.forEach((item, index) => {
    const skill = document.createElement('li');
    skill.className = 'skill-pill';

    skill.append(
      createEditableField(
        {
          className: 'skill-pill__label',
          display: 'inline',
          label: `技能 ${index + 1} 标签`,
          path: `skills[${index}].label`,
          tag: 'strong',
          value: item.label
        },
        editingState
      ),
      createEditableField(
        {
          className: 'skill-pill__emphasis',
          display: 'inline',
          label: `技能 ${index + 1} 强度`,
          path: `skills[${index}].emphasis`,
          tag: 'span',
          value: item.emphasis
        },
        editingState
      )
    );

    list.append(skill);
  });

  return list;
}

function renderEducation(content, editingState) {
  const list = document.createElement('div');
  list.className = 'stack-list';

  content.forEach((item, index) => {
    const card = document.createElement('article');
    card.className = 'mini-card';

    card.append(
      createEditableField(
        {
          className: 'mini-card__title',
          label: `教育 ${index + 1} 学校`,
          path: `education[${index}].school`,
          tag: 'strong',
          value: item.school
        },
        editingState
      ),
      createEditableField(
        {
          className: 'mini-card__subtitle',
          label: `教育 ${index + 1} 学位`,
          path: `education[${index}].degree`,
          tag: 'span',
          value: item.degree
        },
        editingState
      ),
      createEditableField(
        {
          className: 'mini-card__meta',
          label: `教育 ${index + 1} 时间`,
          path: `education[${index}].period`,
          tag: 'small',
          value: item.period
        },
        editingState
      )
    );

    list.append(card);
  });

  return list;
}

function renderExperiences(content, editingState) {
  const list = document.createElement('div');
  list.className = 'timeline-list';

  content.forEach((item, itemIndex) => {
    const article = document.createElement('article');
    article.className = 'timeline-item';

    const heading = document.createElement('div');
    heading.className = 'timeline-heading';
    heading.append(
      createEditableField(
        {
          className: 'timeline-heading__title',
          label: `经历 ${itemIndex + 1} 职位`,
          path: `experiences[${itemIndex}].title`,
          tag: 'strong',
          value: item.title
        },
        editingState
      ),
      createEditableField(
        {
          className: 'timeline-heading__company',
          label: `经历 ${itemIndex + 1} 公司`,
          path: `experiences[${itemIndex}].company`,
          tag: 'span',
          value: item.company
        },
        editingState
      ),
      createEditableField(
        {
          className: 'timeline-heading__period',
          label: `经历 ${itemIndex + 1} 时间`,
          path: `experiences[${itemIndex}].period`,
          tag: 'small',
          value: item.period
        },
        editingState
      )
    );

    const bullets = document.createElement('ul');
    bullets.className = 'bullet-list';
    item.highlights.forEach((highlight, highlightIndex) => {
      const bullet = createEditableField(
        {
          className: 'bullet-list__item',
          label: `经历 ${itemIndex + 1} 亮点 ${highlightIndex + 1}`,
          multiline: true,
          path: `experiences[${itemIndex}].highlights[${highlightIndex}].text`,
          tag: 'li',
          value: highlight.text
        },
        editingState
      );

      bullets.append(bullet);
    });

    article.append(heading, bullets);
    list.append(article);
  });

  return list;
}

function renderProjects(content, editingState) {
  const list = document.createElement('div');
  list.className = 'project-grid';

  content.forEach((item, index) => {
    const card = document.createElement('article');
    card.className = 'project-card';

    card.append(
      createEditableField(
        {
          className: 'project-card__title',
          label: `项目 ${index + 1} 名称`,
          path: `projects[${index}].name`,
          tag: 'strong',
          value: item.name
        },
        editingState
      ),
      createEditableField(
        {
          className: 'project-card__summary',
          label: `项目 ${index + 1} 摘要`,
          multiline: true,
          path: `projects[${index}].summary`,
          tag: 'p',
          value: item.summary
        },
        editingState
      ),
      createEditableField(
        {
          className: 'project-card__impact',
          label: `项目 ${index + 1} 结果`,
          multiline: true,
          path: `projects[${index}].impact`,
          tag: 'small',
          value: item.impact
        },
        editingState
      )
    );

    list.append(card);
  });

  return list;
}

const CONTENT_RENDERERS = {
  education: renderEducation,
  experiences: renderExperiences,
  profile: renderProfile,
  projects: renderProjects,
  skills: renderSkills,
  summary: renderSummary
};

export function renderBlock(documentModel, preset, block, selectedBlockId, editingState, options = {}) {
  const { zoneLabel = block.zoneId } = options;
  const content = getContentByBlock(documentModel, block);
  const section = document.createElement('section');
  section.className = `editor-block editor-block--${block.type}`;
  section.classList.toggle('is-selected', block.id === selectedBlockId);
  section.dataset.sortableItem = 'true';
  section.tabIndex = 0;

  applyDatasetAttributes(section, getBlockMetadata(block));
  section.append(createSectionHeader(block));

  if (block.id === selectedBlockId) {
    section.append(createSelectedBlockToolbar(documentModel.layout, preset, block, editingState, zoneLabel));
  }

  const renderer = CONTENT_RENDERERS[block.type];
  section.append(renderer(content, editingState));
  return section;
}

function buildZone(documentModel, preset, zone, selectedBlockId, editingState) {
  const zoneElement = document.createElement('div');
  zoneElement.className = 'preview-zone';
  zoneElement.dataset.zoneId = zone.id;
  zoneElement.dataset.moveZoneState = getZoneDragState(documentModel.layout, preset, editingState.activeMoveBlockId, zone.id);

  const zoneTitle = document.createElement('div');
  zoneTitle.className = 'zone-label';
  zoneTitle.textContent = zone.label;

  const zoneBlocks = getBlocksForZone(documentModel.layout, zone.id);
  const blockList = document.createElement('div');
  blockList.className = 'zone-block-list';
  blockList.dataset.sortableZoneList = 'true';
  blockList.dataset.zoneEmpty = String(zoneBlocks.length === 0);
  blockList.dataset.zoneId = zone.id;

  zoneBlocks.forEach((block) => {
    blockList.append(
      renderBlock(documentModel, preset, block, selectedBlockId, editingState, {
        zoneLabel: zone.label
      })
    );
  });

  zoneElement.dataset.zoneEmpty = String(zoneBlocks.length === 0);
  zoneElement.append(zoneTitle, blockList);

  return zoneElement;
}

export function renderPreview(previewRoot, documentModel, preset, selectedBlockId, editingState) {
  previewRoot.replaceChildren();
  previewRoot.className = `preview-shell preview-shell--${preset.id}`;
  previewRoot.dataset.presetId = preset.id;
  previewRoot.dataset.templateId = documentModel.layout.templateId;

  preset.zones.forEach((zone) => {
    previewRoot.append(buildZone(documentModel, preset, zone, selectedBlockId, editingState));
  });
}
