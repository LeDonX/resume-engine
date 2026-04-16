import test from "node:test";
import assert from "node:assert/strict";

import {
    PROFESSIONAL_SKILLS_MODE_SKILLS,
    PROFESSIONAL_SKILLS_MODE_TEXT,
    RESUME_LAYOUT_CARDS,
    RESUME_LAYOUT_CLASSIC,
    RESUME_LAYOUT_MY_RESUME,
    RESUME_LAYOUT_MY_RESUME3,
    sampleResumeData
} from "./src/core/config.js";
import { normalizeResumeData } from "./src/core/resume-model.js";
import { getAvatarImageSource } from "./src/avatar/avatar-utils.js";
import { buildLayoutColumnBlocks } from "./src/preview/render.js";
import { buildDraftStoragePayload, parseDraftStoragePayload } from "./src/persistence/draft-store.js";

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
});
