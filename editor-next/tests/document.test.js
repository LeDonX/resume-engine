import test from 'node:test';
import assert from 'node:assert/strict';

import {
  activateDocumentTemplate,
  activateDocumentPreset,
  createEditorDocument,
  getBlockMetadata,
  projectDocumentToPreset,
  readEditPathValue,
  updateDocumentContent,
  updateDocumentLayout,
  writeEditPathValue
} from '../src/core/document.js';
import { getBlocksForZone, moveBlock, resizeBlock } from '../src/core/layout-ops.js';
import { cardsPreset } from '../src/presets/cards.js';
import { classicPreset } from '../src/presets/classic.js';
import { sampleResumeSeed } from '../src/sample-document.js';

test('createEditorDocument returns unified content/style/layout shape for cards', () => {
  const documentModel = createEditorDocument(sampleResumeSeed, cardsPreset);

  assert.equal(documentModel.activeTemplateId, 'cards.default');
  assert.equal(documentModel.layout.presetId, 'cards');
  assert.equal(documentModel.layout.templateId, 'cards.default');
  assert.ok(documentModel.content.profile.id);
  assert.ok(documentModel.style.accent);
  assert.equal(documentModel.layout.zones.length, 2);
  assert.equal(documentModel.layout.blocks.length, 6);
});

test('createEditorDocument returns unified layout shape for classic', () => {
  const documentModel = createEditorDocument(sampleResumeSeed, classicPreset);

  assert.equal(documentModel.layout.presetId, 'classic');
  assert.equal(documentModel.layout.templateId, 'classic.default');
  assert.equal(documentModel.layout.zones.length, 3);
  assert.equal(documentModel.layout.blocks[0].id, 'block_profile');
});

test('getBlockMetadata exposes stable DOM attributes', () => {
  const documentModel = createEditorDocument(sampleResumeSeed, cardsPreset);
  const metadata = getBlockMetadata(documentModel.layout.blocks[0]);

  assert.deepEqual(metadata, {
    'data-block-id': 'block_profile',
    'data-zone-id': 'cards.sidebar',
    'data-block-type': 'profile',
    'data-content-ref': 'profile',
    'data-size-tier': 'L'
  });
});

test('edit path helpers read and write nested document values immutably', () => {
  const documentModel = createEditorDocument(sampleResumeSeed, cardsPreset);
  const nextContent = writeEditPathValue(
    documentModel.content,
    'experiences[0].highlights[1].text',
    '用直编路径更新后的亮点描述。'
  );

  assert.equal(readEditPathValue(documentModel.content, 'profile.name'), '林知遥');
  assert.equal(nextContent.experiences[0].highlights[1].text, '用直编路径更新后的亮点描述。');
  assert.equal(documentModel.content.experiences[0].highlights[1].text, '搭建 block metadata 与 selection 基线，降低后续交互接入成本。');
  assert.equal(nextContent.projects[0], documentModel.content.projects[0]);
});

test('template switching restores per-template layouts inside the same preset', () => {
  const documentModel = createEditorDocument(sampleResumeSeed, cardsPreset);
  const movedDefaultLayout = moveBlock(documentModel.layout, cardsPreset, 'block_projects', 'cards.sidebar', 1);
  const defaultUpdatedDocument = updateDocumentLayout(documentModel, movedDefaultLayout);
  const sidebarFocusDocument = activateDocumentTemplate(defaultUpdatedDocument, cardsPreset, 'cards.sidebar-focus');
  const resizedSidebarFocusLayout = resizeBlock(sidebarFocusDocument.layout, cardsPreset, 'block_skills', 'S');
  const sidebarFocusUpdatedDocument = updateDocumentLayout(sidebarFocusDocument, resizedSidebarFocusLayout);
  const roundTripDefaultDocument = activateDocumentTemplate(sidebarFocusUpdatedDocument, cardsPreset, 'cards.default');
  const roundTripSidebarFocusDocument = activateDocumentTemplate(roundTripDefaultDocument, cardsPreset, 'cards.sidebar-focus');

  assert.equal(sidebarFocusDocument.layout.templateId, 'cards.sidebar-focus');
  assert.deepEqual(getBlocksForZone(sidebarFocusDocument.layout, 'cards.sidebar').map((block) => block.id), [
    'block_profile',
    'block_projects',
    'block_education'
  ]);
  assert.deepEqual(getBlocksForZone(roundTripDefaultDocument.layout, 'cards.sidebar').map((block) => block.id), [
    'block_profile',
    'block_projects',
    'block_skills',
    'block_education'
  ]);
  assert.equal(roundTripSidebarFocusDocument.layout.blocks.find((block) => block.id === 'block_skills')?.size, 'S');
  assert.equal(roundTripDefaultDocument.layout.blocks.find((block) => block.id === 'block_skills')?.size, 'M');
});

