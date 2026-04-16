import { canPlaceBlock, getBlock, getMoveTargetState } from '../core/layout-ops.js';

export const SORTABLE_GROUP_NAME = 'editor-next-layout-zones';

export function canStartSortableDrag(layout, blockId) {
  const block = getBlock(layout, blockId);
  return Boolean(block && !block.locked);
}

export function canDropBlockInZone(layout, preset, blockId, targetZoneId) {
  const block = getBlock(layout, blockId);
  return Boolean(block && !block.locked && canPlaceBlock(preset, block, targetZoneId));
}

export function getZoneDragState(layout, preset, blockId, zoneId) {
  if (!blockId) {
    return 'idle';
  }

  const block = getBlock(layout, blockId);
  if (!block) {
    return 'idle';
  }

  if (block.zoneId === zoneId) {
    return 'active';
  }

  return canDropBlockInZone(layout, preset, blockId, zoneId) ? 'valid' : 'invalid';
}

export function getSortableTargetOrder(sortableEvent) {
  const nextIndex = Number.isInteger(sortableEvent?.newDraggableIndex)
    ? sortableEvent.newDraggableIndex
    : Number.isInteger(sortableEvent?.newIndex)
      ? sortableEvent.newIndex
      : 0;

  return Math.max(0, nextIndex);
}

export function createSortableMovePlan(layout, preset, blockId, targetZoneId, targetOrder) {
  const targetState = getMoveTargetState(layout, preset, blockId, targetZoneId, targetOrder);

  return {
    blockId,
    shouldMove: targetState.isValidTarget,
    shouldReset: !targetState.isValidTarget || targetState.isActive,
    targetState
  };
}
