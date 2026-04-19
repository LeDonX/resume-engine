import test from "node:test";
import assert from "node:assert/strict";

import {
    RESUME_REORDERABLE_SECTION_IDS,
    PROFESSIONAL_SKILLS_MODE_SKILLS,
    PROFESSIONAL_SKILLS_MODE_TEXT,
    RESUME_LAYOUT_CARDS,
    RESUME_LAYOUT_CLASSIC,
    RESUME_LAYOUT_MY_RESUME,
    RESUME_LAYOUT_MY_RESUME3,
    createInitialPanelState,
    sampleResumeData
} from "./src/core/config.js";
import { normalizeResumeData } from "./src/core/resume-model.js";
import { renderFormHtml } from "./src/form/render.js";
import { getAvatarImageSource } from "./src/avatar/avatar-utils.js";
import { buildLayoutColumnBlocks } from "./src/preview/render.js";
import { buildDraftStoragePayload, parseDraftStoragePayload } from "./src/persistence/draft-store.js";

function assertOrderedFragments(html, fragments) {
    let previousIndex = -1;

    for (const fragment of fragments) {
        const currentIndex = html.indexOf(fragment);
        assert.ok(currentIndex >= 0, `Expected fragment to exist: ${fragment}`);
        assert.ok(currentIndex > previousIndex, `Expected ${fragment} to appear after the previous fragment`);
        previousIndex = currentIndex;
    }
}

test("layout builders keep returning left/right block arrays for every layout", () => {
    const layouts = ["classic", "cards", "my-resume", "my-resume3"];

    for (const layout of layouts) {
        const data = normalizeResumeData({
            ...sampleResumeData,
            resumeLayout: layout
        });
        const blocks = buildLayoutColumnBlocks(layout, data, getAvatarImageSource(data.profileImage));

        assert.ok(blocks);
        assert.ok(Array.isArray(blocks.leftBlocks), `${layout} leftBlocks should stay an array`);
        assert.ok(Array.isArray(blocks.rightBlocks), `${layout} rightBlocks should stay an array`);
    }
});

test("draft storage payload keeps the avatar sidecar sentinel contract", () => {
    const profileImage = "data:image/png;base64,ZmFrZQ==";
    const payload = buildDraftStoragePayload({
        ...normalizeResumeData(sampleResumeData),
        profileImage
    });

    assert.equal(payload.version, 2);
    assert.equal(payload.hasAvatarSidecar, true);
    assert.equal(payload.data.profileImage, "__resume-avatar-sidecar__");

    const parsed = parseDraftStoragePayload(JSON.stringify(payload));
    assert.equal(parsed.hasAvatarSidecar, true);
    assert.equal(parsed.needsUpgrade, false);
    assert.equal(parsed.draftData.profileImage, "");
});

test("draft storage payload round-trips sectionOrder", () => {
    const expectedOrder = ["projects", "education", "skills", "experiences"];
    const payload = buildDraftStoragePayload(normalizeResumeData({
        ...sampleResumeData,
        sectionOrder: expectedOrder
    }));
    const parsed = parseDraftStoragePayload(JSON.stringify(payload));

    assert.deepEqual(payload.data.sectionOrder, expectedOrder);
    assert.deepEqual(parsed.draftData.sectionOrder, expectedOrder);
});

