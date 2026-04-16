export const BLOCK_TYPES = Object.freeze([
  'profile',
  'summary',
  'skills',
  'education',
  'experiences',
  'projects'
]);

export const SIZE_PRESETS = Object.freeze(['S', 'M', 'L']);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

export function validateLayoutPreset(preset) {
  assert(preset?.id, 'Preset 必须包含 id');
  assert(Array.isArray(preset?.zones) && preset.zones.length > 0, 'Preset 必须定义 zones');
  assert(Array.isArray(preset?.blockTemplates) && preset.blockTemplates.length > 0, 'Preset 必须定义 blockTemplates');
  assert(Array.isArray(preset?.layoutTemplates) && preset.layoutTemplates.length > 0, 'Preset 必须定义 layoutTemplates');
  assert(preset?.defaultTemplateId, 'Preset 必须定义 defaultTemplateId');

  const zoneIds = new Set();
  for (const zone of preset.zones) {
    assert(zone.id, 'Zone 必须包含 id');
    assert(!zoneIds.has(zone.id), `Zone 不能重复：${zone.id}`);
    zoneIds.add(zone.id);
  }

  const blockIds = new Set();
  const blockCatalog = new Map();
  for (const block of preset.blockTemplates) {
    assert(block.id, 'Block template 必须包含 id');
    assert(!blockIds.has(block.id), `Block 不能重复：${block.id}`);
    blockIds.add(block.id);
    blockCatalog.set(block.id, block);
    assert(BLOCK_TYPES.includes(block.type), `未知 blockType：${block.type}`);
    assert(block.title, `Block ${block.id} 缺少 title`);
    assert(block.contentRef, `Block ${block.id} 缺少 contentRef`);
    assert(Array.isArray(block.allowedSizes) && block.allowedSizes.length > 0, `Block ${block.id} 缺少 allowedSizes`);
    assert(Array.isArray(block.allowedZoneIds) && block.allowedZoneIds.length > 0, `Block ${block.id} 缺少 allowedZoneIds`);

    const allowedSizes = new Set();
    for (const size of block.allowedSizes) {
      assert(SIZE_PRESETS.includes(size), `Block ${block.id} 使用了非法 allowedSize：${size}`);
      assert(!allowedSizes.has(size), `Block ${block.id} 的 allowedSizes 重复：${size}`);
      allowedSizes.add(size);
    }

    if (block.sizeOptions) {
      assert(Array.isArray(block.sizeOptions), `Block ${block.id} 的 sizeOptions 必须是数组`);

      const optionValues = new Set();
      for (const option of block.sizeOptions) {
        assert(option?.value, `Block ${block.id} 的 sizeOptions 缺少 value`);
        assert(allowedSizes.has(option.value), `Block ${block.id} 的 sizeOption 使用了未声明的尺寸：${option.value}`);
        assert(!optionValues.has(option.value), `Block ${block.id} 的 sizeOptions 重复：${option.value}`);
        optionValues.add(option.value);
      }
    }

    for (const zoneId of block.allowedZoneIds) {
      assert(zoneIds.has(zoneId), `Block ${block.id} 允许了不存在的 zone：${zoneId}`);
    }
  }

  const layoutTemplateIds = new Set();
  for (const template of preset.layoutTemplates) {
    assert(template?.id, 'Layout template 必须包含 id');
    assert(!layoutTemplateIds.has(template.id), `Layout template 不能重复：${template.id}`);
    layoutTemplateIds.add(template.id);
    assert(template?.label, `Layout template ${template.id} 缺少 label`);
    assert(Array.isArray(template?.blocks) && template.blocks.length === preset.blockTemplates.length, `Layout template ${template.id} 必须覆盖全部 block`);

    const placedBlockIds = new Set();
    for (const layoutBlock of template.blocks) {
      const block = blockCatalog.get(layoutBlock.blockId);
      assert(block, `Layout template ${template.id} 引用了未知 block：${layoutBlock.blockId}`);
      assert(!placedBlockIds.has(layoutBlock.blockId), `Layout template ${template.id} 重复放置 block：${layoutBlock.blockId}`);
      placedBlockIds.add(layoutBlock.blockId);
      assert(zoneIds.has(layoutBlock.zoneId), `Layout template ${template.id} 为 ${layoutBlock.blockId} 使用了不存在的 zone：${layoutBlock.zoneId}`);
      assert(block.allowedZoneIds.includes(layoutBlock.zoneId), `Layout template ${template.id} 为 ${layoutBlock.blockId} 使用了非法 zone：${layoutBlock.zoneId}`);
      assert(Number.isInteger(layoutBlock.order) && layoutBlock.order >= 0, `Layout template ${template.id} 为 ${layoutBlock.blockId} 使用了非法 order：${layoutBlock.order}`);
      assert(block.allowedSizes.includes(layoutBlock.size), `Layout template ${template.id} 为 ${layoutBlock.blockId} 使用了非法 size：${layoutBlock.size}`);
    }
  }

  assert(layoutTemplateIds.has(preset.defaultTemplateId), `Preset ${preset.id} 的 defaultTemplateId 不存在：${preset.defaultTemplateId}`);

  return preset;
}
