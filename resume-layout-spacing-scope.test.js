import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("./src/styles/main.css", import.meta.url), "utf8");
const ruleBodiesBySelector = new Map();
const PUBLIC_SPACING_VAR_PATTERN = /--resume-(?:module-margin-[xy]-scale|module-padding-[xy]-scale|page-padding-[xy]-scale)/;

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

test("spacing controls stay wired only to page shells, module boundaries, surface insets, and body copy", () => {
    const rootThemeRule = getRuleBlocks(".resume-theme-shell")[0];
    assert.match(rootThemeRule, /--resume-cards-gap:\s*calc\(4mm \* var\(--resume-module-margin-x-scale, 1\)\)/);
    assert.match(rootThemeRule, /--resume-cards-section-gap:\s*calc\(4mm \* var\(--resume-module-margin-y-scale, 1\)\)/);
    assert.match(rootThemeRule, /--resume-module-inline-boundary-offset:\s*calc\(\(var\(--resume-module-margin-x-scale, 1\) - 1\) \* 2rem\)/);
    assert.match(rootThemeRule, /--resume-classic-left-padding:\s*calc\(2rem \* var\(--resume-page-padding-y-scale, 1\)\) calc\(2rem \* var\(--resume-page-padding-x-scale, 1\)\)/);
    assert.match(rootThemeRule, /--resume-classic-right-padding-x:\s*calc\(3rem \* var\(--resume-page-padding-x-scale, 1\)\)/);
    assert.match(rootThemeRule, /--resume-classic-section-gap:\s*calc\(2\.5rem \* var\(--resume-module-margin-y-scale, 1\)\)/);
    assert.match(rootThemeRule, /--resume-card-padding-y:\s*calc\(1\.25rem \* var\(--resume-module-padding-y-scale, 1\)\)/);
    assert.match(rootThemeRule, /--resume-card-padding-x:\s*calc\(1\.25rem \* var\(--resume-module-padding-x-scale, 1\)\)/);

    const cardsThemeRule = getRuleBlocks(".resume-layout-cards.resume-theme-shell")[0];
    assert.match(cardsThemeRule, /--resume-cards-gap:\s*calc\(3\.1mm \* var\(--resume-module-margin-x-scale, 1\)\)/);
    assert.match(cardsThemeRule, /--resume-cards-padding-y:\s*calc\(3\.1mm \* var\(--resume-page-padding-y-scale, 1\)\)/);
    assert.match(cardsThemeRule, /--resume-cards-padding-x:\s*calc\(3\.1mm \* var\(--resume-page-padding-x-scale, 1\)\)/);
    assert.match(cardsThemeRule, /--resume-cards-columns-width:\s*calc\(var\(--resume-page-width\) - \(var\(--resume-cards-padding-x\) \* 2\) - var\(--resume-cards-gap\)\)/);
    assert.match(cardsThemeRule, /--resume-cards-left-width:\s*calc\(var\(--resume-cards-columns-width\) \* var\(--resume-cards-left-ratio\)\)/);
    assert.match(cardsThemeRule, /--resume-cards-right-width:\s*calc\(var\(--resume-cards-columns-width\) \* var\(--resume-cards-right-ratio\)\)/);
    assert.match(cardsThemeRule, /--resume-cards-section-gap:\s*calc\(3\.1mm \* var\(--resume-module-margin-y-scale, 1\)\)/);

    const cardsPrintSheetRule = getRuleBlocks('.resume-page[data-resume-layout="cards"] .resume-sheet')[0];
    assert.match(cardsPrintSheetRule, /padding:\s*var\(--resume-cards-padding\)\s*!important/);
    assert.match(cardsPrintSheetRule, /gap:\s*var\(--resume-cards-gap\)\s*!important/);

    const myResumeThemeRule = getRuleBlocks(".resume-layout-my-resume.resume-theme-shell")[0];
    assert.match(myResumeThemeRule, /--resume-my-page-padding-x:\s*calc\(3rem \* var\(--resume-page-padding-x-scale, 1\)\)/);

    const myResume3ThemeRule = getRuleBlocks(".resume-layout-my-resume3.resume-theme-shell")[0];
    assert.match(myResume3ThemeRule, /--resume-my3-page-padding-x:\s*calc\(3rem \* var\(--resume-page-padding-x-scale, 1\)\)/);

    const bodyLineHeightSelectors = [
        ".resume-summary-text",
        ".resume-layout-cards .resume-project-description",
        ".resume-classic-summary-text",
        ".my-resume-paragraph",
        ".my-resume3-project-description"
    ];

    for (const selector of bodyLineHeightSelectors) {
        const blocks = getRuleBlocks(selector);
        assert.ok(
            blocks.some((block) => block.includes("--resume-body-line-height-scale")),
            `${selector} should use --resume-body-line-height-scale`
        );
    }

    const pagePaddingSelectors = [
        [".resume-layout-classic .resume-left", "--resume-classic-left-padding"],
        [".resume-layout-classic .resume-right", "--resume-classic-right-padding-y"],
        [".resume-layout-classic .resume-right", "--resume-classic-right-padding-x"],
        [".resume-layout-cards .resume-sheet", "--resume-cards-padding"],
        [".resume-layout-my-resume .resume-right", "--resume-my-page-padding-x"],
        [".resume-layout-my-resume3 .resume-right", "--resume-my3-page-padding-x"]
    ];

    for (const [selector, expectedVar] of pagePaddingSelectors) {
        const blocks = getRuleBlocks(selector);
        assert.ok(
            blocks.some((block) => block.includes(expectedVar)),
            `${selector} should use ${expectedVar}`
        );
    }

    const moduleMarginSelectors = [
        [".resume-classic-avatar-section", "--resume-module-margin-y-scale"],
        [".resume-classic-section", "--resume-classic-section-gap"],
        [".resume-classic-avatar-section", "--resume-module-inline-boundary-offset"],
        [".resume-classic-section", "--resume-module-inline-boundary-offset"],
        [".resume-classic-section-tight", "--resume-module-inline-boundary-offset"],
        [".resume-layout-cards .resume-left", "--resume-cards-section-gap"],
        [".resume-layout-cards.resume-theme-shell", "--resume-module-margin-x-scale"],
        [".my-resume-header", "--resume-my-section-gap"],
        [".my-resume-header", "--resume-module-inline-boundary-offset"],
        [".my-resume-section", "--resume-module-inline-boundary-offset"],
        [".my-resume-flow-block", "--resume-module-inline-boundary-offset"],
        [".my-resume3-header", "--resume-module-inline-boundary-offset"],
        [".my-resume3-section", "--resume-module-inline-boundary-offset"],
        [".my-resume3-flow-block", "--resume-my3-block-gap"],
        [".my-resume3-flow-block", "--resume-module-inline-boundary-offset"]
    ];

    for (const [selector, expectedVar] of moduleMarginSelectors) {
        const blocks = getRuleBlocks(selector);
        assert.ok(
            blocks.some((block) => block.includes(expectedVar)),
            `${selector} should use ${expectedVar}`
        );
    }

    const cardsWidthSelectors = [
        [".resume-layout-cards .resume-left", "--resume-cards-left-width"],
        [".resume-layout-cards .resume-right", "--resume-cards-right-width"],
        [".resume-page[data-resume-layout=\"cards\"] .resume-left", "--resume-cards-left-width"],
        [".resume-page[data-resume-layout=\"cards\"] .resume-right", "--resume-cards-right-width"]
    ];

    for (const [selector, expectedVar] of cardsWidthSelectors) {
        const blocks = getRuleBlocks(selector);
        assert.ok(
            blocks.some((block) => block.includes(expectedVar)),
            `${selector} should use ${expectedVar}`
        );
    }

    const modulePaddingSelectors = [
        [".resume-card", "--resume-card-padding"],
        [".resume-classic-project-card", "--resume-classic-card-padding"],
        [".resume-layout-cards .resume-card", "--resume-card-lg-padding"],
        [".my-resume-skill-group", "--resume-module-padding-y-scale"],
        [".my-resume3-project-card", "--resume-module-padding-x-scale"]
    ];

    for (const [selector, expectedVar] of modulePaddingSelectors) {
        const blocks = getRuleBlocks(selector);
        assert.ok(
            blocks.some((block) => block.includes(expectedVar)),
            `${selector} should use ${expectedVar}`
        );
    }

    const internalRhythmSelectors = [
        ".resume-card-title-row",
        ".resume-layout-cards .resume-contact-list",
        ".my-resume-contact-grid",
        ".my-resume3-header-copy",
        ".resume-classic-entry-head",
        ".resume-bullet-list",
        ".my-resume-skill-tag-list",
        ".my-resume3-skill-item-list"
    ];

    for (const selector of internalRhythmSelectors) {
        const blocks = getRuleBlocks(selector);
        assert.ok(
            blocks.every((block) => !PUBLIC_SPACING_VAR_PATTERN.test(block)),
            `${selector} should not reference public page/module spacing vars`
        );
    }
});


