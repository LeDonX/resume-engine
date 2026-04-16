import test from 'node:test';
import assert from 'node:assert/strict';

import { createStableId, ensureResumeEntityIds } from '../src/core/ids.js';

test('createStableId returns deterministic padded ids', () => {
  assert.equal(createStableId('edu', 0), 'edu_01');
  assert.equal(createStableId('exp', 11), 'exp_12');
});

test('ensureResumeEntityIds injects missing ids and preserves existing ids', () => {
  const seed = {
    profile: { name: '测试用户' },
    summary: { text: '摘要' },
    skills: [{ label: '信息架构' }],
    education: [{ school: '学校' }],
    experiences: [{ id: 'exp_keep', company: '公司', highlights: ['A'] }],
    projects: [{ name: '项目' }]
  };

  const normalized = ensureResumeEntityIds(seed);

  assert.equal(normalized.profile.id, 'profile_01');
  assert.equal(normalized.summary.id, 'summary_01');
  assert.equal(normalized.skills[0].id, 'skill_01');
  assert.equal(normalized.education[0].id, 'edu_01');
  assert.equal(normalized.experiences[0].id, 'exp_keep');
  assert.equal(normalized.experiences[0].highlights[0].id, 'exp_keep_hl_01');
  assert.equal(normalized.projects[0].id, 'proj_01');
});

test('ensureResumeEntityIds stays stable across repeated normalization', () => {
  const seed = {
    profile: { name: '测试用户' },
    summary: { text: '摘要' },
    skills: [{ label: 'A' }, { label: 'B' }],
    education: [],
    experiences: [],
    projects: []
  };

  const firstPass = ensureResumeEntityIds(seed);
  const secondPass = ensureResumeEntityIds(firstPass);

  assert.deepEqual(secondPass.skills.map((item) => item.id), ['skill_01', 'skill_02']);
});

test('ensureResumeEntityIds preserves existing highlight objects across repeated normalization', () => {
  const seed = {
    profile: { name: '测试用户' },
    summary: { text: '摘要' },
    skills: [],
    education: [],
    experiences: [
      {
        id: 'exp_keep',
        company: '公司',
        highlights: [
          { id: 'exp_keep_hl_01', text: '第一条亮点' },
          { id: 'exp_keep_hl_02', text: '第二条亮点' }
        ]
      }
    ],
    projects: []
  };

  const normalized = ensureResumeEntityIds(seed);
  const normalizedAgain = ensureResumeEntityIds(normalized);

  assert.deepEqual(normalizedAgain.experiences[0].highlights, [
    { id: 'exp_keep_hl_01', text: '第一条亮点' },
    { id: 'exp_keep_hl_02', text: '第二条亮点' }
  ]);
});

test('ensureResumeEntityIds flattens malformed nested highlight text objects', () => {
  const seed = {
    profile: { name: '测试用户' },
    summary: { text: '摘要' },
    skills: [],
    education: [],
    experiences: [
      {
        id: 'exp_keep',
        company: '公司',
        highlights: [
          { id: 'exp_keep_hl_01', text: { id: 'legacy_1', text: '旧快照亮点' } }
        ]
      }
    ],
    projects: []
  };

  const normalized = ensureResumeEntityIds(seed);

  assert.deepEqual(normalized.experiences[0].highlights, [
    { id: 'exp_keep_hl_01', text: '旧快照亮点' }
  ]);
});
