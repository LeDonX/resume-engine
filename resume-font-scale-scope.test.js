import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("./src/styles/main.css", import.meta.url), "utf8");
const ruleBodiesBySelector = new Map();

for (const [, selectorGroup, body] of css.matchAll(/([^{}]+)\{([^{}]+)\}/g)) {
    for (const selector of selectorGroup.split(",").map((entry) => entry.trim())) {
        const existingBodies = ruleBodiesBySelector.get(selector) || [];
        existingBodies.push(body);
        ruleBodiesBySelector.set(selector, existingBodies);
    }
}

function getRuleBlocks(selector) {
    const blocks = ruleBodiesBySelector.get(selector);
    assert.ok(blocks?.length, `Expected CSS rule for selector: ${selector}`);
    return blocks;
}

test("excluded typography selectors stay outside the 正文 fontScale scope", () => {
    const excludedSelectorRules = [
        [".resume-card-title", "--resume-title-scale"],
        [".resume-card-title-lg", "--resume-title-scale"],
        [".resume-profile-name", "--resume-name-scale"],
        [".resume-profile-role", "--resume-role-scale"],
        [".resume-info-icon", "--resume-basic-info-icon-scale"],
        [".resume-layout-cards .resume-contact-list .resume-info-value", "--resume-basic-info-scale"],
        [".my-resume-name", "--resume-name-scale"],
        [".my-resume-role", "--resume-role-scale"],
        [".my-resume-contact-item", null],
        [".my-resume-contact-icon-svg", "--resume-basic-info-icon-scale"],
        [".my-resume-contact-text", "--resume-basic-info-scale"],
        [".my-resume-section-heading", "--resume-title-scale"],
        [".my-resume3-name", "--resume-name-scale"],
        [".my-resume3-role-badge", "--resume-role-scale"],
        [".my-resume3-meta-icon-svg", "--resume-basic-info-icon-scale"],
        [".my-resume3-meta-text", "--resume-basic-info-scale"],
        [".my-resume3-section-heading", "--resume-title-scale"],
        [".resume-classic-section-title", "--resume-title-scale"],
        [".resume-classic-basic-info-icon", "--resume-basic-info-icon-scale"],
        [".resume-classic-basic-info-text", "--resume-basic-info-scale"],
        [".resume-classic-name", "--resume-name-scale"],
        [".resume-classic-role", "--resume-role-scale"],
        [".resume-classic-section-heading-title", "--resume-title-scale"],
        [".resume-skill-group-name", "--resume-skill-group-name-scale"],
        [".resume-skill-tag", "--resume-skill-tag-scale"],
        [".resume-tech-tag", "--resume-work-project-meta-scale"],
        [".resume-project-badge", "--resume-work-project-meta-scale"],
        [".resume-entry-title", "--resume-work-project-meta-scale"],
        [".resume-entry-company", "--resume-work-project-meta-scale"],
        [".resume-entry-role", "--resume-work-project-meta-scale"],
        [".resume-period-pill", null],
        [".resume-empty-state", null],
        [".resume-layout-cards .resume-skill-group-name", "--resume-skill-group-name-scale"],
        [".resume-layout-cards .resume-skill-tag", "--resume-skill-tag-scale"],
        [".resume-layout-cards .resume-tech-tag", "--resume-work-project-meta-scale"],
        [".resume-layout-cards .resume-project-badge", "--resume-work-project-meta-scale"],
        [".resume-layout-cards .resume-entry-company", "--resume-work-project-meta-scale"],
        [".resume-layout-cards .resume-entry-role", "--resume-work-project-meta-scale"],
        [".resume-layout-cards .resume-entry-title", "--resume-work-project-meta-scale"],
        [".resume-layout-cards .resume-period-pill", null],
        [".resume-layout-cards .resume-experience-entry .resume-period-pill", "--resume-work-project-meta-scale"],
        [".resume-layout-cards .resume-project-item .resume-period-pill", "--resume-work-project-meta-scale"],
        [".resume-layout-cards .resume-empty-state", null],
        [".resume-classic-group-title", "--resume-skill-group-name-scale"],
        [".resume-classic-skill-tag", "--resume-skill-tag-scale"],
        [".resume-classic-project-badge", "--resume-work-project-meta-scale"],
        [".resume-classic-tech-tag", "--resume-work-project-meta-scale"],
        [".resume-classic-entry-title", "--resume-work-project-meta-scale"],
        [".resume-classic-entry-company", "--resume-work-project-meta-scale"],
        [".resume-classic-entry-period", "--resume-work-project-meta-scale"],
        [".resume-classic-project-title", "--resume-work-project-meta-scale"],
        [".resume-classic-project-card .resume-period-pill", "--resume-work-project-meta-scale"],
        [".resume-classic-empty-state", null],
        [".my-resume-skill-group-title", "--resume-skill-group-name-scale"],
        [".my-resume-skill-tag", "--resume-skill-tag-scale"],
        [".my-resume-experience-company", "--resume-work-project-meta-scale"],
        [".my-resume-period", "--resume-work-project-meta-scale"],
        [".my-resume-experience-role", "--resume-work-project-meta-scale"],
        [".resume-work-badge", "--resume-work-project-meta-scale"],
        [".my-resume-highlight-badge", "--resume-work-project-meta-scale"],
        [".my-resume-project-title", "--resume-work-project-meta-scale"],
        [".my-resume-project-tag", "--resume-work-project-meta-scale"],
        [".my-resume-empty-state", null],
        [".my-resume3-skill-group-name", "--resume-skill-group-name-scale"],
        [".my-resume3-skill-item", "--resume-skill-tag-scale"],
        [".my-resume3-timeline-title", null],
        [".my-resume3-work-entry .my-resume3-timeline-title", "--resume-work-project-meta-scale"],
        [".my-resume3-work-role", "--resume-work-project-meta-scale"],
        [".my-resume3-date", null],
        [".my-resume3-work-entry .my-resume3-date", "--resume-work-project-meta-scale"],
        [".my-resume3-project-title", "--resume-work-project-meta-scale"],
        [".my-resume3-project-badge", "--resume-work-project-meta-scale"],
        [".my-resume3-project-tag", "--resume-work-project-meta-scale"],
        [".my-resume3-project-date", "--resume-work-project-meta-scale"],
        [".my-resume3-empty-state", null]
    ];

    for (const [selector, expectedVar] of excludedSelectorRules) {
        const ruleBlocks = getRuleBlocks(selector);
        assert.equal(
            ruleBlocks.some((block) => block.includes("--resume-font-scale")),
            false,
            `${selector} should not use --resume-font-scale`
        );

        assert.equal(
            ruleBlocks.some((block) => block.includes("--resume-body-line-height-scale")),
            false,
            `${selector} should not use --resume-body-line-height-scale`
        );

        if (expectedVar) {
            assert.ok(
                ruleBlocks.some((block) => block.includes(expectedVar)),
                `${selector} should keep using ${expectedVar}`
            );
        }
    }
});