test("draft storage payload keeps spacing/layout controls as flat top-level fields", () => {
    const payload = buildDraftStoragePayload(normalizeResumeData({
        ...sampleResumeData,
        moduleMarginYScale: 1.08,
        moduleMarginXScale: 1.02,
        modulePaddingYScale: 1.04,
        modulePaddingXScale: 0.98,
        pagePaddingYScale: 0.96,
        pagePaddingXScale: 0.94,
        bodyLineHeightScale: 1.12
    }));
    const parsed = parseDraftStoragePayload(JSON.stringify(payload));

    assert.equal(payload.data.moduleMarginYScale, 1.08);
    assert.equal(payload.data.moduleMarginXScale, 1.02);
    assert.equal(payload.data.modulePaddingYScale, 1.04);
    assert.equal(payload.data.modulePaddingXScale, 0.98);
    assert.equal(payload.data.pagePaddingYScale, 0.96);
    assert.equal(payload.data.pagePaddingXScale, 0.94);
    assert.equal(payload.data.bodyLineHeightScale, 1.12);
    assert.equal("layoutControls" in payload.data, false);
    assert.equal("moduleSpacingScale" in payload.data, false);
    assert.equal("surfacePaddingScale" in payload.data, false);
    assert.equal("pagePaddingScale" in payload.data, false);

    assert.equal(parsed.draftData.moduleMarginYScale, 1.08);
    assert.equal(parsed.draftData.moduleMarginXScale, 1.02);
    assert.equal(parsed.draftData.modulePaddingYScale, 1.04);
    assert.equal(parsed.draftData.modulePaddingXScale, 0.98);
    assert.equal(parsed.draftData.pagePaddingYScale, 0.96);
    assert.equal(parsed.draftData.pagePaddingXScale, 0.94);
    assert.equal(parsed.draftData.bodyLineHeightScale, 1.12);
    assert.equal("moduleSpacingScale" in parsed.draftData, false);
    assert.equal("surfacePaddingScale" in parsed.draftData, false);
    assert.equal("pagePaddingScale" in parsed.draftData, false);
});

test("legacy spacing payloads normalize into the new axis-specific fields only", () => {
    const {
        moduleMarginYScale,
        moduleMarginXScale,
        modulePaddingYScale,
        modulePaddingXScale,
        pagePaddingYScale,
        pagePaddingXScale,
        ...legacyBase
    } = sampleResumeData;
    const normalized = normalizeResumeData({
        ...legacyBase,
        moduleSpacingScale: 1.08,
        surfacePaddingScale: 1.04,
        pagePaddingScale: 0.96,
        bodyLineHeightScale: 1.1
    });

    assert.equal(normalized.moduleMarginYScale, 1.08);
    assert.equal(normalized.moduleMarginXScale, 1.08);
    assert.equal(normalized.modulePaddingYScale, 1.04);
    assert.equal(normalized.modulePaddingXScale, 1.04);
    assert.equal(normalized.pagePaddingYScale, 0.96);
    assert.equal(normalized.pagePaddingXScale, 0.96);
    assert.equal(normalized.bodyLineHeightScale, 1.1);
    assert.equal("moduleSpacingScale" in normalized, false);
    assert.equal("surfacePaddingScale" in normalized, false);
    assert.equal("pagePaddingScale" in normalized, false);
});

test("experience work badge normalizes separately from highlight and migrates legacy labels", () => {
    const normalized = normalizeResumeData({
        ...sampleResumeData,
        experiences: [
            {
                title: "前端负责人",
                company: "某科技公司",
                period: "2022 - 至今",
                highlight: true,
                bullets: ["负责核心项目"]
            },
            {
                title: "前端工程师",
                company: "另一家公司",
                period: "2020 - 2022",
                highlight: false,
                highlightLabel: "草稿中暂存的文案",
                bullets: ["参与日常迭代"]
            },
            {
                title: "技术专家",
                company: "第三家公司",
                period: "2018 - 2020",
                highlight: true,
                workBadgeEnabled: true,
                workBadgeLabel: "关键履历",
                bullets: ["主导架构升级"]
            },
            {
                title: "架构负责人",
                company: "第四家公司",
                period: "2016 - 2018",
                highlight: false,
                workBadgeEnabled: true,
                bullets: ["推动平台升级"]
            }
        ]
    });

    assert.equal(normalized.experiences[0].highlight, true);
    assert.equal("highlightLabel" in normalized.experiences[0], false);
    assert.equal(normalized.experiences[0].workBadgeEnabled, false);
    assert.equal(normalized.experiences[0].workBadgeLabel, "");
    assert.equal(normalized.experiences[1].workBadgeEnabled, true);
    assert.equal(normalized.experiences[1].workBadgeLabel, "草稿中暂存的文案");
    assert.equal(normalized.experiences[2].workBadgeLabel, "关键履历");
    assert.equal(normalized.experiences[3].workBadgeLabel, "重点经历");
});

