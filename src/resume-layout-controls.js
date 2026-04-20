import {
    RESUME_LAYOUT_CARDS,
    RESUME_LAYOUT_CLASSIC,
    RESUME_LAYOUT_MY_RESUME,
    RESUME_LAYOUT_MY_RESUME3
} from "./core/config.js";

export const RESUME_LAYOUT_CONTROL_SETTINGS = Object.freeze({
    fontScale: Object.freeze({ min: 0.85, max: 1.3, step: 0.01, defaultValue: 1 }),
    basicInfoScale: Object.freeze({ min: 0.8, max: 1.1, step: 0.01, defaultValue: 1 }),
    titleScale: Object.freeze({ min: 0.75, max: 1.35, step: 0.01, defaultValue: 1 }),
    nameScale: Object.freeze({ min: 0.75, max: 1.45, step: 0.01, defaultValue: 1 }),
    roleScale: Object.freeze({ min: 0.8, max: 1.3, step: 0.01, defaultValue: 1 }),
    basicInfoIconScale: Object.freeze({ min: 0.75, max: 1.3, step: 0.01, defaultValue: 1 }),
    skillGroupNameScale: Object.freeze({ min: 0.8, max: 1.35, step: 0.01, defaultValue: 1 }),
    skillTagScale: Object.freeze({ min: 0.85, max: 1.3, step: 0.01, defaultValue: 1 }),
    workProjectMetaScale: Object.freeze({ min: 0.85, max: 1.3, step: 0.01, defaultValue: 1 }),
    moduleMarginYScale: Object.freeze({ min: 0, max: 1.2, step: 0.01, defaultValue: 1 }),
    moduleMarginXScale: Object.freeze({ min: 0, max: 1.2, step: 0.01, defaultValue: 1 }),
    modulePaddingYScale: Object.freeze({ min: 0.75, max: 1.15, step: 0.01, defaultValue: 1 }),
    modulePaddingXScale: Object.freeze({ min: 0.75, max: 1.15, step: 0.01, defaultValue: 1 }),
    pagePaddingYScale: Object.freeze({ min: 0.75, max: 1.15, step: 0.01, defaultValue: 1 }),
    pagePaddingXScale: Object.freeze({ min: 0.75, max: 1.15, step: 0.01, defaultValue: 1 }),
    bodyLineHeightScale: Object.freeze({ min: 0.8, max: 1.15, step: 0.01, defaultValue: 1 })
});

const FONT_CONTROL_FIELDS = new Set([
    "fontScale",
    "basicInfoScale",
    "titleScale",
    "nameScale",
    "roleScale",
    "basicInfoIconScale",
    "skillGroupNameScale",
    "skillTagScale",
    "workProjectMetaScale"
]);

const MM_TO_PX = 96 / 25.4;
const REM_TO_PX = 16;

const RESUME_LAYOUT_SPACING_DISPLAY_BASES = Object.freeze({
    [RESUME_LAYOUT_CLASSIC]: Object.freeze({
        moduleMarginYScale: Object.freeze({ baseValue: 2.5, unit: "rem" }),
        moduleMarginXScale: Object.freeze({ baseValue: 2, unit: "rem", relativeToDefault: true }),
        modulePaddingYScale: Object.freeze({ baseValue: 1.25, unit: "rem" }),
        modulePaddingXScale: Object.freeze({ baseValue: 1.25, unit: "rem" }),
        pagePaddingYScale: Object.freeze({ baseValue: 2, unit: "rem" }),
        pagePaddingXScale: Object.freeze({ baseValue: 3, unit: "rem" })
    }),
    [RESUME_LAYOUT_CARDS]: Object.freeze({
        moduleMarginYScale: Object.freeze({ baseValue: 3.1, unit: "mm" }),
        moduleMarginXScale: Object.freeze({ baseValue: 6.2, unit: "mm" }),
        modulePaddingYScale: Object.freeze({ baseValue: 2, unit: "rem" }),
        modulePaddingXScale: Object.freeze({ baseValue: 2, unit: "rem" }),
        pagePaddingYScale: Object.freeze({ baseValue: 8.2, unit: "mm" }),
        pagePaddingXScale: Object.freeze({ baseValue: 8.2, unit: "mm" })
    }),
    [RESUME_LAYOUT_MY_RESUME]: Object.freeze({
        moduleMarginYScale: Object.freeze({ baseValue: 2.35, unit: "rem" }),
        moduleMarginXScale: Object.freeze({ baseValue: 2, unit: "rem", relativeToDefault: true }),
        modulePaddingYScale: Object.freeze({ baseValue: 1.22, unit: "rem" }),
        modulePaddingXScale: Object.freeze({ baseValue: 1.22, unit: "rem" }),
        pagePaddingYScale: Object.freeze({ baseValue: 2, unit: "rem" }),
        pagePaddingXScale: Object.freeze({ baseValue: 3, unit: "rem" })
    }),
    [RESUME_LAYOUT_MY_RESUME3]: Object.freeze({
        moduleMarginYScale: Object.freeze({ baseValue: 2.4, unit: "rem" }),
        moduleMarginXScale: Object.freeze({ baseValue: 2, unit: "rem", relativeToDefault: true }),
        modulePaddingYScale: Object.freeze({ baseValue: 1.2, unit: "rem" }),
        modulePaddingXScale: Object.freeze({ baseValue: 1.2, unit: "rem" }),
        pagePaddingYScale: Object.freeze({ baseValue: 2, unit: "rem" }),
        pagePaddingXScale: Object.freeze({ baseValue: 3, unit: "rem" })
    })
});

