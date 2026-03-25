import assert from "node:assert/strict";
import test from "node:test";

import {
    buildResumeLayoutControlVars,
    normalizeResumeLayoutControls
} from "../src/resume-layout-controls.js";

test("normalizeResumeLayoutControls falls back to defaults for missing or invalid values", () => {
    assert.deepEqual(normalizeResumeLayoutControls(), {
        fontScale: 1,
        lineHeightScale: 1,
        innerPaddingScale: 1,
        moduleSpacingScale: 1,
        titleScale: 1,
        nameScale: 1,
        roleScale: 1,
        classicSpacingScale: 1,
        cardsSpacingScale: 1
    });

    assert.deepEqual(normalizeResumeLayoutControls({
        fontScale: "bad",
        lineHeightScale: null,
        innerPaddingScale: undefined,
        moduleSpacingScale: NaN,
        titleScale: "oops",
        nameScale: {},
        roleScale: [],
        classicSpacingScale: false,
        cardsSpacingScale: ""
    }), {
        fontScale: 1,
        lineHeightScale: 1,
        innerPaddingScale: 1,
        moduleSpacingScale: 1,
        titleScale: 1,
        nameScale: 1,
        roleScale: 1,
        classicSpacingScale: 1,
        cardsSpacingScale: 1
    });
});

test("normalizeResumeLayoutControls and buildResumeLayoutControlVars clamp values safely", () => {
    const normalized = normalizeResumeLayoutControls({
        fontScale: 2,
        lineHeightScale: 0.1,
        innerPaddingScale: 2,
        moduleSpacingScale: 0.1,
        titleScale: 0.1,
        nameScale: 2,
        roleScale: 0.1,
        classicSpacingScale: 2,
        cardsSpacingScale: 0.1
    });

    assert.deepEqual(normalized, {
        fontScale: 1.2,
        lineHeightScale: 0.9,
        innerPaddingScale: 1.25,
        moduleSpacingScale: 0.8,
        titleScale: 0.92,
        nameScale: 1.18,
        roleScale: 0.92,
        classicSpacingScale: 1.15,
        cardsSpacingScale: 0.9
    });

    const vars = buildResumeLayoutControlVars(normalized);

    assert.equal(vars["--resume-font-scale"], "1.2");
    assert.equal(vars["--resume-line-height-scale"], "0.9");
    assert.equal(vars["--resume-inner-padding-scale"], "1.25");
    assert.equal(vars["--resume-module-spacing-scale"], "0.8");
    assert.equal(vars["--resume-title-scale"], "0.92");
    assert.equal(vars["--resume-name-scale"], "1.18");
    assert.equal(vars["--resume-role-scale"], "0.92");
    assert.equal(vars["--resume-classic-spacing-scale"], "1.15");
    assert.equal(vars["--resume-cards-spacing-scale"], "0.9");
    assert.equal(vars["--resume-cards-padding"], "calc(5.5mm * 1.25)");
    assert.equal(vars["--resume-cards-gap"], "calc(4.5mm * 0.72)");
    assert.equal(vars["--resume-classic-section-gap"], "calc(2.5rem * 0.92)");
});

test("normalizeResumeLayoutControls ignores malformed non-numeric inputs", () => {
    assert.deepEqual(normalizeResumeLayoutControls({
        fontScale: false,
        lineHeightScale: [],
        innerPaddingScale: {},
        moduleSpacingScale: "   ",
        titleScale: null,
        nameScale: true,
        roleScale: "NaN",
        classicSpacingScale: { value: 1 },
        cardsSpacingScale: "\n\t"
    }), {
        fontScale: 1,
        lineHeightScale: 1,
        innerPaddingScale: 1,
        moduleSpacingScale: 1,
        titleScale: 1,
        nameScale: 1,
        roleScale: 1,
        classicSpacingScale: 1,
        cardsSpacingScale: 1
    });

    assert.deepEqual(normalizeResumeLayoutControls({
        fontScale: "1.08",
        lineHeightScale: "1.1",
        innerPaddingScale: "1.02",
        moduleSpacingScale: "0.95",
        titleScale: "1.05",
        nameScale: "1.12",
        roleScale: "1.04",
        classicSpacingScale: "1.1",
        cardsSpacingScale: "0.94"
    }), {
        fontScale: 1.08,
        lineHeightScale: 1.1,
        innerPaddingScale: 1.02,
        moduleSpacingScale: 0.95,
        titleScale: 1.05,
        nameScale: 1.12,
        roleScale: 1.04,
        classicSpacingScale: 1.1,
        cardsSpacingScale: 0.94
    });
});

test("buildResumeLayoutControlVars emits new typography vars and layout-specific spacing vars", () => {
    const vars = buildResumeLayoutControlVars({
        fontScale: 1.08,
        lineHeightScale: 1.12,
        innerPaddingScale: 1.03,
        moduleSpacingScale: 1.2,
        titleScale: 1.06,
        nameScale: 1.1,
        roleScale: 1.04,
        classicSpacingScale: 1.1,
        cardsSpacingScale: 0.95
    });

    assert.equal(vars["--resume-title-scale"], "1.06");
    assert.equal(vars["--resume-name-scale"], "1.1");
    assert.equal(vars["--resume-role-scale"], "1.04");
    assert.equal(vars["--resume-classic-spacing-scale"], "1.1");
    assert.equal(vars["--resume-cards-spacing-scale"], "0.95");
    assert.equal(vars["--resume-cards-gap"], "calc(4.5mm * 1.14)");
    assert.equal(vars["--resume-cards-section-gap"], "calc(4mm * 1.14)");
    assert.equal(vars["--resume-classic-section-gap"], "calc(2.5rem * 1.32)");
    assert.equal(vars["--resume-classic-stack-gap"], "calc(1rem * 1.32)");
});
