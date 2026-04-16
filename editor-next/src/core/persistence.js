import { DEFAULT_STYLE, createEditorDocument } from './document.js';
import { ensureResumeEntityIds } from './ids.js';
import { canPlaceBlock, normalizeZoneOrders } from './layout-ops.js';
import { getPreset, getPresetLayoutTemplate, listPresets } from './presets.js';

import { sampleResumeSeed } from '../sample-document.js';

export const EDITOR_PERSISTENCE_KEY = 'editor-next.prototype.session.v1';
export const EDITOR_PERSISTENCE_VERSION = 1;

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function createLayoutStorageKey(presetId, templateId) {
  return `${presetId}:${templateId}`;
}

function parseLayoutStorageKey(layoutStorageKey) {
  if (!isNonEmptyString(layoutStorageKey)) {
    return null;
  }

  const separatorIndex = layoutStorageKey.indexOf(':');
  if (separatorIndex <= 0 || separatorIndex >= layoutStorageKey.length - 1) {
    return null;
  }

  return {
    presetId: layoutStorageKey.slice(0, separatorIndex),
    templateId: layoutStorageKey.slice(separatorIndex + 1)
  };
}

function isKnownPresetId(presetId) {
  if (!isNonEmptyString(presetId)) {
    return false;
  }

  try {
    getPreset(presetId);
    return true;
  } catch {
    return false;
  }
}

function isKnownTemplateId(presetId, templateId) {
  if (!isKnownPresetId(presetId) || !isNonEmptyString(templateId)) {
    return false;
  }

  try {
    getPresetLayoutTemplate(presetId, templateId);
    return true;
  } catch {
    return false;
  }
}

function createBaseLayout(presetId, templateId) {
  return createEditorDocument(sampleResumeSeed, getPreset(presetId), templateId).layout;
}

function restoreContent(persistedContent, fallbackContent) {
  if (!isPlainObject(persistedContent)) {
    return ensureResumeEntityIds(fallbackContent);
  }

  return ensureResumeEntityIds({
    ...fallbackContent,
    ...persistedContent,
    profile: {
      ...fallbackContent.profile,
      ...(isPlainObject(persistedContent.profile) ? persistedContent.profile : {})
    },
    summary: {
      ...fallbackContent.summary,
      ...(isPlainObject(persistedContent.summary) ? persistedContent.summary : {})
    },
    skills: Array.isArray(persistedContent.skills) ? persistedContent.skills : fallbackContent.skills,
    education: Array.isArray(persistedContent.education) ? persistedContent.education : fallbackContent.education,
    experiences: Array.isArray(persistedContent.experiences) ? persistedContent.experiences : fallbackContent.experiences,
    projects: Array.isArray(persistedContent.projects) ? persistedContent.projects : fallbackContent.projects
  });
}

function restoreStyle(persistedStyle, fallbackStyle) {
  const nextStyle = {
    ...DEFAULT_STYLE,
    ...fallbackStyle
  };

  if (!isPlainObject(persistedStyle)) {
    return nextStyle;
  }

  Object.entries(persistedStyle).forEach(([key, value]) => {
    if (typeof value === 'string' && value.trim() !== '') {
      nextStyle[key] = value;
    }
  });

  return nextStyle;
}