test("form renderer exposes separate experience text highlight and work badge controls", () => {
    const html = renderFormHtml({
        resumeData: normalizeResumeData({
            ...sampleResumeData,
            experiences: [
                {
                    title: "前端负责人",
                    company: "某科技公司",
                    period: "2022 - 至今",
                    highlight: true,
                    workBadgeEnabled: true,
                    workBadgeLabel: "重点主导",
                    bullets: ["负责核心项目"]
                },
                {
                    title: "前端工程师",
                    company: "另一家公司",
                    period: "2020 - 2022",
                    highlight: false,
                    workBadgeEnabled: false,
                    workBadgeLabel: "不应显示",
                    bullets: ["参与日常迭代"]
                }
            ]
        }),
        panelState: createInitialPanelState(),
        activeBasicInfoPickerIndex: -1,
        avatarCropState: null
    });

    assert.ok(html.includes('data-field="highlight" checked'));
    assert.ok(html.includes('data-field="workBadgeEnabled" checked'));
    assert.ok(html.includes('data-field="workBadgeLabel" value="重点主导"'));
    assert.equal(html.includes('data-field="highlightLabel"'), false);
    assert.equal(html.includes('value="不应显示"'), false);
});

test("all layouts render work badges independently of highlight with the shared award icon", () => {
    const experienceBadgeText = "重点主导";
    const badgeCompanyText = "徽章公司";
    const badgeRoleText = "徽章岗位";
    const badgePeriodText = "2020 - 2022";
    const projectBadgeText = "项目专属徽章";
    const layouts = [RESUME_LAYOUT_CLASSIC, RESUME_LAYOUT_CARDS, RESUME_LAYOUT_MY_RESUME, RESUME_LAYOUT_MY_RESUME3];
    const expectedWorkBadgeClassByLayout = {
        [RESUME_LAYOUT_CLASSIC]: 'class="resume-work-badge resume-primary-badge resume-entry-flag"',
        [RESUME_LAYOUT_CARDS]: 'class="resume-work-badge resume-primary-badge resume-entry-flag"',
        [RESUME_LAYOUT_MY_RESUME]: 'class="resume-work-badge my-resume-highlight-badge"',
        [RESUME_LAYOUT_MY_RESUME3]: 'class="resume-work-badge my-resume3-experience-badge"'
    };
    const expectedWorkBadgeOrderByLayout = {
        [RESUME_LAYOUT_CLASSIC]: [badgeRoleText, experienceBadgeText, badgeCompanyText],
        [RESUME_LAYOUT_CARDS]: [badgeCompanyText, experienceBadgeText, badgeRoleText],
        [RESUME_LAYOUT_MY_RESUME]: [badgeCompanyText, experienceBadgeText, badgePeriodText, badgeRoleText],
        [RESUME_LAYOUT_MY_RESUME3]: [badgeCompanyText, experienceBadgeText, badgeRoleText]
    };

    for (const layout of layouts) {
        const data = normalizeResumeData({
            ...sampleResumeData,
            resumeLayout: layout,
            experiences: [
                {
                    title: "强调经历",
                    company: "强调公司",
                    period: "2022 - 至今",
                    highlight: true,
                    workBadgeEnabled: false,
                    bullets: ["负责核心项目"]
                },
                {
                    title: badgeRoleText,
                    company: badgeCompanyText,
                    period: "2020 - 2022",
                    highlight: false,
                    workBadgeEnabled: true,
                    workBadgeLabel: experienceBadgeText,
                    bullets: ["参与日常迭代"]
                }
            ],
            projects: [
                {
                    name: "统一中台",
                    badge: projectBadgeText,
                    badgeStyle: "primary",
                    period: "2023",
                    description: "项目描述",
                    highlights: ["项目亮点"],
                    techs: ["React"]
                }
            ]
        });
        const blocks = buildLayoutColumnBlocks(layout, data, getAvatarImageSource(data.profileImage));
        const html = `${blocks.leftBlocks.join("\n")}\n${blocks.rightBlocks.join("\n")}`;

        assert.equal((html.match(new RegExp(experienceBadgeText, "g")) || []).length, 1, `${layout} should render the work badge once`);
        assert.equal((html.match(/resume-work-badge/g) || []).length, 1, `${layout} should keep the shared work badge contract scoped to experience badges`);
        assert.ok(html.includes("my-resume-badge-icon"), `${layout} should reuse the shared award icon`);
        assert.ok(html.includes(expectedWorkBadgeClassByLayout[layout]), `${layout} should keep the expected work badge wrapper classes`);
        assert.ok(html.includes(projectBadgeText), `${layout} should keep project badge rendering intact`);
        assertOrderedFragments(html, expectedWorkBadgeOrderByLayout[layout]);
    }
});

