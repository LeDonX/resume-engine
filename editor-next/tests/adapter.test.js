import test from 'node:test';
import assert from 'node:assert/strict';

import {
  canPlaceBlock,
  getBlockSizeOptions,
  getBlockSizeState,
  getBlocksForZone,
  getMoveTargetState,
  moveBlock,
  resizeBlock
} from '../src/core/layout-ops.js';
import { createEditorDocument } from '../src/core/document.js';
import { cardsPreset } from '../src/presets/cards.js';
import { sampleResumeSeed } from '../src/sample-document.js';
import { validateLayoutPreset } from '../src/core/preset-types.js';

test('preset schema rejects invalid zone references', () => {
  assert.throws(() => {
    validateLayoutPreset({
      id: 'broken',
      defaultTemplateId: 'broken.default',
      zones: [{ id: 'zone.a', label: 'A' }],
      blockTemplates: [
        {
          id: 'block_bad',
          type: 'summary',
          title: 'Bad',
          contentRef: 'summary',
          allowedZoneIds: ['zone.a'],
          allowedSizes: ['M']
        }
      ],
      layoutTemplates: [
        {
          id: 'broken.default',
          label: 'Broken',
          blocks: [
            {
              blockId: 'block_bad',
              zoneId: 'zone.missing',
              order: 0,
              size: 'M'
            }
          ]
        }
      ]
    });
  }, /不存在的 zone/);
});

test('canPlaceBlock follows preset placement rules', () => {
  const documentModel = createEditorDocument(sampleResumeSeed, cardsPreset);
  const profile = documentModel.layout.blocks.find((block) => block.id === 'block_profile');
  const skills = documentModel.layout.blocks.find((block) => block.id === 'block_skills');

  assert.equal(canPlaceBlock(cardsPreset, profile, 'cards.main'), false);
  assert.equal(canPlaceBlock(cardsPreset, skills, 'cards.main'), true);
});

test('moveBlock supports same-zone reorder and normalizes zone orders', () => {
  const documentModel = createEditorDocument(sampleResumeSeed, cardsPreset);
  const movedLayout = moveBlock(documentModel.layout, cardsPreset, 'block_skills', 'cards.sidebar', 2);
  const sidebarBlocks = getBlocksForZone(movedLayout, 'cards.sidebar');

  assert.deepEqual(sidebarBlocks.map((block) => block.id), ['block_profile', 'block_education', 'block_skills']);
  assert.deepEqual(sidebarBlocks.map((block) => block.order), [0, 1, 2]);
});

test('moveBlock supports legal cross-zone moves', () => {
  const documentModel = createEditorDocument(sampleResumeSeed, cardsPreset);
  const movedLayout = moveBlock(documentModel.layout, cardsPreset, 'block_projects', 'cards.sidebar', 1);
  const sidebarBlocks = getBlocksForZone(movedLayout, 'cards.sidebar');

  assert.deepEqual(sidebarBlocks.map((block) => block.id), ['block_profile', 'block_projects', 'block_skills', 'block_education']);
  assert.deepEqual(sidebarBlocks.map((block) => block.order), [0, 1, 2, 3]);
});

test('move target state exposes locked and invalid placements', () => {
  const documentModel = createEditorDocument(sampleResumeSeed, cardsPreset);
  const lockedCurrentSlot = getMoveTargetState(documentModel.layout, cardsPreset, 'block_profile', 'cards.sidebar', 0);
  const lockedCrossZone = getMoveTargetState(documentModel.layout, cardsPreset, 'block_profile', 'cards.main', 0);
  const invalidCrossZone = getMoveTargetState(documentModel.layout, cardsPreset, 'block_experiences', 'cards.sidebar', 0);
  const validCrossZone = getMoveTargetState(documentModel.layout, cardsPreset, 'block_skills', 'cards.main', 1);

  assert.equal(lockedCurrentSlot.state, 'active');
  assert.equal(lockedCrossZone.state, 'invalid');
  assert.equal(lockedCrossZone.reason, 'locked');
  assert.equal(invalidCrossZone.state, 'invalid');
  assert.equal(invalidCrossZone.reason, 'disallowed-zone');
  assert.equal(validCrossZone.state, 'valid');
  assert.equal(validCrossZone.isValidTarget, true);
});

test('moveBlock rejects invalid zone moves', () => {
  const documentModel = createEditorDocument(sampleResumeSeed, cardsPreset);

  assert.throws(() => {
    moveBlock(documentModel.layout, cardsPreset, 'block_profile', 'cards.main', 0);
  }, /已锁定/);

  assert.throws(() => {
    moveBlock(documentModel.layout, cardsPreset, 'block_experiences', 'cards.sidebar', 0);
  }, /不能移动/);
});

test('size helpers expose allowed size options and preserve active state', () => {
  const documentModel = createEditorDocument(sampleResumeSeed, cardsPreset);
  const options = getBlockSizeOptions(documentModel.layout, cardsPreset, 'block_projects');

  assert.deepEqual(options.map((option) => option.value), ['S', 'M', 'L']);
  assert.equal(options.find((option) => option.state === 'active')?.value, 'M');
  assert.equal(options.find((option) => option.value === 'L')?.isValidChange, true);
});

test('resizeBlock supports allowed size changes', () => {
  const documentModel = createEditorDocument(sampleResumeSeed, cardsPreset);
  const resizedLayout = resizeBlock(documentModel.layout, cardsPreset, 'block_summary', 'L');

  assert.equal(documentModel.layout.blocks.find((block) => block.id === 'block_summary')?.size, 'M');
  assert.equal(resizedLayout.blocks.find((block) => block.id === 'block_summary')?.size, 'L');
});

test('size helpers reject locked and unsupported size changes', () => {
  const documentModel = createEditorDocument(sampleResumeSeed, cardsPreset);
  const lockedState = getBlockSizeState(documentModel.layout, cardsPreset, 'block_profile', 'S');
  const unsupportedState = getBlockSizeState(documentModel.layout, cardsPreset, 'block_experiences', 'S');

  assert.equal(lockedState.state, 'invalid');
  assert.equal(lockedState.reason, 'locked');
  assert.equal(unsupportedState.state, 'invalid');
  assert.equal(unsupportedState.reason, 'unsupported-size');

  assert.throws(() => {
    resizeBlock(documentModel.layout, cardsPreset, 'block_profile', 'S');
  }, /已锁定/);

  assert.throws(() => {
    resizeBlock(documentModel.layout, cardsPreset, 'block_experiences', 'S');
  }, /不支持尺寸/);
});
