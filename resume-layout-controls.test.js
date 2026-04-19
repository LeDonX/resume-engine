import test from "node:test";
import assert from "node:assert/strict";

import {
    RESUME_LAYOUT_CONTROL_SETTINGS,
    buildResumeLayoutControlVars,
    formatResumeLayoutControlValue,
    normalizeResumeLayoutControlsForLayout
} from "./src/resume-layout-controls.js";

test("layout control settings expose typography plus the bounded spacing/layout roles", () => {
    assert.deepEqual(Object.keys(RESUME_LAYOUT_CONTROL_SETTINGS), [
        "fontScale",
        "basicInfoScale",
        "titleScale",
        "nameScale",
        "roleScale",
        "basicInfoIconScale",
        "skillGroupNameScale",
        "skillTagScale",
        "workProjectMetaScale",
        "moduleMarginYScale",
        "moduleMarginXScale",
        "modulePaddingYScale",
        "modulePaddingXScale",
        "pagePaddingYScale",
        "pagePaddingXScale",
        "bodyLineHeightScale"
    ]);

    assert.deepEqual(RESUME_LAYOUT_CONTROL_SETTINGS.fontScale, {
        min: 0.85,
        max: 1.3,
        step: 0.01,
        defaultValue: 1
    });

    assert.deepEqual(RESUME_LAYOUT_CONTROL_SETTINGS.basicInfoScale, {
        min: 0.8,
        max: 1.1,
        step: 0.01,
        defaultValue: 1
    });

    assert.deepEqual(RESUME_LAYOUT_CONTROL_SETTINGS.titleScale, {
        min: 0.75,
        max: 1.35,
        step: 0.01,
        defaultValue: 1
    });

    assert.deepEqual(RESUME_LAYOUT_CONTROL_SETTINGS.nameScale, {
        min: 0.75,
        max: 1.45,
        step: 0.01,
        defaultValue: 1
    });

    assert.deepEqual(RESUME_LAYOUT_CONTROL_SETTINGS.roleScale, {
        min: 0.8,
        max: 1.3,
        step: 0.01,
        defaultValue: 1
    });

    assert.deepEqual(RESUME_LAYOUT_CONTROL_SETTINGS.basicInfoIconScale, {
        min: 0.75,
        max: 1.3,
        step: 0.01,
        defaultValue: 1
    });

    assert.deepEqual(RESUME_LAYOUT_CONTROL_SETTINGS.skillGroupNameScale, {
        min: 0.8,
        max: 1.35,
        step: 0.01,
        defaultValue: 1
    });

    assert.deepEqual(RESUME_LAYOUT_CONTROL_SETTINGS.skillTagScale, {
        min: 0.85,
        max: 1.3,
        step: 0.01,
        defaultValue: 1
    });

    assert.deepEqual(RESUME_LAYOUT_CONTROL_SETTINGS.workProjectMetaScale, {
        min: 0.85,
        max: 1.3,
        step: 0.01,
        defaultValue: 1
    });

    assert.deepEqual(RESUME_LAYOUT_CONTROL_SETTINGS.moduleMarginYScale, {
        min: 0,
        max: 1.2,
        step: 0.01,
        defaultValue: 1
    });

    assert.deepEqual(RESUME_LAYOUT_CONTROL_SETTINGS.moduleMarginXScale, {
        min: 0,
        max: 1.2,
        step: 0.01,
        defaultValue: 1
    });

    assert.deepEqual(RESUME_LAYOUT_CONTROL_SETTINGS.modulePaddingYScale, {
        min: 0.75,
        max: 1.15,
        step: 0.01,
        defaultValue: 1
    });

    assert.deepEqual(RESUME_LAYOUT_CONTROL_SETTINGS.modulePaddingXScale, {
        min: 0.75,
        max: 1.15,
        step: 0.01,
        defaultValue: 1
    });

    assert.deepEqual(RESUME_LAYOUT_CONTROL_SETTINGS.pagePaddingYScale, {
        min: 0.75,
        max: 1.15,
        step: 0.01,
        defaultValue: 1
    });

    assert.deepEqual(RESUME_LAYOUT_CONTROL_SETTINGS.pagePaddingXScale, {
        min: 0.75,
        max: 1.15,
        step: 0.01,
        defaultValue: 1
    });

    assert.deepEqual(RESUME_LAYOUT_CONTROL_SETTINGS.bodyLineHeightScale, {
        min: 0.8,
        max: 1.15,
        step: 0.01,
        defaultValue: 1
    });
});

test("layout control formatter keeps font %, spacing px, and line-height x semantics", () => {
    assert.equal(formatResumeLayoutControlValue("fontScale", 1), "100%");
    assert.equal(formatResumeLayoutControlValue("moduleMarginYScale", 1, { layout: "classic" }), "40px");
    assert.equal(formatResumeLayoutControlValue("moduleMarginYScale", 1, { layout: "cards" }), "23.4px");
    assert.equal(formatResumeLayoutControlValue("moduleMarginXScale", 1, { layout: "classic" }), "0px");
    assert.equal(formatResumeLayoutControlValue("bodyLineHeightScale", 1.12), "1.12x");
});