function restoreLayout(presetId, templateId, persistedLayout) {
  const preset = getPreset(presetId);
  const baseLayout = createBaseLayout(presetId, templateId);

  if (!isPlainObject(persistedLayout) || !Array.isArray(persistedLayout.blocks)) {
    return baseLayout;
  }

  const blockTemplates = new Map(preset.blockTemplates.map((block) => [block.id, block]));
  const zoneIds = new Set(baseLayout.zones.map((zone) => zone.id));
  const defaultOrders = new Map(baseLayout.blocks.map((block) => [block.id, block.order]));
  const persistedBlocks = new Map();

  persistedLayout.blocks.forEach((block) => {
    if (!isPlainObject(block) || !isNonEmptyString(block.id) || persistedBlocks.has(block.id)) {
      return;
    }

    persistedBlocks.set(block.id, block);
  });

  const blocksByZone = new Map(baseLayout.zones.map((zone) => [zone.id, []]));

  baseLayout.blocks.forEach((baseBlock) => {
    const template = blockTemplates.get(baseBlock.id);
    const persistedBlock = persistedBlocks.get(baseBlock.id);
    const canRestoreZone = isNonEmptyString(persistedBlock?.zoneId)
      && zoneIds.has(persistedBlock.zoneId)
      && canPlaceBlock(preset, baseBlock, persistedBlock.zoneId);
    const canRestoreSize = isNonEmptyString(persistedBlock?.size)
      && (persistedBlock.size === baseBlock.size || (!baseBlock.locked && template.allowedSizes.includes(persistedBlock.size)));

    blocksByZone.get(canRestoreZone ? persistedBlock.zoneId : baseBlock.zoneId)?.push({
      ...baseBlock,
      order: Number.isInteger(persistedBlock?.order) && persistedBlock.order >= 0
        ? persistedBlock.order
        : defaultOrders.get(baseBlock.id) || 0,
      size: canRestoreSize ? persistedBlock.size : baseBlock.size,
      zoneId: canRestoreZone ? persistedBlock.zoneId : baseBlock.zoneId,
      __defaultOrder: defaultOrders.get(baseBlock.id) || 0
    });
  });

  const nextBlocks = [];

  baseLayout.zones.forEach((zone) => {
    const zoneBlocks = blocksByZone.get(zone.id) || [];

    zoneBlocks.sort((left, right) => {
      if (left.order === right.order) {
        return left.__defaultOrder - right.__defaultOrder;
      }

      return left.order - right.order;
    });

    nextBlocks.push(...zoneBlocks.map(({ __defaultOrder, ...block }) => block));
  });

  return {
    ...baseLayout,
    blocks: normalizeZoneOrders(nextBlocks)
  };
}

function restoreActiveTemplateIdByPreset(persistedTemplateMap) {
  const nextTemplateMap = {};

  listPresets().forEach((preset) => {
    const templateId = isPlainObject(persistedTemplateMap) ? persistedTemplateMap[preset.id] : null;

    nextTemplateMap[preset.id] = isKnownTemplateId(preset.id, templateId)
      ? templateId
      : preset.defaultTemplateId;
  });

  return nextTemplateMap;
}

function restoreLayoutsByPresetTemplate(persistedLayoutsByPresetTemplate) {
  const nextLayouts = {};

  if (!isPlainObject(persistedLayoutsByPresetTemplate)) {
    return nextLayouts;
  }

  Object.entries(persistedLayoutsByPresetTemplate).forEach(([layoutStorageKey, persistedLayout]) => {
    const parsedKey = parseLayoutStorageKey(layoutStorageKey);
    if (!parsedKey || !isKnownTemplateId(parsedKey.presetId, parsedKey.templateId)) {
      return;
    }

    nextLayouts[layoutStorageKey] = restoreLayout(parsedKey.presetId, parsedKey.templateId, persistedLayout);
  });

  return nextLayouts;
}

function ensureStoredLayouts(layoutsByPresetTemplate, activeTemplateIdByPreset) {
  const nextLayouts = { ...layoutsByPresetTemplate };

  Object.entries(activeTemplateIdByPreset).forEach(([presetId, templateId]) => {
    const layoutStorageKey = createLayoutStorageKey(presetId, templateId);
    if (!nextLayouts[layoutStorageKey]) {
      nextLayouts[layoutStorageKey] = restoreLayout(presetId, templateId, null);
    }
  });

  return nextLayouts;
}

function buildLayoutsByPreset(layoutsByPresetTemplate, activeTemplateIdByPreset) {
  const layoutsByPreset = {};

  Object.entries(activeTemplateIdByPreset).forEach(([presetId, templateId]) => {
    layoutsByPreset[presetId] = layoutsByPresetTemplate[createLayoutStorageKey(presetId, templateId)];
  });

  return layoutsByPreset;
}