test("representative body copy selectors stay inside the 正文 fontScale scope", () => {
    const bodyCopySelectors = [
        ".resume-card-description",
        ".resume-summary-text",
        ".resume-project-description",
        ".resume-bullet-list",
        ".resume-layout-cards .resume-project-description",
        ".resume-classic-summary-text",
        ".resume-classic-project-description",
        ".resume-classic-bullet-list",
        ".my-resume-paragraph",
        ".my-resume-project-description",
        ".my-resume-experience-description",
        ".resume-layout-my-resume .my-resume-project-details .resume-bullet-list",
        ".my-resume3-bullet-item",
        ".my-resume3-project-description"
    ];

    for (const selector of bodyCopySelectors) {
        const ruleBlocks = getRuleBlocks(selector);
        assert.ok(
            ruleBlocks.some((block) => block.includes("--resume-font-scale")),
            `${selector} should keep using --resume-font-scale`
        );
        assert.ok(
            ruleBlocks.some((block) => block.includes("--resume-body-line-height-scale")),
            `${selector} should keep using --resume-body-line-height-scale`
        );
    }
});

test("shared work badge keeps template 1 visual contract across layout wrappers", () => {
    const sharedBadgeBlocks = getRuleBlocks(".resume-work-badge");
    assert.ok(sharedBadgeBlocks.some((block) => block.includes("background: #fff7ed")));
    assert.ok(sharedBadgeBlocks.some((block) => block.includes("color: #f59e0b")));
    assert.ok(sharedBadgeBlocks.some((block) => block.includes("padding: 0.14rem 0.42rem")));
    assert.ok(sharedBadgeBlocks.some((block) => block.includes("border-radius: 0.38rem")));

    const primaryOverrideBlocks = getRuleBlocks(".resume-work-badge.resume-primary-badge");
    assert.ok(primaryOverrideBlocks.some((block) => block.includes("background: #fff7ed")));
    assert.ok(primaryOverrideBlocks.some((block) => block.includes("color: #f59e0b")));
    assert.ok(primaryOverrideBlocks.some((block) => block.includes("border-color: transparent")));

    const myResume3Blocks = getRuleBlocks(".my-resume3-experience-badge");
    assert.equal(
        myResume3Blocks.some((block) => block.includes("background:")),
        false,
        ".my-resume3-experience-badge should not override shared badge background"
    );
    assert.equal(
        myResume3Blocks.some((block) => block.includes("color:")),
        false,
        ".my-resume3-experience-badge should not override shared badge color"
    );
});
