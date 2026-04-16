import { validateLayoutPreset } from '../core/preset-types.js';

export const classicPreset = validateLayoutPreset({
  id: 'classic',
  label: '经典版',
  description: '更接近传统打印阅读流，但仍使用统一 schema。',
  defaultTemplateId: 'classic.default',
  zones: [
    { id: 'classic.header', label: '页首摘要' },
    { id: 'classic.main', label: '主体内容' },
    { id: 'classic.aside', label: '辅助侧栏' }
  ],
  blockTemplates: [
    {
      id: 'block_profile',
      type: 'profile',
      title: '个人信息',
      contentRef: 'profile',
      allowedZoneIds: ['classic.header'],
      allowedSizes: ['L'],
      sizeOptions: [{ value: 'L', label: '展开', description: '保持页首信息完整展开。' }],
      variant: 'header',
      locked: true
    },
    {
      id: 'block_summary',
      type: 'summary',
      title: '个人摘要',
      contentRef: 'summary',
      allowedZoneIds: ['classic.header', 'classic.main'],
      allowedSizes: ['S', 'M', 'L'],
      sizeOptions: [
        { value: 'S', label: '紧凑', description: '让页首摘要更贴近传统简历密度。' },
        { value: 'M', label: '常规', description: '保持默认打印阅读节奏。' },
        { value: 'L', label: '展开', description: '强化页首摘要存在感。' }
      ],
      variant: 'header'
    },
    {
      id: 'block_experiences',
      type: 'experiences',
      title: '工作经历',
      contentRef: 'experiences',
      allowedZoneIds: ['classic.main'],
      allowedSizes: ['M', 'L'],
      sizeOptions: [
        { value: 'M', label: '常规', description: '压缩正文流的垂直节奏。' },
        { value: 'L', label: '展开', description: '增强正文时间线的呼吸感。' }
      ],
      variant: 'flow'
    },
    {
      id: 'block_projects',
      type: 'projects',
      title: '项目经历',
      contentRef: 'projects',
      allowedZoneIds: ['classic.main'],
      allowedSizes: ['S', 'M'],
      sizeOptions: [
        { value: 'S', label: '紧凑', description: '更贴近经典双栏摘要块。' },
        { value: 'M', label: '常规', description: '保留默认正文节奏。' }
      ],
      variant: 'flow'
    },
    {
      id: 'block_skills',
      type: 'skills',
      title: '技能清单',
      contentRef: 'skills',
      allowedZoneIds: ['classic.aside', 'classic.main'],
      allowedSizes: ['S', 'M'],
      sizeOptions: [
        { value: 'S', label: '紧凑', description: '维持侧栏工具型密度。' },
        { value: 'M', label: '常规', description: '提升侧栏阅读舒适度。' }
      ],
      variant: 'list'
    },
    {
      id: 'block_education',
      type: 'education',
      title: '教育背景',
      contentRef: 'education',
      allowedZoneIds: ['classic.aside'],
      allowedSizes: ['S', 'M'],
      sizeOptions: [
        { value: 'S', label: '紧凑', description: '更符合打印侧栏密度。' },
        { value: 'M', label: '常规', description: '增加教育块的留白。' }
      ],
      variant: 'list'
    }
  ],
  layoutTemplates: [
    {
      id: 'classic.default',
      label: '默认模板',
      description: '传统打印阅读流，页首摘要 + 主体正文 + 工具侧栏。',
      blocks: [
        { blockId: 'block_profile', zoneId: 'classic.header', order: 0, size: 'L' },
        { blockId: 'block_summary', zoneId: 'classic.header', order: 1, size: 'M' },
        { blockId: 'block_experiences', zoneId: 'classic.main', order: 0, size: 'L' },
        { blockId: 'block_projects', zoneId: 'classic.main', order: 1, size: 'M' },
        { blockId: 'block_skills', zoneId: 'classic.aside', order: 0, size: 'S' },
        { blockId: 'block_education', zoneId: 'classic.aside', order: 1, size: 'S' }
      ]
    }
  ]
});