test("experience highlight only controls inline emphasis inside experience bullets across all layouts", () => {
    const layouts = [RESUME_LAYOUT_CLASSIC, RESUME_LAYOUT_CARDS, RESUME_LAYOUT_MY_RESUME, RESUME_LAYOUT_MY_RESUME3];

    for (const layout of layouts) {
        const data = normalizeResumeData({
            ...sampleResumeData,
            resumeLayout: layout,
            experiences: [
                {
                    title: "强调经历",
                    company: "强调公司",
                    period: "2022 - 至今",
                    highlight: true,
                    workBadgeEnabled: false,
                    bullets: ["负责 **核心平台** 建设"]
                },
                {
                    title: "普通经历",
                    company: "普通公司",
                    period: "2020 - 2022",
                    highlight: false,
                    workBadgeEnabled: false,
                    bullets: ["参与 **日常迭代** 支持"]
                }
            ]
        });
        const blocks = buildLayoutColumnBlocks(layout, data, getAvatarImageSource(data.profileImage));
        const html = `${blocks.leftBlocks.join("\n")}\n${blocks.rightBlocks.join("\n")}`;

        assert.match(html, /<strong(?: class="[^"]+")?>核心平台<\/strong>/, `${layout} should render strong emphasis for highlighted experience bullets`);
        assert.ok(html.includes("**日常迭代**"), `${layout} should keep literal emphasis markers when highlight is disabled`);
        assert.equal(html.includes("重点经历"), false, `${layout} should not derive a badge from highlight`);
    }
});

test("professional skills mode defaults to skills for sample and legacy data", () => {
    assert.equal(normalizeResumeData(sampleResumeData).professionalSkillsMode, PROFESSIONAL_SKILLS_MODE_SKILLS);
    assert.equal(normalizeResumeData({}).professionalSkillsMode, PROFESSIONAL_SKILLS_MODE_SKILLS);
    assert.equal(
        normalizeResumeData({
            ...sampleResumeData,
            professionalSkillsMode: "unexpected-value"
        }).professionalSkillsMode,
        PROFESSIONAL_SKILLS_MODE_SKILLS
    );
});

test("sectionOrder normalizes to supported draggable sections", () => {
    assert.deepEqual(normalizeResumeData({}).sectionOrder, RESUME_REORDERABLE_SECTION_IDS);
    assert.deepEqual(
        normalizeResumeData({
            ...sampleResumeData,
            sectionOrder: ["projects", "projects", "unknown", "education"]
        }).sectionOrder,
        ["projects", "education", "skills", "experiences"]
    );
});

test("form renderer follows sectionOrder for draggable form sections", () => {
    const resumeData = normalizeResumeData({
        ...sampleResumeData,
        sectionOrder: ["projects", "education", "experiences", "skills"]
    });
    const html = renderFormHtml({
        resumeData,
        panelState: createInitialPanelState(),
        activeBasicInfoPickerIndex: -1,
        avatarCropState: null
    });

    assertOrderedFragments(html, [
        'data-section-id="projects"',
        'data-section-id="education"',
        'data-section-id="experiences"',
        'data-section-id="skills"'
    ]);
});

test("form renderer exposes the focused 字体 contract", () => {
    const expandedPanelState = {
        ...createInitialPanelState(),
        theme: false,
        font: false
    };
    const normalizedResumeData = normalizeResumeData(sampleResumeData);
    const html = renderFormHtml({
        resumeData: normalizedResumeData,
        panelState: expandedPanelState,
        activeBasicInfoPickerIndex: -1,
        avatarCropState: null
    });
    const fontSectionStart = html.indexOf('data-action="toggle-section" data-section-id="font"');
    const fontSectionHtml = html.slice(fontSectionStart, fontSectionStart + 9000);
    const spacingSectionStart = html.indexOf('data-action="toggle-section" data-section-id="spacing"');
    const spacingSectionHtml = html.slice(spacingSectionStart, spacingSectionStart + 9000);

    assert.equal(createInitialPanelState().font, false);
    assert.equal(createInitialPanelState().spacing, true);
    assert.equal(html.includes("字体区"), false);
    assert.ok(fontSectionStart >= 0);
    assert.ok(spacingSectionStart >= 0);
    assert.ok(fontSectionHtml.includes("字体</p>"));
    assert.ok(fontSectionHtml.includes("h-auto opacity-100 mt-3"));
    assert.ok(spacingSectionHtml.includes("间距与版式</p>"));
    assert.ok(spacingSectionHtml.includes("h-0 opacity-0 pointer-events-none mt-0"));
    assert.equal(html.includes("全局排版微调"), false);
    assert.equal(sampleResumeData.basicInfoScale, 1);
    assert.equal(normalizedResumeData.basicInfoScale, 1);
    assert.equal(sampleResumeData.basicInfoIconScale, 1);
    assert.equal(normalizedResumeData.basicInfoIconScale, 1);
    assert.equal(sampleResumeData.skillGroupNameScale, 1);
    assert.equal(normalizedResumeData.skillGroupNameScale, 1);
    assert.equal(sampleResumeData.skillTagScale, 1);
    assert.equal(normalizedResumeData.skillTagScale, 1);
    assert.equal(sampleResumeData.workProjectMetaScale, 1);
    assert.equal(normalizedResumeData.workProjectMetaScale, 1);
    assert.equal(sampleResumeData.moduleMarginYScale, 1);
    assert.equal(normalizedResumeData.moduleMarginYScale, 1);
    assert.equal(sampleResumeData.moduleMarginXScale, 1);
    assert.equal(normalizedResumeData.moduleMarginXScale, 1);
    assert.equal(sampleResumeData.modulePaddingYScale, 1);
    assert.equal(normalizedResumeData.modulePaddingYScale, 1);
    assert.equal(sampleResumeData.modulePaddingXScale, 1);
    assert.equal(normalizedResumeData.modulePaddingXScale, 1);
    assert.equal(sampleResumeData.pagePaddingYScale, 1);
    assert.equal(normalizedResumeData.pagePaddingYScale, 1);
    assert.equal(sampleResumeData.pagePaddingXScale, 1);
    assert.equal(normalizedResumeData.pagePaddingXScale, 1);
    assert.equal(sampleResumeData.bodyLineHeightScale, 1);
    assert.equal(normalizedResumeData.bodyLineHeightScale, 1);

    const fontControlFields = [
        "fontScale",
        "basicInfoScale",
        "titleScale",
        "nameScale",
        "roleScale",
        "basicInfoIconScale",
        "skillGroupNameScale",
        "skillTagScale",
        "workProjectMetaScale"
    ];
    for (const field of fontControlFields) {
        assert.ok(html.includes(`data-section="layoutControls" data-field="${field}"`));
    }

    const spacingControlFields = [
        "moduleMarginYScale",
        "moduleMarginXScale",
        "modulePaddingYScale",
        "modulePaddingXScale",
        "pagePaddingYScale",
        "pagePaddingXScale",
        "bodyLineHeightScale"
    ];
    for (const field of spacingControlFields) {
        assert.ok(html.includes(`data-section="layoutControls" data-field="${field}"`));
    }

    assert.ok(fontSectionHtml.includes('min="0.85"'));
    assert.ok(fontSectionHtml.includes('min="0.8"'));
    assert.ok(fontSectionHtml.includes('min="0.75"'));
    const zeroMinMarginOccurrences = (spacingSectionHtml.match(/<input type="range" min="0" max="1.2"/g) || []).length;
    assert.equal(zeroMinMarginOccurrences, 2);
    assert.ok(spacingSectionHtml.includes('min="0.8"'));

    assert.ok(fontSectionHtml.includes('data-layout-control-value="fontScale">100%</output>'));
    assert.ok(fontSectionHtml.includes(">85%</span>"));
    assert.ok(spacingSectionHtml.includes('data-layout-control-value="moduleMarginYScale">40px</output>'));
    assert.ok(spacingSectionHtml.includes(">0px</span>"));
    assert.ok(spacingSectionHtml.includes(">48px</span>"));
    assert.ok(spacingSectionHtml.includes('data-layout-control-value="bodyLineHeightScale">1x</output>'));
    assert.ok(spacingSectionHtml.includes(">0.8x</span>"));
    assert.ok(html.includes(">1.15x</span>"));
    assert.equal(spacingSectionHtml.includes('data-layout-control-value="moduleMarginYScale">100%</output>'), false);
    assert.equal(spacingSectionHtml.includes('data-layout-control-value="bodyLineHeightScale">100%</output>'), false);

    assert.ok(html.includes("正文"));
    assert.ok(html.includes("基本信息文字大小"));
    assert.ok(html.includes("模块标题"));
    assert.ok(html.includes("姓名"));
    assert.ok(html.includes("目标岗位"));
    assert.ok(html.includes("基本信息图标"));
    assert.ok(html.includes("技能组名称"));
    assert.ok(html.includes("技能标签"));
    assert.ok(html.includes("工作/项目元信息"));
    assert.ok(html.includes("模块外边距（纵向）"));
    assert.ok(html.includes("模块外边距（横向）"));
    assert.ok(html.includes("模块内边距（纵向）"));
    assert.ok(html.includes("模块内边距（横向）"));
    assert.ok(html.includes("页面边距（纵向）"));
    assert.ok(html.includes("页面边距（横向）"));
    assert.ok(html.includes("正文行高"));

    const legacyFields = [
        "lineHeightScale",
        "innerPaddingScale",
        "cardsColumnGapScale",
        "moduleSpacingScale",
        "surfacePaddingScale",
        "pagePaddingScale"
    ];
    for (const field of legacyFields) {
        assert.equal(html.includes(`data-field="${field}"`), false);
    }

    assert.ok(fontSectionHtml.includes("9 项"));
    assert.ok(spacingSectionHtml.includes("7 项"));
    assert.equal((html.match(/data-section="layoutControls" data-field="/g) || []).length, 16);

    const collapsedHtml = renderFormHtml({
        resumeData: normalizeResumeData(sampleResumeData),
        panelState: {
            ...expandedPanelState,
            font: true
        },
        activeBasicInfoPickerIndex: -1,
        avatarCropState: null
    });
    const collapsedFontSectionStart = collapsedHtml.indexOf('data-action="toggle-section" data-section-id="font"');
    const collapsedFontSectionHtml = collapsedHtml.slice(collapsedFontSectionStart, collapsedFontSectionStart + 9000);

    assert.ok(collapsedFontSectionStart >= 0);
    assert.ok(collapsedFontSectionHtml.includes("-rotate-90"));
    assert.ok(collapsedFontSectionHtml.includes("h-0 opacity-0 pointer-events-none mt-0"));

    const expandedSpacingHtml = renderFormHtml({
        resumeData: normalizeResumeData(sampleResumeData),
        panelState: {
            ...expandedPanelState,
            spacing: false
        },
        activeBasicInfoPickerIndex: -1,
        avatarCropState: null
    });
    const expandedSpacingSectionStart = expandedSpacingHtml.indexOf('data-action="toggle-section" data-section-id="spacing"');
    const expandedSpacingSectionHtml = expandedSpacingHtml.slice(expandedSpacingSectionStart, expandedSpacingSectionStart + 9000);

    assert.ok(expandedSpacingSectionStart >= 0);
    assert.ok(expandedSpacingSectionHtml.includes("h-auto opacity-100 mt-3"));
});

test("classic and cards layouts keep exactly one professional skills presentation at a time", () => {
    const groupedSkillMarker = "ExclusiveSkillTag";
    const groupedSkillName = "Exclusive Skill Group";
    const skillsTextMarker = "Exclusive professional skills summary block.";
    const layouts = [RESUME_LAYOUT_CLASSIC, RESUME_LAYOUT_CARDS];

    for (const layout of layouts) {
        const skillsModeData = normalizeResumeData({
            ...sampleResumeData,
            resumeLayout: layout,
            professionalSkillsMode: PROFESSIONAL_SKILLS_MODE_SKILLS,
            skills: [{ name: groupedSkillName, items: [groupedSkillMarker] }],
            professionalSkillsText: skillsTextMarker
        });
        const skillsModeBlocks = buildLayoutColumnBlocks(layout, skillsModeData, getAvatarImageSource(skillsModeData.profileImage));
        const skillsModeLeftHtml = skillsModeBlocks.leftBlocks.join("\n");
        const skillsModeRightHtml = skillsModeBlocks.rightBlocks.join("\n");

        assert.ok(skillsModeLeftHtml.includes(groupedSkillName));
        assert.ok(skillsModeLeftHtml.includes(groupedSkillMarker));
        assert.equal(skillsModeRightHtml.includes(skillsTextMarker), false);

        const textModeData = normalizeResumeData({
            ...sampleResumeData,
            resumeLayout: layout,
            professionalSkillsMode: PROFESSIONAL_SKILLS_MODE_TEXT,
            skills: [{ name: groupedSkillName, items: [groupedSkillMarker] }],
            professionalSkillsText: skillsTextMarker
        });
        const textModeBlocks = buildLayoutColumnBlocks(layout, textModeData, getAvatarImageSource(textModeData.profileImage));
        const textModeLeftHtml = textModeBlocks.leftBlocks.join("\n");
        const textModeRightHtml = textModeBlocks.rightBlocks.join("\n");

        assert.equal(textModeLeftHtml.includes(groupedSkillName), false);
        assert.equal(textModeLeftHtml.includes(groupedSkillMarker), false);
        assert.ok(textModeRightHtml.includes(skillsTextMarker));
    }
});

test("classic and cards layouts follow sectionOrder within their preview columns", () => {
    const orderedSections = ["projects", "skills", "experiences", "education"];
    const layouts = [RESUME_LAYOUT_CLASSIC, RESUME_LAYOUT_CARDS];

    for (const layout of layouts) {
        const groupedModeData = normalizeResumeData({
            ...sampleResumeData,
            resumeLayout: layout,
            sectionOrder: orderedSections,
            professionalSkillsMode: PROFESSIONAL_SKILLS_MODE_SKILLS
        });
        const groupedModeBlocks = buildLayoutColumnBlocks(layout, groupedModeData, getAvatarImageSource(groupedModeData.profileImage));

        assertOrderedFragments(groupedModeBlocks.leftBlocks.join("\n"), ["专业技能", "教育背景"]);
        assertOrderedFragments(groupedModeBlocks.rightBlocks.join("\n"), ["项目经验", "工作经历"]);

        const textModeData = normalizeResumeData({
            ...groupedModeData,
            professionalSkillsMode: PROFESSIONAL_SKILLS_MODE_TEXT,
            professionalSkillsText: "自定义技能摘要"
        });
        const textModeBlocks = buildLayoutColumnBlocks(layout, textModeData, getAvatarImageSource(textModeData.profileImage));

        assertOrderedFragments(textModeBlocks.rightBlocks.join("\n"), ["项目经验", "专业技能", "工作经历"]);
    }
});

test("my-resume uses grouped skill-grid markup only in grouped mode", () => {
    const groupedSkillName = "前端工程";
    const groupedSkillItem = "TypeScript";
    const groupedModeData = normalizeResumeData({
        ...sampleResumeData,
        resumeLayout: RESUME_LAYOUT_MY_RESUME,
        professionalSkillsMode: PROFESSIONAL_SKILLS_MODE_SKILLS,
        professionalSkillsText: "熟悉 **文本模式** 的段落展示。",
        summary: "",
        experiences: [],
        projects: [],
        education: [],
        skills: [
            { name: groupedSkillName, items: [groupedSkillItem, "Vue"] },
            { name: "工程化", items: ["Vite"] },
            { name: "测试", items: ["Vitest"] },
            { name: "协作", items: ["Code Review"] }
        ]
    });
    const groupedModeBlocks = buildLayoutColumnBlocks(
        RESUME_LAYOUT_MY_RESUME,
        groupedModeData,
        getAvatarImageSource(groupedModeData.profileImage)
    );
    const groupedModeHtml = groupedModeBlocks.rightBlocks.join("\n");

    assert.ok(groupedModeHtml.includes("my-resume-skills-grid"));
    assert.ok(groupedModeHtml.includes("my-resume-skill-group-title"));
    assert.ok(groupedModeHtml.includes(groupedSkillName));
    assert.ok(groupedModeHtml.includes(groupedSkillItem));
    assert.equal(groupedModeHtml.includes("my-resume-skills-paragraph"), false);

    const textModeData = normalizeResumeData({
        ...groupedModeData,
        professionalSkillsMode: PROFESSIONAL_SKILLS_MODE_TEXT,
        professionalSkillsText: "熟悉 **文本模式** 的段落展示。"
    });
    const textModeBlocks = buildLayoutColumnBlocks(
        RESUME_LAYOUT_MY_RESUME,
        textModeData,
        getAvatarImageSource(textModeData.profileImage)
    );
    const textModeHtml = textModeBlocks.rightBlocks.join("\n");

    assert.ok(textModeHtml.includes("my-resume-skills-paragraph"));
    assert.ok(textModeHtml.includes("my-resume-skill-strong"));
    assert.equal(textModeHtml.includes("my-resume-skills-grid"), false);

    const reorderedData = normalizeResumeData({
        ...groupedModeData,
        sectionOrder: ["projects", "education", "skills", "experiences"]
    });
    const reorderedBlocks = buildLayoutColumnBlocks(
        RESUME_LAYOUT_MY_RESUME,
        reorderedData,
        getAvatarImageSource(reorderedData.profileImage)
    );

    assertOrderedFragments(reorderedBlocks.rightBlocks.join("\n"), ["核心项目", "教育背景", "专业技能", "工作经历"]);
});

test("my-resume3 keeps bullet text mode and switches to grouped skill-grid markup only in grouped mode", () => {
    const groupedSkillName = "平台能力";
    const groupedSkillItem = "Node.js";
    const groupedModeData = normalizeResumeData({
        ...sampleResumeData,
        resumeLayout: RESUME_LAYOUT_MY_RESUME3,
        professionalSkillsMode: PROFESSIONAL_SKILLS_MODE_SKILLS,
        professionalSkillsText: "**文本模式**\n性能优化",
        summary: "",
        experiences: [],
        projects: [],
        education: [],
        skills: [
            { name: groupedSkillName, items: [groupedSkillItem, "SSR"] },
            { name: "质量保障", items: ["Playwright"] },
            { name: "交付流程", items: ["CI/CD"] },
            { name: "协作机制", items: ["Mentoring"] }
        ]
    });
    const groupedModeBlocks = buildLayoutColumnBlocks(
        RESUME_LAYOUT_MY_RESUME3,
        groupedModeData,
        getAvatarImageSource(groupedModeData.profileImage)
    );
    const groupedModeHtml = groupedModeBlocks.rightBlocks.join("\n");

    assert.ok(groupedModeHtml.includes("my-resume3-skills-grid"));
    assert.ok(groupedModeHtml.includes("my-resume3-skill-group-name"));
    assert.ok(groupedModeHtml.includes(groupedSkillName));
    assert.ok(groupedModeHtml.includes(groupedSkillItem));
    assert.equal(groupedModeHtml.includes("my-resume3-bullet-list"), false);

    const textModeData = normalizeResumeData({
        ...groupedModeData,
        professionalSkillsMode: PROFESSIONAL_SKILLS_MODE_TEXT,
        professionalSkillsText: "**文本模式**\n性能优化"
    });
    const textModeBlocks = buildLayoutColumnBlocks(
        RESUME_LAYOUT_MY_RESUME3,
        textModeData,
        getAvatarImageSource(textModeData.profileImage)
    );
    const textModeHtml = textModeBlocks.rightBlocks.join("\n");

    assert.ok(textModeHtml.includes("my-resume3-bullet-list"));
    assert.ok(textModeHtml.includes("my-resume3-emphasis"));
    assert.equal(textModeHtml.includes("my-resume3-skills-grid"), false);

    const reorderedData = normalizeResumeData({
        ...groupedModeData,
        sectionOrder: ["education", "projects", "experiences", "skills"]
    });
    const reorderedBlocks = buildLayoutColumnBlocks(
        RESUME_LAYOUT_MY_RESUME3,
        reorderedData,
        getAvatarImageSource(reorderedData.profileImage)
    );

    assertOrderedFragments(reorderedBlocks.rightBlocks.join("\n"), ["教育经历", "项目经历", "工作经历", "专业技能"]);
});
