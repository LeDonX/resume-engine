import test from 'node:test';
import assert from 'node:assert/strict';

import {
  activateDocumentPreset,
  activateDocumentTemplate,
  createEditorDocument,
  updateDocumentContent,
  updateDocumentLayout
} from '../src/core/document.js';
import { getBlocksForZone, moveBlock, resizeBlock } from '../src/core/layout-ops.js';
import {
  EDITOR_PERSISTENCE_KEY,
  readPersistedEditorState,
  serializePersistedEditorState,
  writePersistedEditorState
} from '../src/core/persistence.js';
import { cardsPreset } from '../src/presets/cards.js';
import { classicPreset } from '../src/presets/classic.js';
import { sampleResumeSeed } from '../src/sample-document.js';

function createFallbackState() {
  return {
    presetId: 'cards',
    selectedBlockId: 'block_profile',
    sessionDocument: createEditorDocument(sampleResumeSeed, cardsPreset)
  };
}

function createMemoryStorage() {
  const values = new Map();

  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    removeItem(key) {
      values.delete(key);
    },
    setItem(key, value) {
      values.set(key, value);
    }
  };
}

test('persistence round trip restores durable editor state without transient edit session data', () => {
  const storage = createMemoryStorage();
  let sessionDocument = createEditorDocument(sampleResumeSeed, cardsPreset);

  sessionDocument = updateDocumentContent(sessionDocument, 'projects[0].summary', '本地持久化后的项目摘要。');

  const movedDefaultLayout = moveBlock(sessionDocument.layout, cardsPreset, 'block_projects', 'cards.sidebar', 1);
  sessionDocument = updateDocumentLayout(sessionDocument, movedDefaultLayout);
  sessionDocument = activateDocumentTemplate(sessionDocument, cardsPreset, 'cards.sidebar-focus');

  const resizedSidebarFocusLayout = resizeBlock(sessionDocument.layout, cardsPreset, 'block_skills', 'S');
  sessionDocument = updateDocumentLayout(sessionDocument, resizedSidebarFocusLayout);
  sessionDocument = activateDocumentPreset(sessionDocument, classicPreset);

  const rawSnapshot = serializePersistedEditorState({
    activeEditPath: 'projects[0].summary',
    activeMoveBlockId: 'block_projects',
    draftValue: '未提交草稿',
    presetId: 'classic',
    selectedBlockId: 'block_profile',
    sessionDocument
  });

  assert.doesNotMatch(rawSnapshot, /activeEditPath|activeMoveBlockId|draftValue/);

  assert.equal(writePersistedEditorState(storage, {
    presetId: 'classic',
    selectedBlockId: 'block_profile',
    sessionDocument
  }), true);

  const restoredState = readPersistedEditorState(storage, createFallbackState);
  const restoredCardsDocument = activateDocumentPreset(restoredState.sessionDocument, cardsPreset);
  const restoredCardsDefaultDocument = activateDocumentTemplate(restoredCardsDocument, cardsPreset, 'cards.default');

  assert.equal(restoredState.presetId, 'classic');
  assert.equal(restoredState.selectedBlockId, 'block_profile');
  assert.equal(restoredState.sessionDocument.layout.presetId, 'classic');
  assert.equal(restoredState.sessionDocument.content.projects[0].summary, '本地持久化后的项目摘要。');
  assert.equal(restoredState.sessionDocument.content.experiences[0].highlights[0].text, '主导多版式简历编辑器重构，统一 cards / classic 布局内核。');
  assert.equal(restoredCardsDocument.layout.templateId, 'cards.sidebar-focus');
  assert.equal(restoredCardsDocument.layout.blocks.find((block) => block.id === 'block_skills')?.size, 'S');
  assert.deepEqual(getBlocksForZone(restoredCardsDefaultDocument.layout, 'cards.sidebar').map((block) => block.id), [
    'block_profile',
    'block_projects',
    'block_skills',
    'block_education'
  ]);
});

test('persistence falls back safely when localStorage data is corrupted', () => {
  const fallbackState = createFallbackState();
  const storage = createMemoryStorage();

  storage.setItem(EDITOR_PERSISTENCE_KEY, '{broken json');

  const restoredState = readPersistedEditorState(storage, createFallbackState);

  assert.equal(restoredState.presetId, fallbackState.presetId);
  assert.equal(restoredState.selectedBlockId, fallbackState.selectedBlockId);
  assert.equal(restoredState.sessionDocument.layout.presetId, fallbackState.sessionDocument.layout.presetId);
  assert.equal(restoredState.sessionDocument.content.profile.name, fallbackState.sessionDocument.content.profile.name);
  assert.equal(storage.getItem(EDITOR_PERSISTENCE_KEY), null);
});

test('persistence migrates malformed legacy highlight payloads back to strings', () => {
  const storage = createMemoryStorage();
  const legacyState = createFallbackState();

  legacyState.sessionDocument.content.experiences[0].highlights = [
    {
      id: 'exp_01_hl_01',
      text: {
        id: 'legacy_text_01',
        text: '遗留存储中的亮点文案'
      }
    }
  ];

  storage.setItem(EDITOR_PERSISTENCE_KEY, JSON.stringify({
    version: 1,
    presetId: 'cards',
    selectedBlockId: 'block_profile',
    sessionDocument: {
      activeTemplateIdByPreset: legacyState.sessionDocument.activeTemplateIdByPreset,
      content: legacyState.sessionDocument.content,
      layoutsByPresetTemplate: legacyState.sessionDocument.layoutsByPresetTemplate,
      style: legacyState.sessionDocument.style
    }
  }));

  const restoredState = readPersistedEditorState(storage, createFallbackState);

  assert.equal(restoredState.sessionDocument.content.experiences[0].highlights[0].text, '遗留存储中的亮点文案');
});
