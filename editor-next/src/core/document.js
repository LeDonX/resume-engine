import { ensureResumeEntityIds } from './ids.js';
import { normalizeZoneOrders } from './layout-ops.js';

const EDIT_PATH_TOKEN = /([^[.\]]+)|\[(\d+)\]/g;

export const DEFAULT_STYLE = Object.freeze({
  accent: 'emerald',
  density: 'comfortable',
  fontPair: 'serif-sans',
  surface: 'mist'
});

function createContent(seed) {
  const normalizedSeed = ensureResumeEntityIds(seed);

  return {
    profile: normalizedSeed.profile,
    summary: normalizedSeed.summary,
    skills: normalizedSeed.skills,
    education: normalizedSeed.education,
    experiences: normalizedSeed.experiences,
    projects: normalizedSeed.projects
  };
}

function createLayoutStorageKey(presetId, templateId) {
  return `${presetId}:${templateId}`;
}

function getPresetLayoutTemplate(preset, templateId) {
  return preset.layoutTemplates.find((template) => template.id === templateId) || null;
}

function getDefaultTemplateId(preset) {
  return preset.defaultTemplateId;
}

function getDocumentTemplateId(documentModel, preset) {
  return documentModel.activeTemplateIdByPreset?.[preset.id] || getDefaultTemplateId(preset);
}

function createLayoutState(preset, templateId = getDefaultTemplateId(preset)) {
  const layoutTemplate = getPresetLayoutTemplate(preset, templateId);
  if (!layoutTemplate) {
    throw new Error(`Preset ${preset.id} 不存在 template：${templateId}`);
  }

  const blockCatalog = new Map(preset.blockTemplates.map((block) => [block.id, block]));

  return {
    presetId: preset.id,
    templateId: layoutTemplate.id,
    zones: preset.zones.map((zone) => ({ ...zone })),
    blocks: normalizeZoneOrders(
      layoutTemplate.blocks.map((templateBlock) => {
        const block = blockCatalog.get(templateBlock.blockId);
        if (!block) {
          throw new Error(`Preset ${preset.id} 的 template ${layoutTemplate.id} 引用了未知 block：${templateBlock.blockId}`);
        }

        const { allowedSizes, sizeOptions, ...catalogBlock } = block;

        return {
          ...catalogBlock,
          order: templateBlock.order,
          size: templateBlock.size,
          zoneId: templateBlock.zoneId,
          metadata: {
            contentRef: block.contentRef,
            title: block.title
          }
        };
      })
    )
  };
}

function cloneLayoutState(layout) {
  return {
    presetId: layout.presetId,
    templateId: layout.templateId,
    zones: layout.zones.map((zone) => ({ ...zone })),
    blocks: layout.blocks.map((block) => {
      const { allowedSizes, sizeOptions, ...layoutBlock } = block;

      return {
        ...layoutBlock,
        allowedZoneIds: [...block.allowedZoneIds],
        metadata: block.metadata ? { ...block.metadata } : undefined
      };
    })
  };
}

function getStoredLayout(documentModel, presetId, templateId) {
  return documentModel.layoutsByPresetTemplate?.[createLayoutStorageKey(presetId, templateId)] || null;
}

function tokenizeEditPath(editPath) {
  if (typeof editPath !== 'string' || editPath.trim() === '') {
    throw new Error('editPath 必须是非空字符串');
  }

  const tokens = [];
  let cursor = 0;

  for (const match of editPath.matchAll(EDIT_PATH_TOKEN)) {
    if (match.index !== cursor) {
      const hasDotSeparator = editPath[cursor] === '.' && match.index === cursor + 1;
      if (!hasDotSeparator) {
        throw new Error(`非法 editPath：${editPath}`);
      }

      cursor += 1;
    }

    tokens.push(match[1] ?? Number(match[2]));
    cursor = match.index + match[0].length;
  }

  if (cursor !== editPath.length || tokens.length === 0) {
    throw new Error(`非法 editPath：${editPath}`);
  }

  return tokens;
}