test("normalization clamps new axis-specific controls and falls back from legacy broad fields", () => {
    const directControls = normalizeResumeLayoutControlsForLayout({
        fontScale: 0.66,
        basicInfoScale: 1.18,
        titleScale: 1.52,
        nameScale: 1.44,
        roleScale: "1.38",
        basicInfoIconScale: 0.74,
        skillGroupNameScale: 1.52,
        skillTagScale: 0.66,
        workProjectMetaScale: "1.38",
        moduleMarginYScale: 1.4,
        moduleMarginXScale: -0.1,
        modulePaddingYScale: 0.72,
        modulePaddingXScale: 1.2,
        pagePaddingYScale: "1.21",
        pagePaddingXScale: "0.7",
        bodyLineHeightScale: 0.72,
        lineHeightScale: 1.2,
        innerPaddingScale: 1.1,
        classicSpacingScale: 1.25,
        cardsSpacingScale: 0.8,
        cardsColumnGapScale: 0.92
    }, "cards");

    assert.deepEqual(directControls, {
        fontScale: 0.85,
        basicInfoScale: 1.1,
        titleScale: 1.35,
        nameScale: 1.44,
        roleScale: 1.3,
        basicInfoIconScale: 0.75,
        skillGroupNameScale: 1.35,
        skillTagScale: 0.85,
        workProjectMetaScale: 1.3,
        moduleMarginYScale: 1.2,
        moduleMarginXScale: 0,
        modulePaddingYScale: 0.75,
        modulePaddingXScale: 1.15,
        pagePaddingYScale: 1.15,
        pagePaddingXScale: 0.75,
        bodyLineHeightScale: 0.8
    });

    const legacyFallbackControls = normalizeResumeLayoutControlsForLayout({
        moduleSpacingScale: 1.09,
        surfacePaddingScale: 1.03,
        pagePaddingScale: "0.97",
        bodyLineHeightScale: 1.1,
        lineHeightScale: 1.2,
        innerPaddingScale: 1.1,
        classicSpacingScale: 1.25,
        cardsSpacingScale: 0.8,
        cardsColumnGapScale: 0.92
    });

    assert.deepEqual(legacyFallbackControls, {
        fontScale: 1,
        basicInfoScale: 1,
        titleScale: 1,
        nameScale: 1,
        roleScale: 1,
        basicInfoIconScale: 1,
        skillGroupNameScale: 1,
        skillTagScale: 1,
        workProjectMetaScale: 1,
        moduleMarginYScale: 1.09,
        moduleMarginXScale: 1.09,
        modulePaddingYScale: 1.03,
        modulePaddingXScale: 1.03,
        pagePaddingYScale: 0.97,
        pagePaddingXScale: 0.97,
        bodyLineHeightScale: 1.1
    });

    const defaultControls = normalizeResumeLayoutControlsForLayout({});
    assert.equal(defaultControls.basicInfoScale, 1);
    assert.equal(defaultControls.workProjectMetaScale, 1);
    assert.equal(defaultControls.moduleMarginYScale, 1);
    assert.equal(defaultControls.moduleMarginXScale, 1);
    assert.equal(defaultControls.modulePaddingYScale, 1);
    assert.equal(defaultControls.modulePaddingXScale, 1);
    assert.equal(defaultControls.pagePaddingYScale, 1);
    assert.equal(defaultControls.pagePaddingXScale, 1);
    assert.equal(defaultControls.bodyLineHeightScale, 1);
});

test("buildResumeLayoutControlVars emits typography plus bounded spacing/layout vars", () => {
    const vars = buildResumeLayoutControlVars({
        fontScale: 1.08,
        basicInfoScale: 0.94,
        titleScale: 1.12,
        nameScale: 1.05,
        roleScale: 0.96,
        basicInfoIconScale: 1.14,
        skillGroupNameScale: 1.16,
        skillTagScale: 0.91,
        workProjectMetaScale: 1.11,
        moduleMarginYScale: 1.09,
        moduleMarginXScale: 1.02,
        modulePaddingYScale: 1.03,
        modulePaddingXScale: 0.97,
        pagePaddingYScale: 0.99,
        pagePaddingXScale: 0.95,
        bodyLineHeightScale: 1.12,
        moduleSpacingScale: 1.2,
        surfacePaddingScale: 1.1,
        pagePaddingScale: 1.08,
        lineHeightScale: 1.2,
        innerPaddingScale: 1.1,
        cardsColumnGapScale: 0.92
    });

    assert.deepEqual(vars, {
        "--resume-font-scale": "1.08",
        "--resume-basic-info-scale": "0.94",
        "--resume-title-scale": "1.12",
        "--resume-name-scale": "1.05",
        "--resume-role-scale": "0.96",
        "--resume-basic-info-icon-scale": "1.14",
        "--resume-skill-group-name-scale": "1.16",
        "--resume-skill-tag-scale": "0.91",
        "--resume-work-project-meta-scale": "1.11",
        "--resume-module-margin-y-scale": "1.09",
        "--resume-module-margin-x-scale": "1.02",
        "--resume-module-padding-y-scale": "1.03",
        "--resume-module-padding-x-scale": "0.97",
        "--resume-page-padding-y-scale": "0.99",
        "--resume-page-padding-x-scale": "0.95",
        "--resume-body-line-height-scale": "1.12"
    });
});
