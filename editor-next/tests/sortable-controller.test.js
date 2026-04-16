import test from 'node:test';
import assert from 'node:assert/strict';

import { createEditorDocument } from '../src/core/document.js';
import { cardsPreset } from '../src/presets/cards.js';
import {
  canDropBlockInZone,
  canStartSortableDrag,
  createSortableMovePlan,
  getSortableTargetOrder,
  getZoneDragState
} from '../src/ui/sortable-controller.js';
import { sampleResumeSeed } from '../src/sample-document.js';

test('sortable drag helpers reject locked blocks and allow movable ones', () => {
  const documentModel = createEditorDocument(sampleResumeSeed, cardsPreset);

  assert.equal(canStartSortableDrag(documentModel.layout, 'block_profile'), false);
  assert.equal(canStartSortableDrag(documentModel.layout, 'block_projects'), true);
});

test('sortable zone checks follow preset legality', () => {
  const documentModel = createEditorDocument(sampleResumeSeed, cardsPreset);

  assert.equal(canDropBlockInZone(documentModel.layout, cardsPreset, 'block_skills', 'cards.main'), true);
  assert.equal(canDropBlockInZone(documentModel.layout, cardsPreset, 'block_experiences', 'cards.sidebar'), false);
});

test('sortable zone state exposes active valid and invalid zones', () => {
  const documentModel = createEditorDocument(sampleResumeSeed, cardsPreset);

  assert.equal(getZoneDragState(documentModel.layout, cardsPreset, 'block_skills', 'cards.sidebar'), 'active');
  assert.equal(getZoneDragState(documentModel.layout, cardsPreset, 'block_skills', 'cards.main'), 'valid');
  assert.equal(getZoneDragState(documentModel.layout, cardsPreset, 'block_experiences', 'cards.sidebar'), 'invalid');
});

test('sortable target order prefers draggable index and falls back safely', () => {
  assert.equal(getSortableTargetOrder({ newDraggableIndex: 2, newIndex: 4 }), 2);
  assert.equal(getSortableTargetOrder({ newIndex: 1 }), 1);
  assert.equal(getSortableTargetOrder({}), 0);
});

test('sortable move plan distinguishes valid moves from no-op and illegal drops', () => {
  const documentModel = createEditorDocument(sampleResumeSeed, cardsPreset);
  const validMove = createSortableMovePlan(documentModel.layout, cardsPreset, 'block_projects', 'cards.sidebar', 1);
  const samePosition = createSortableMovePlan(documentModel.layout, cardsPreset, 'block_projects', 'cards.main', 2);
  const illegalMove = createSortableMovePlan(documentModel.layout, cardsPreset, 'block_experiences', 'cards.sidebar', 0);

  assert.equal(validMove.shouldMove, true);
  assert.equal(validMove.targetState.state, 'valid');

  assert.equal(samePosition.shouldMove, false);
  assert.equal(samePosition.shouldReset, true);
  assert.equal(samePosition.targetState.state, 'active');

  assert.equal(illegalMove.shouldMove, false);
  assert.equal(illegalMove.shouldReset, true);
  assert.equal(illegalMove.targetState.reason, 'disallowed-zone');
});