function assertPathToken(target, token, editPath) {
  if (Array.isArray(target)) {
    const isValidIndex = typeof token === 'number' && token >= 0 && token < target.length;
    if (!isValidIndex) {
      throw new Error(`editPath 指向了不存在的数组项：${editPath}`);
    }

    return;
  }

  if (!target || typeof target !== 'object' || typeof token !== 'string' || !(token in target)) {
    throw new Error(`editPath 指向了不存在的字段：${editPath}`);
  }
}

function writeValueAtTokens(target, tokens, nextValue, editPath) {
  if (tokens.length === 0) {
    return nextValue;
  }

  const [currentToken, ...restTokens] = tokens;
  assertPathToken(target, currentToken, editPath);

  if (Array.isArray(target)) {
    return target.map((item, index) => {
      if (index !== currentToken) {
        return item;
      }

      return writeValueAtTokens(item, restTokens, nextValue, editPath);
    });
  }

  return {
    ...target,
    [currentToken]: writeValueAtTokens(target[currentToken], restTokens, nextValue, editPath)
  };
}

export function createEditorDocument(seed, preset, templateId = getDefaultTemplateId(preset)) {
  const layout = createLayoutState(preset, templateId);
  const layoutStorageKey = createLayoutStorageKey(layout.presetId, layout.templateId);

  return {
    activeTemplateId: layout.templateId,
    activeTemplateIdByPreset: {
      [preset.id]: layout.templateId
    },
    content: createContent(seed),
    style: { ...DEFAULT_STYLE },
    layout,
    layoutsByPreset: {
      [preset.id]: cloneLayoutState(layout)
    },
    layoutsByPresetTemplate: {
      [layoutStorageKey]: cloneLayoutState(layout)
    }
  };
}

export function projectDocumentToPreset(documentModel, preset, templateId = getDocumentTemplateId(documentModel, preset)) {
  const storedLayout = getStoredLayout(documentModel, preset.id, templateId);

  return {
    activeTemplateId: templateId,
    content: documentModel.content,
    style: documentModel.style,
    layout: storedLayout ? cloneLayoutState(storedLayout) : createLayoutState(preset, templateId)
  };
}

export function updateDocumentLayout(documentModel, nextLayout) {
  const layout = cloneLayoutState(nextLayout);
  const layoutStorageKey = createLayoutStorageKey(layout.presetId, layout.templateId);

  return {
    ...documentModel,
    activeTemplateId: layout.templateId,
    activeTemplateIdByPreset: {
      ...documentModel.activeTemplateIdByPreset,
      [layout.presetId]: layout.templateId
    },
    layout,
    layoutsByPreset: {
      ...documentModel.layoutsByPreset,
      [layout.presetId]: cloneLayoutState(layout)
    },
    layoutsByPresetTemplate: {
      ...documentModel.layoutsByPresetTemplate,
      [layoutStorageKey]: cloneLayoutState(layout)
    }
  };
}

export function activateDocumentPreset(documentModel, preset, templateId = getDocumentTemplateId(documentModel, preset)) {
  const nextLayout = getStoredLayout(documentModel, preset.id, templateId) || createLayoutState(preset, templateId);
  return updateDocumentLayout(documentModel, nextLayout);
}

export function activateDocumentTemplate(documentModel, preset, templateId) {
  return activateDocumentPreset(documentModel, preset, templateId);
}

export function getContentByBlock(document, block) {
  const ref = block.contentRef;
  return document.content[ref] || null;
}

export function readEditPathValue(source, editPath) {
  return tokenizeEditPath(editPath).reduce((currentValue, token) => {
    assertPathToken(currentValue, token, editPath);
    return currentValue[token];
  }, source);
}

export function writeEditPathValue(source, editPath, nextValue) {
  return writeValueAtTokens(source, tokenizeEditPath(editPath), nextValue, editPath);
}

export function updateDocumentContent(documentModel, editPath, nextValue) {
  return {
    ...documentModel,
    content: writeEditPathValue(documentModel.content, editPath, nextValue)
  };
}

export function getBlockMetadata(block) {
  return {
    'data-block-id': block.id,
    'data-zone-id': block.zoneId,
    'data-block-type': block.type,
    'data-content-ref': block.contentRef,
    'data-size-tier': block.size
  };
}