function formatScale(value) {
    return Number.parseFloat(Number(value).toFixed(2));
}

function getSetting(field) {
    return RESUME_LAYOUT_CONTROL_SETTINGS[field] || { min: 0, max: 10, step: 0.01, defaultValue: 1 };
}

function normalizeResumeLayoutControlDisplayLayout(layout) {
    const normalized = typeof layout === "string" ? layout.trim().toLowerCase() : "";

    if (normalized === RESUME_LAYOUT_CARDS) {
        return RESUME_LAYOUT_CARDS;
    }

    if (normalized === RESUME_LAYOUT_MY_RESUME) {
        return RESUME_LAYOUT_MY_RESUME;
    }

    if (normalized === RESUME_LAYOUT_MY_RESUME3) {
        return RESUME_LAYOUT_MY_RESUME3;
    }

    return RESUME_LAYOUT_CLASSIC;
}

function parseResumeLayoutControlNumber(value) {
    if (typeof value === "number") {
        return Number.isFinite(value) ? value : Number.NaN;
    }

    if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) {
            return Number.NaN;
        }

        const parsed = Number(trimmed);
        return Number.isFinite(parsed) ? parsed : Number.NaN;
    }

    return Number.NaN;
}

function formatDisplayNumber(value, maximumFractionDigits = 1) {
    const safeValue = Math.abs(value) < 0.05 ? 0 : value;
    return Number.parseFloat(safeValue.toFixed(maximumFractionDigits)).toString();
}

function convertSpacingBaseToPx(baseValue, unit) {
    return unit === "mm" ? baseValue * MM_TO_PX : baseValue * REM_TO_PX;
}

function formatResumeLayoutSpacingValue(field, value, layout) {
    const layoutBases = RESUME_LAYOUT_SPACING_DISPLAY_BASES[normalizeResumeLayoutControlDisplayLayout(layout)]
        || RESUME_LAYOUT_SPACING_DISPLAY_BASES[RESUME_LAYOUT_CLASSIC];
    const base = layoutBases[field];

    if (!base) {
        return `${formatDisplayNumber(value)}px`;
    }

    const basePxValue = convertSpacingBaseToPx(base.baseValue, base.unit);
    const displayValue = base.relativeToDefault
        ? (basePxValue * value) - basePxValue
        : basePxValue * value;

    return `${formatDisplayNumber(displayValue)}px`;
}

export function clampResumeLayoutControl(field, value, fallbackValue) {
    const setting = getSetting(field);
    const parsedFallback = parseResumeLayoutControlNumber(fallbackValue);
    const safeFallback = Number.isFinite(parsedFallback) ? parsedFallback : setting.defaultValue;
    const parsedValue = parseResumeLayoutControlNumber(value);
    const candidate = Number.isFinite(parsedValue) ? parsedValue : safeFallback;

    return formatScale(Math.min(setting.max, Math.max(setting.min, candidate)));
}

