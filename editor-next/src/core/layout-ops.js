export function sortLayoutBlocks(blocks) {
  return [...blocks].sort((left, right) => {
    if (left.zoneId === right.zoneId) {
      return left.order - right.order;
    }

    return left.zoneId.localeCompare(right.zoneId, 'zh-CN');
  });
}

export function getBlocksForZone(layout, zoneId) {
  return sortLayoutBlocks(layout.blocks).filter((block) => block.zoneId === zoneId);
}

export function getBlock(layout, blockId) {
  return layout.blocks.find((block) => block.id === blockId) || null;
}

export function getPresetBlockTemplate(preset, blockId) {
  return preset.blockTemplates.find((block) => block.id === blockId) || null;
}

function hasZone(layout, preset, zoneId) {
  return [...layout.zones, ...preset.zones].some((zone) => zone.id === zoneId);
}

function clampTargetOrder(layout, blockId, targetZoneId, targetOrder) {
  const normalizedTargetOrder = Number.isFinite(targetOrder) ? targetOrder : 0;
  const targetZoneBlocks = sortLayoutBlocks(
    layout.blocks.filter((block) => block.zoneId === targetZoneId && block.id !== blockId)
  );

  return Math.max(0, Math.min(normalizedTargetOrder, targetZoneBlocks.length));
}

export function canPlaceBlock(preset, block, targetZoneId) {
  const zoneExists = preset.zones.some((zone) => zone.id === targetZoneId);
  if (!zoneExists) {
    return false;
  }

  return block.allowedZoneIds.includes(targetZoneId);
}

export function getBlockSizeState(layout, preset, blockId, nextSize) {
  const block = getBlock(layout, blockId);
  const template = getPresetBlockTemplate(preset, blockId);

  if (!block) {
    return {
      allowedSizes: [],
      block: null,
      isActive: false,
      isValidChange: false,
      nextSize,
      reason: 'missing-block',
      state: 'invalid',
      template: null
    };
  }

  if (!template) {
    return {
      allowedSizes: [],
      block,
      isActive: false,
      isValidChange: false,
      nextSize,
      reason: 'missing-template',
      state: 'invalid',
      template: null
    };
  }

  const allowedSizes = [...template.allowedSizes];
  const isActive = block.size === nextSize;

  if (isActive) {
    return {
      allowedSizes,
      block,
      isActive: true,
      isValidChange: false,
      nextSize,
      reason: 'same-size',
      state: 'active',
      template
    };
  }

  if (block.locked) {
    return {
      allowedSizes,
      block,
      isActive: false,
      isValidChange: false,
      nextSize,
      reason: 'locked',
      state: 'invalid',
      template
    };
  }

  if (!allowedSizes.includes(nextSize)) {
    return {
      allowedSizes,
      block,
      isActive: false,
      isValidChange: false,
      nextSize,
      reason: 'unsupported-size',
      state: 'invalid',
      template
    };
  }

  return {
    allowedSizes,
    block,
    isActive: false,
    isValidChange: true,
    nextSize,
    reason: 'allowed',
    state: 'valid',
    template
  };
}

export function getBlockSizeOptions(layout, preset, blockId) {
  const template = getPresetBlockTemplate(preset, blockId);
  if (!template) {
    return [];
  }

  const optionMetadata = new Map((template.sizeOptions || []).map((option) => [option.value, option]));

  return template.allowedSizes.map((size) => {
    const sizeState = getBlockSizeState(layout, preset, blockId, size);
    const option = optionMetadata.get(size);

    return {
      ...sizeState,
      description: option?.description || '',
      label: option?.label || size,
      value: size
    };
  });
}