test('preset switching remembers the active template for each preset', () => {
  const documentModel = createEditorDocument(sampleResumeSeed, cardsPreset);
  const sidebarFocusDocument = activateDocumentTemplate(documentModel, cardsPreset, 'cards.sidebar-focus');
  const classicDocument = activateDocumentPreset(sidebarFocusDocument, classicPreset);
  const roundTripCardsDocument = activateDocumentPreset(classicDocument, cardsPreset);

  assert.equal(classicDocument.layout.templateId, 'classic.default');
  assert.equal(roundTripCardsDocument.layout.templateId, 'cards.sidebar-focus');
  assert.equal(roundTripCardsDocument.activeTemplateId, 'cards.sidebar-focus');
});

test('updateDocumentContent preserves session safety and supports preset projection', () => {
  const documentModel = createEditorDocument(sampleResumeSeed, cardsPreset);
  const updatedDocument = updateDocumentContent(documentModel, 'projects[0].summary', '共享模型上的项目摘要已更新。');
  const classicProjection = projectDocumentToPreset(updatedDocument, classicPreset);

  assert.notEqual(updatedDocument, documentModel);
  assert.notEqual(updatedDocument.content, documentModel.content);
  assert.equal(updatedDocument.layout, documentModel.layout);
  assert.equal(documentModel.content.projects[0].summary, '以统一文档模型承载多版式编辑、打印和未来交互约束。');
  assert.equal(classicProjection.content.projects[0].summary, '共享模型上的项目摘要已更新。');
  assert.equal(classicProjection.layout.presetId, 'classic');
  assert.equal(classicProjection.layout.templateId, 'classic.default');
});

test('layout updates persist inside the session document across preset switches', () => {
  const documentModel = createEditorDocument(sampleResumeSeed, cardsPreset);
  const movedLayout = moveBlock(documentModel.layout, cardsPreset, 'block_projects', 'cards.sidebar', 1);
  const updatedDocument = updateDocumentLayout(documentModel, movedLayout);
  const cardsProjection = projectDocumentToPreset(updatedDocument, cardsPreset);
  const classicDocument = activateDocumentPreset(updatedDocument, classicPreset);
  const roundTripDocument = activateDocumentPreset(classicDocument, cardsPreset);

  assert.deepEqual(getBlocksForZone(cardsProjection.layout, 'cards.sidebar').map((block) => block.id), [
    'block_profile',
    'block_projects',
    'block_skills',
    'block_education'
  ]);
  assert.equal(cardsProjection.layout.templateId, 'cards.default');
  assert.equal(classicDocument.layout.presetId, 'classic');
  assert.equal(classicDocument.layout.templateId, 'classic.default');
  assert.deepEqual(getBlocksForZone(roundTripDocument.layout, 'cards.sidebar').map((block) => block.id), [
    'block_profile',
    'block_projects',
    'block_skills',
    'block_education'
  ]);
});

test('size changes persist inside the session document and stay render-safe', () => {
  const documentModel = createEditorDocument(sampleResumeSeed, cardsPreset);
  const resizedLayout = resizeBlock(documentModel.layout, cardsPreset, 'block_projects', 'L');
  const updatedDocument = updateDocumentLayout(documentModel, resizedLayout);
  const cardsProjection = projectDocumentToPreset(updatedDocument, cardsPreset);
  const classicDocument = activateDocumentPreset(updatedDocument, classicPreset);
  const roundTripDocument = activateDocumentPreset(classicDocument, cardsPreset);
  const resizedBlock = roundTripDocument.layout.blocks.find((block) => block.id === 'block_projects');

  assert.equal(cardsProjection.layout.blocks.find((block) => block.id === 'block_projects')?.size, 'L');
  assert.equal(classicDocument.layout.blocks.find((block) => block.id === 'block_projects')?.size, 'M');
  assert.equal(resizedBlock?.size, 'L');
  assert.deepEqual(getBlockMetadata(resizedBlock), {
    'data-block-id': 'block_projects',
    'data-zone-id': 'cards.main',
    'data-block-type': 'projects',
    'data-content-ref': 'projects',
    'data-size-tier': 'L'
  });
});

test('edit path helpers reject invalid paths for safe updates', () => {
  const documentModel = createEditorDocument(sampleResumeSeed, cardsPreset);

  assert.throws(() => {
    readEditPathValue(documentModel.content, 'skills[99].label');
  }, /不存在/);

  assert.throws(() => {
    writeEditPathValue(documentModel.content, 'profile.missingField', '测试');
  }, /不存在/);
});