export function formatResumeLayoutControlValue(field, value, options = {}) {
    const normalizedValue = clampResumeLayoutControl(field, value);

    if (field === "bodyLineHeightScale") {
        return `${formatDisplayNumber(normalizedValue, 2)}x`;
    }

    if (FONT_CONTROL_FIELDS.has(field)) {
        return `${Math.round(normalizedValue * 100)}%`;
    }

    return formatResumeLayoutSpacingValue(field, normalizedValue, options.layout);
}

export function normalizeResumeLayoutControls(sourceValue = {}) {
    const source = sourceValue && typeof sourceValue === "object" ? sourceValue : {};

    return {
        fontScale: clampResumeLayoutControl("fontScale", source.fontScale),
        basicInfoScale: clampResumeLayoutControl("basicInfoScale", source.basicInfoScale),
        titleScale: clampResumeLayoutControl("titleScale", source.titleScale),
        nameScale: clampResumeLayoutControl("nameScale", source.nameScale),
        roleScale: clampResumeLayoutControl("roleScale", source.roleScale),
        basicInfoIconScale: clampResumeLayoutControl("basicInfoIconScale", source.basicInfoIconScale),
        skillGroupNameScale: clampResumeLayoutControl("skillGroupNameScale", source.skillGroupNameScale),
        skillTagScale: clampResumeLayoutControl("skillTagScale", source.skillTagScale),
        workProjectMetaScale: clampResumeLayoutControl("workProjectMetaScale", source.workProjectMetaScale),
        moduleMarginYScale: clampResumeLayoutControl(
            "moduleMarginYScale",
            source.moduleMarginYScale,
            source.moduleSpacingScale
        ),
        moduleMarginXScale: clampResumeLayoutControl(
            "moduleMarginXScale",
            source.moduleMarginXScale,
            source.moduleSpacingScale
        ),
        modulePaddingYScale: clampResumeLayoutControl(
            "modulePaddingYScale",
            source.modulePaddingYScale,
            source.surfacePaddingScale
        ),
        modulePaddingXScale: clampResumeLayoutControl(
            "modulePaddingXScale",
            source.modulePaddingXScale,
            source.surfacePaddingScale
        ),
        pagePaddingYScale: clampResumeLayoutControl(
            "pagePaddingYScale",
            source.pagePaddingYScale,
            source.pagePaddingScale
        ),
        pagePaddingXScale: clampResumeLayoutControl(
            "pagePaddingXScale",
            source.pagePaddingXScale,
            source.pagePaddingScale
        ),
        bodyLineHeightScale: clampResumeLayoutControl("bodyLineHeightScale", source.bodyLineHeightScale)
    };
}

export function normalizeResumeLayoutControlsForLayout(sourceValue = {}) {
    return normalizeResumeLayoutControls(sourceValue);
}

export function buildResumeLayoutControlVars(sourceValue = {}) {
    const controls = normalizeResumeLayoutControls(sourceValue);

    return {
        "--resume-font-scale": String(controls.fontScale),
        "--resume-basic-info-scale": String(controls.basicInfoScale),
        "--resume-title-scale": String(controls.titleScale),
        "--resume-name-scale": String(controls.nameScale),
        "--resume-role-scale": String(controls.roleScale),
        "--resume-basic-info-icon-scale": String(controls.basicInfoIconScale),
        "--resume-skill-group-name-scale": String(controls.skillGroupNameScale),
        "--resume-skill-tag-scale": String(controls.skillTagScale),
        "--resume-work-project-meta-scale": String(controls.workProjectMetaScale),
        "--resume-module-margin-y-scale": String(controls.moduleMarginYScale),
        "--resume-module-margin-x-scale": String(controls.moduleMarginXScale),
        "--resume-module-padding-y-scale": String(controls.modulePaddingYScale),
        "--resume-module-padding-x-scale": String(controls.modulePaddingXScale),
        "--resume-page-padding-y-scale": String(controls.pagePaddingYScale),
        "--resume-page-padding-x-scale": String(controls.pagePaddingXScale),
        "--resume-body-line-height-scale": String(controls.bodyLineHeightScale)
    };
}