export function resizeBlock(layout, preset, blockId, nextSize) {
  const sizeState = getBlockSizeState(layout, preset, blockId, nextSize);
  const currentBlock = sizeState.block;

  if (!currentBlock) {
    throw new Error(`找不到 block：${blockId}`);
  }

  if (sizeState.isActive) {
    return layout;
  }

  if (!sizeState.isValidChange) {
    if (sizeState.reason === 'locked') {
      throw new Error(`Block ${blockId} 已锁定，不能调整尺寸`);
    }

    throw new Error(`Block ${blockId} 不支持尺寸 ${nextSize}`);
  }

  return {
    ...layout,
    blocks: layout.blocks.map((block) => {
      if (block.id !== blockId) {
        return block;
      }

      return {
        ...block,
        size: nextSize
      };
    })
  };
}

export function getMoveTargetState(layout, preset, blockId, targetZoneId, targetOrder) {
  const block = getBlock(layout, blockId);

  if (!block) {
    return {
      block: null,
      isActive: false,
      isValidTarget: false,
      reason: 'missing-block',
      state: 'invalid',
      targetOrder,
      targetZoneId
    };
  }

  if (!hasZone(layout, preset, targetZoneId)) {
    return {
      block,
      isActive: false,
      isValidTarget: false,
      reason: 'missing-zone',
      state: 'invalid',
      targetOrder,
      targetZoneId
    };
  }

  const normalizedTargetOrder = clampTargetOrder(layout, blockId, targetZoneId, targetOrder);
  const isActive = block.zoneId === targetZoneId && normalizedTargetOrder === block.order;

  if (isActive) {
    return {
      block,
      isActive: true,
      isValidTarget: false,
      reason: 'same-position',
      state: 'active',
      targetOrder: normalizedTargetOrder,
      targetZoneId
    };
  }

  if (block.locked) {
    return {
      block,
      isActive: false,
      isValidTarget: false,
      reason: 'locked',
      state: 'invalid',
      targetOrder: normalizedTargetOrder,
      targetZoneId
    };
  }

  if (!canPlaceBlock(preset, block, targetZoneId)) {
    return {
      block,
      isActive: false,
      isValidTarget: false,
      reason: 'disallowed-zone',
      state: 'invalid',
      targetOrder: normalizedTargetOrder,
      targetZoneId
    };
  }

  return {
    block,
    isActive: false,
    isValidTarget: true,
    reason: 'allowed',
    state: 'valid',
    targetOrder: normalizedTargetOrder,
    targetZoneId
  };
}

export function moveBlock(layout, preset, blockId, targetZoneId, targetOrder) {
  const targetState = getMoveTargetState(layout, preset, blockId, targetZoneId, targetOrder);
  const currentBlock = targetState.block;

  if (!currentBlock) {
    throw new Error(`找不到 block：${blockId}`);
  }

  if (targetState.isActive) {
    return layout;
  }

  if (!targetState.isValidTarget) {
    if (targetState.reason === 'locked') {
      throw new Error(`Block ${blockId} 已锁定，不能移动`);
    }

    throw new Error(`Block ${blockId} 不能移动到 zone ${targetZoneId}`);
  }

  const blocksWithoutCurrent = layout.blocks
    .filter((block) => block.id !== blockId)
    .map((block) => ({ ...block }));

  const nextBlocks = [];

  for (const zone of layout.zones) {
    const zoneBlocks = sortLayoutBlocks(blocksWithoutCurrent.filter((block) => block.zoneId === zone.id));

    if (zone.id === targetZoneId) {
      const insertIndex = targetState.targetOrder;
      zoneBlocks.splice(insertIndex, 0, {
        ...currentBlock,
        zoneId: targetZoneId
      });
    }

    zoneBlocks.forEach((block, order) => {
      nextBlocks.push({
        ...block,
        order
      });
    });
  }

  return {
    ...layout,
    blocks: nextBlocks
  };
}

export function normalizeZoneOrders(blocks) {
  const counters = new Map();

  return blocks.map((block) => {
    const nextOrder = counters.get(block.zoneId) || 0;
    counters.set(block.zoneId, nextOrder + 1);

    return {
      ...block,
      order: nextOrder
    };
  });
}
