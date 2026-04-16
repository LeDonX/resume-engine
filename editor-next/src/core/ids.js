const PAD_SIZE = 2;

export function createStableId(namespace, index) {
  const normalizedIndex = Number.isInteger(index) ? index + 1 : 1;
  return `${namespace}_${String(normalizedIndex).padStart(PAD_SIZE, '0')}`;
}

export function ensureEntityIds(items, namespace) {
  return (items || []).map((item, index) => {
    if (item?.id) {
      return { ...item };
    }

    return {
      ...item,
      id: createStableId(namespace, index)
    };
  });
}

function normalizeHighlightText(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    if ('text' in value) {
      return normalizeHighlightText(value.text);
    }

    return '';
  }

  return value;
}

export function ensureHighlightIds(items, namespace) {
  return (items || []).map((item, index) => {
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      return {
        ...item,
        id: item.id || createStableId(namespace, index),
        text: normalizeHighlightText(item.text)
      };
    }

    return {
      id: createStableId(namespace, index),
      text: normalizeHighlightText(item)
    };
  });
}

export function ensureResumeEntityIds(seed) {
  const profile = {
    ...(seed.profile || {}),
    id: seed.profile?.id || 'profile_01'
  };

  const summary = {
    ...(seed.summary || {}),
    id: seed.summary?.id || 'summary_01'
  };

  return {
    ...seed,
    profile,
    summary,
    skills: ensureEntityIds(seed.skills, 'skill'),
    education: ensureEntityIds(seed.education, 'edu'),
    experiences: ensureEntityIds(seed.experiences, 'exp').map((item) => ({
      ...item,
      highlights: ensureHighlightIds(item.highlights, `${item.id}_hl`)
    })),
    projects: ensureEntityIds(seed.projects, 'proj')
  };
}