function createFallbackSessionDocument(fallbackDocument, presetId) {
  const nextDocument = createEditorDocument(fallbackDocument.content, getPreset(presetId));

  return {
    ...nextDocument,
    style: restoreStyle(fallbackDocument.style, DEFAULT_STYLE)
  };
}

function restoreSessionDocument(persistedDocument, fallbackDocument, presetId) {
  if (!isPlainObject(persistedDocument)) {
    return createFallbackSessionDocument(fallbackDocument, presetId);
  }

  const activeTemplateIdByPreset = restoreActiveTemplateIdByPreset(persistedDocument.activeTemplateIdByPreset);
  const layoutsByPresetTemplate = ensureStoredLayouts(
    restoreLayoutsByPresetTemplate(persistedDocument.layoutsByPresetTemplate),
    activeTemplateIdByPreset
  );
  const activeTemplateId = activeTemplateIdByPreset[presetId] || getPreset(presetId).defaultTemplateId;
  const layoutsByPreset = buildLayoutsByPreset(layoutsByPresetTemplate, activeTemplateIdByPreset);

  return {
    activeTemplateId,
    activeTemplateIdByPreset,
    content: restoreContent(persistedDocument.content, fallbackDocument.content),
    style: restoreStyle(persistedDocument.style, fallbackDocument.style),
    layout: layoutsByPreset[presetId],
    layoutsByPreset,
    layoutsByPresetTemplate
  };
}

export function createPersistableEditorState(state) {
  return {
    version: EDITOR_PERSISTENCE_VERSION,
    presetId: state.presetId,
    selectedBlockId: state.selectedBlockId ?? null,
    sessionDocument: {
      activeTemplateIdByPreset: state.sessionDocument.activeTemplateIdByPreset,
      content: state.sessionDocument.content,
      layoutsByPresetTemplate: state.sessionDocument.layoutsByPresetTemplate,
      style: state.sessionDocument.style
    }
  };
}

export function serializePersistedEditorState(state) {
  return JSON.stringify(createPersistableEditorState(state));
}

export function hydratePersistedEditorState(snapshot, fallbackState) {
  if (!isPlainObject(snapshot) || snapshot.version !== EDITOR_PERSISTENCE_VERSION) {
    return fallbackState;
  }

  const presetId = isKnownPresetId(snapshot.presetId) ? snapshot.presetId : fallbackState.presetId;
  const selectedBlockId = snapshot.selectedBlockId === null || isNonEmptyString(snapshot.selectedBlockId)
    ? snapshot.selectedBlockId
    : fallbackState.selectedBlockId;

  return {
    presetId,
    selectedBlockId,
    sessionDocument: restoreSessionDocument(snapshot.sessionDocument, fallbackState.sessionDocument, presetId)
  };
}

export function restorePersistedEditorState(rawValue, fallbackState) {
  if (!isNonEmptyString(rawValue)) {
    return fallbackState;
  }

  try {
    return hydratePersistedEditorState(JSON.parse(rawValue), fallbackState);
  } catch {
    return fallbackState;
  }
}

export function readPersistedEditorState(storage, createFallbackState) {
  const fallbackState = createFallbackState();

  if (!storage || typeof storage.getItem !== 'function') {
    return fallbackState;
  }

  try {
    const rawValue = storage.getItem(EDITOR_PERSISTENCE_KEY);
    const restoredState = restorePersistedEditorState(rawValue, fallbackState);

    if (rawValue && restoredState === fallbackState && typeof storage.removeItem === 'function') {
      storage.removeItem(EDITOR_PERSISTENCE_KEY);
    }

    return restoredState;
  } catch {
    return fallbackState;
  }
}

export function writePersistedEditorState(storage, state) {
  if (!storage || typeof storage.setItem !== 'function') {
    return false;
  }

  try {
    storage.setItem(EDITOR_PERSISTENCE_KEY, serializePersistedEditorState(state));
    return true;
  } catch {
    return false;
  }
}
