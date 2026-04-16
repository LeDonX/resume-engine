import { cardsPreset } from '../presets/cards.js';
import { classicPreset } from '../presets/classic.js';

export const presetRegistry = Object.freeze({
  cards: cardsPreset,
  classic: classicPreset
});

export function getPreset(presetId) {
  const preset = presetRegistry[presetId];

  if (!preset) {
    throw new Error(`未知 preset：${presetId}`);
  }

  return preset;
}

export function listPresets() {
  return Object.values(presetRegistry);
}

function resolvePreset(presetOrId) {
  return typeof presetOrId === 'string' ? getPreset(presetOrId) : presetOrId;
}

export function getPresetLayoutTemplate(presetOrId, templateId) {
  const preset = resolvePreset(presetOrId);
  const template = preset.layoutTemplates.find((entry) => entry.id === templateId);

  if (!template) {
    throw new Error(`Preset ${preset.id} 不存在 template：${templateId}`);
  }

  return template;
}

export function listPresetTemplates(presetOrId) {
  return resolvePreset(presetOrId).layoutTemplates;
}
