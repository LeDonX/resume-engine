import test from "node:test";
import assert from "node:assert/strict";

import {
    RESUME_LAYOUT_CONTROL_SETTINGS,
    buildResumeLayoutControlVars,
    normalizeResumeLayoutControlsForLayout
} from "./src/resume-layout-controls.js";

test("spacing sliders expose a narrower day-to-day editing band", () => {
    assert.deepEqual(RESUME_LAYOUT_CONTROL_SETTINGS.innerPaddingScale, {
        min: 0.6,
        max: 1.25,
        step: 0.01,
        defaultValue: 1
    });

    assert.deepEqual(RESUME_LAYOUT_CONTROL_SETTINGS.moduleSpacingScale, {
        min: 0.5,
        max: 1.5,
        step: 0.01,
        defaultValue: 1
    });
});

test("folds classic legacy spacing into module spacing during normalization", () => {
    const controls = normalizeResumeLayoutControlsForLayout({
        moduleSpacingScale: 1.45,
        classicSpacingScale: 1.25,
        cardsSpacingScale: 0.8
    }, "classic");

    assert.equal(controls.moduleSpacingScale, 1.5);
    assert.equal(controls.classicSpacingScale, 1);
    assert.equal(controls.cardsSpacingScale, 1);
});

test("folds only the active cards legacy spacing into module spacing", () => {
    const controls = normalizeResumeLayoutControlsForLayout({
        moduleSpacingScale: 0.62,
        classicSpacingScale: 1.25,
        cardsSpacingScale: 0.8
    }, "cards");

    assert.equal(controls.moduleSpacingScale, 0.5);
    assert.equal(controls.classicSpacingScale, 1);
    assert.equal(controls.cardsSpacingScale, 1);
});

test("build vars use module spacing directly without legacy multiplier composition", () => {
    const vars = buildResumeLayoutControlVars({
        resumeLayout: "cards",
        moduleSpacingScale: 1.2,
        innerPaddingScale: 1.1,
        classicSpacingScale: 1.25,
        cardsSpacingScale: 0.8
    });

    assert.equal(vars["--resume-cards-gap"], "calc(6.2mm * 1.2)");
    assert.equal(vars["--resume-cards-section-gap"], "calc(6.2mm * 1.2)");
    assert.equal(vars["--resume-classic-section-gap"], "calc(2.5rem * 1.2)");
    assert.equal(vars["--resume-classic-spacing-scale"], "1.25");
    assert.equal(vars["--resume-cards-spacing-scale"], "0.8");
});