test("my-resume3 header spacing uses dedicated top and bottom personal-info controls", () => {
    const myResume3ThemeRule = getRuleBlocks(".resume-layout-my-resume3.resume-theme-shell")[0];

    assert.match(
        myResume3ThemeRule,
        /--resume-my3-header-info-top-gap:\s*calc\(3rem \* var\(--resume-my3-header-info-top-margin-scale, 1\)\)/,
        "my-resume3 theme shell should derive a dedicated top gap for the header info block"
    );
    assert.match(
        myResume3ThemeRule,
        /--resume-my3-header-info-bottom-gap:\s*calc\(1\.94rem \* var\(--resume-my3-header-info-bottom-margin-scale, 1\)\)/,
        "my-resume3 theme shell should derive a dedicated bottom gap for the header block"
    );
    assert.ok(
        getRuleBlocks(".my-resume3-header-copy").some((block) => /gap:\s*var\(--resume-my3-header-info-top-gap\)/.test(block)),
        ".my-resume3-header-copy should consume the dedicated top gap"
    );
    assert.ok(
        getRuleBlocks(".my-resume3-header").some((block) => /margin-bottom:\s*var\(--resume-my3-header-info-bottom-gap\)/.test(block)),
        ".my-resume3-header should consume the dedicated bottom gap"
    );
    assert.ok(
        getRuleBlocks(".resume-page[data-resume-layout=\"my-resume3\"] .my-resume3-header").some((block) => /margin-bottom:\s*var\(--resume-my3-header-info-bottom-gap\) !important/.test(block)),
        "print override should keep using the dedicated my-resume3 header bottom gap"
    );
});

test("my-resume3 header line-height control stays scoped to meta text instead of reintroducing density coupling", () => {
    assert.ok(
        getRuleBlocks(".my-resume3-meta-text").some((block) => /line-height:\s*calc\(1\.5 \* var\(--resume-my3-header-info-line-height-scale, 1\)\)/.test(block)),
        ".my-resume3-meta-text should consume the dedicated line-height control"
    );
    assert.ok(
        getRuleBlocks(".my-resume3-meta-item").every((block) => !block.includes("--resume-my3-header-info-line-height-scale")),
        ".my-resume3-meta-item should not reference the dedicated line-height control"
    );
    const myResume3ThemeRule = getRuleBlocks(".resume-layout-my-resume3.resume-theme-shell")[0];
    assert.match(
        myResume3ThemeRule,
        /--resume-my3-meta-item-min-height:\s*1\.72rem/,
        "my-resume3 meta item min-height should remain fixed so line-height control does not masquerade as a density slider"
    );
});
