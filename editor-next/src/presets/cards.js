import { validateLayoutPreset } from '../core/preset-types.js';

export const cardsPreset = validateLayoutPreset({
  id: 'cards',
  label: '卡片版',
  description: '强调模块卡片与层次信息，作为 Phase 1 主展示 preset。',
  defaultTemplateId: 'cards.default',
  zones: [
    { id: 'cards.sidebar', label: '左侧资料列' },
    { id: 'cards.main', label: '右侧主叙事列' }
  ],
  blockTemplates: [
    {
      id: 'block_profile',
      type: 'profile',
      title: '个人概览',
      contentRef: 'profile',
      allowedZoneIds: ['cards.sidebar'],
      allowedSizes: ['L'],
      sizeOptions: [{ value: 'L', label: '展开', description: '保持主视觉概览卡的完整密度。' }],
      variant: 'hero',
      locked: true
    },
    {
      id: 'block_skills',
      type: 'skills',
      title: '能力标签',
      contentRef: 'skills',
      allowedZoneIds: ['cards.sidebar', 'cards.main'],
      allowedSizes: ['S', 'M', 'L'],
      sizeOptions: [
        { value: 'S', label: '紧凑', description: '更适合插入信息密集区。' },
        { value: 'M', label: '常规', description: '保持当前卡片密度。' },
        { value: 'L', label: '展开', description: '增加卡片呼吸感与最小高度。' }
      ],
      variant: 'stack'
    },
    {
      id: 'block_education',
      type: 'education',
      title: '教育经历',
      contentRef: 'education',
      allowedZoneIds: ['cards.sidebar'],
      allowedSizes: ['S', 'M'],
      sizeOptions: [
        { value: 'S', label: '紧凑', description: '适合侧栏短信息块。' },
        { value: 'M', label: '常规', description: '给教育时间线更多留白。' }
      ],
      variant: 'stack'
    },
    {
      id: 'block_summary',
      type: 'summary',
      title: '个人摘要',
      contentRef: 'summary',
      allowedZoneIds: ['cards.main'],
      allowedSizes: ['S', 'M', 'L'],
      sizeOptions: [
        { value: 'S', label: '紧凑', description: '压缩摘要段落的卡片高度。' },
        { value: 'M', label: '常规', description: '平衡摘要阅读与整体节奏。' },
        { value: 'L', label: '展开', description: '增强摘要卡的开场感。' }
      ],
      variant: 'feature'
    },
    {
      id: 'block_experiences',
      type: 'experiences',
      title: '工作经历',
      contentRef: 'experiences',
      allowedZoneIds: ['cards.main'],
      allowedSizes: ['M', 'L'],
      sizeOptions: [
        { value: 'M', label: '常规', description: '压缩时间线块的节奏。' },
        { value: 'L', label: '展开', description: '保留完整经历卡的叙事张力。' }
      ],
      variant: 'timeline'
    },
    {
      id: 'block_projects',
      type: 'projects',
      title: '项目精选',
      contentRef: 'projects',
      allowedZoneIds: ['cards.main', 'cards.sidebar'],
      allowedSizes: ['S', 'M', 'L'],
      sizeOptions: [
        { value: 'S', label: '紧凑', description: '更适合侧栏或补充展示。' },
        { value: 'M', label: '常规', description: '保持双项目卡的均衡尺寸。' },
        { value: 'L', label: '展开', description: '突出项目摘要与结果。' }
      ],
      variant: 'cards'
    }
  ],
  layoutTemplates: [
    {
      id: 'cards.default',
      label: '默认均衡',
      description: '左侧承载个人资料，右侧保持摘要与叙事主列的平衡节奏。',
      blocks: [
        { blockId: 'block_profile', zoneId: 'cards.sidebar', order: 0, size: 'L' },
        { blockId: 'block_skills', zoneId: 'cards.sidebar', order: 1, size: 'M' },
        { blockId: 'block_education', zoneId: 'cards.sidebar', order: 2, size: 'S' },
        { blockId: 'block_summary', zoneId: 'cards.main', order: 0, size: 'M' },
        { blockId: 'block_experiences', zoneId: 'cards.main', order: 1, size: 'L' },
        { blockId: 'block_projects', zoneId: 'cards.main', order: 2, size: 'M' }
      ]
    },
    {
      id: 'cards.sidebar-focus',
      label: '侧栏强调',
      description: '把可移动补充模块向侧栏集中，主列只保留摘要与经历的主阅读流。',
      blocks: [
        { blockId: 'block_profile', zoneId: 'cards.sidebar', order: 0, size: 'L' },
        { blockId: 'block_projects', zoneId: 'cards.sidebar', order: 1, size: 'L' },
        { blockId: 'block_education', zoneId: 'cards.sidebar', order: 2, size: 'M' },
        { blockId: 'block_summary', zoneId: 'cards.main', order: 0, size: 'S' },
        { blockId: 'block_experiences', zoneId: 'cards.main', order: 1, size: 'M' },
        { blockId: 'block_skills', zoneId: 'cards.main', order: 2, size: 'L' }
      ]
    }
  ]
});
