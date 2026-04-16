export const sampleResumeSeed = {
  profile: {
    name: '林知遥',
    role: '资深体验设计工程师',
    location: '上海',
    email: 'lin.zhiyao@example.com',
    phone: '138-0000-0000',
    tagline: '把复杂信息组织成可执行、可阅读、可打印的产品体验。'
  },
  summary: {
    text: '8 年内容产品与设计系统协作经验，长期负责编辑器、工作台与知识型工具。擅长把信息结构、交互约束和视觉表达整合成稳定的编辑体验，推动复杂模块在桌面端与打印场景下保持一致。'
  },
  skills: [
    { label: '信息架构', emphasis: '强' },
    { label: '设计系统', emphasis: '强' },
    { label: '原型验证', emphasis: '强' },
    { label: '前端实现', emphasis: '中' }
  ],
  education: [
    {
      school: '同济大学',
      degree: '数字媒体设计 硕士',
      period: '2014 — 2017'
    }
  ],
  experiences: [
    {
      company: '澄明科技',
      title: '编辑器体验负责人',
      period: '2021 — 至今',
      highlights: [
        '主导多版式简历编辑器重构，统一 cards / classic 布局内核。',
        '搭建 block metadata 与 selection 基线，降低后续交互接入成本。',
        '推动打印预览与浏览器编辑体验对齐，建立回归检查清单。'
      ]
    },
    {
      company: '未止工作室',
      title: '产品设计师',
      period: '2018 — 2021',
      highlights: [
        '负责 B2B 仪表盘和内容工作台的信息可视化与组件规范。',
        '设计并交付面向中文场景的复杂表单与内容结构模板。'
      ]
    }
  ],
  projects: [
    {
      name: 'Resume Engine Next',
      summary: '以统一文档模型承载多版式编辑、打印和未来交互约束。',
      impact: '为后续拖拽、尺寸档位、直编奠定结构基础。'
    },
    {
      name: '知识库工作台改版',
      summary: '重做目录、搜索与卡片信息密度策略。',
      impact: '复杂信息任务完成时长下降 23%。'
    }
  ]
};
