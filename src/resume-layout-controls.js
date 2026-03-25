export const RESUME_LAYOUT_CONTROL_SETTINGS = Object.freeze({
    fontScale: Object.freeze({ min: 0.85, max: 1.2, step: 0.01, defaultValue: 1 }),
    lineHeightScale: Object.freeze({ min: 0.9, max: 1.25, step: 0.01, defaultValue: 1 }),
    innerPaddingScale: Object.freeze({ min: 0.8, max: 1.25, step: 0.01, defaultValue: 1 }),
    moduleSpacingScale: Object.freeze({ min: 0.8, max: 1.35, step: 0.01, defaultValue: 1 }),
    titleScale: Object.freeze({ min: 0.92, max: 1.12, step: 0.01, defaultValue: 1 }),
    nameScale: Object.freeze({ min: 0.88, max: 1.18, step: 0.01, defaultValue: 1 }),
    roleScale: Object.freeze({ min: 0.92, max: 1.1, step: 0.01, defaultValue: 1 }),
    classicSpacingScale: Object.freeze({ min: 0.9, max: 1.15, step: 0.01, defaultValue: 1 }),
    cardsSpacingScale: Object.freeze({ min: 0.9, max: 1.15, step: 0.01, defaultValue: 1 })
});

function formatScale(value) {
    return Number.parseFloat(Number(value).toFixed(2));
}

function getSetting(field) {
    return RESUME_LAYOUT_CONTROL_SETTINGS[field] || { min: 0, max: 10, step: 0.01, defaultValue: 1 };
}

function composeSpacingScale(baseScale, layoutScale) {
    return formatScale(baseScale * layoutScale);
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

export function clampResumeLayoutControl(field, value, fallbackValue) {
    const setting = getSetting(field);
    const parsedFallback = parseResumeLayoutControlNumber(fallbackValue);
    const safeFallback = Number.isFinite(parsedFallback) ? parsedFallback : setting.defaultValue;
    const parsedValue = parseResumeLayoutControlNumber(value);
    const candidate = Number.isFinite(parsedValue) ? parsedValue : safeFallback;
    return formatScale(Math.min(setting.max, Math.max(setting.min, candidate)));
}

export function normalizeResumeLayoutControls(sourceValue = {}) {
    const source = sourceValue && typeof sourceValue === "object" ? sourceValue : {};
    return {
        fontScale: clampResumeLayoutControl("fontScale", source.fontScale),
        lineHeightScale: clampResumeLayoutControl("lineHeightScale", source.lineHeightScale),
        innerPaddingScale: clampResumeLayoutControl("innerPaddingScale", source.innerPaddingScale),
        moduleSpacingScale: clampResumeLayoutControl("moduleSpacingScale", source.moduleSpacingScale),
        titleScale: clampResumeLayoutControl("titleScale", source.titleScale),
        nameScale: clampResumeLayoutControl("nameScale", source.nameScale),
        roleScale: clampResumeLayoutControl("roleScale", source.roleScale),
        classicSpacingScale: clampResumeLayoutControl("classicSpacingScale", source.classicSpacingScale),
        cardsSpacingScale: clampResumeLayoutControl("cardsSpacingScale", source.cardsSpacingScale)
    };
}

export function buildResumeLayoutControlVars(sourceValue = {}) {
    const controls = normalizeResumeLayoutControls(sourceValue);
    const classicModuleSpacingScale = composeSpacingScale(controls.moduleSpacingScale, controls.classicSpacingScale);
    const cardsModuleSpacingScale = composeSpacingScale(controls.moduleSpacingScale, controls.cardsSpacingScale);

    return {
        "--resume-font-scale": String(controls.fontScale),
        "--resume-line-height-scale": String(controls.lineHeightScale),
        "--resume-inner-padding-scale": String(controls.innerPaddingScale),
        "--resume-module-spacing-scale": String(controls.moduleSpacingScale),
        "--resume-title-scale": String(controls.titleScale),
        "--resume-name-scale": String(controls.nameScale),
        "--resume-role-scale": String(controls.roleScale),
        "--resume-classic-spacing-scale": String(controls.classicSpacingScale),
        "--resume-cards-spacing-scale": String(controls.cardsSpacingScale),
        "--resume-cards-gap": `calc(4.5mm * ${cardsModuleSpacingScale})`,
        "--resume-cards-padding": `calc(5.5mm * ${controls.innerPaddingScale})`,
        "--resume-cards-section-gap": `calc(4mm * ${cardsModuleSpacingScale})`,
        "--resume-classic-left-padding": `calc(2rem * ${controls.innerPaddingScale})`,
        "--resume-classic-right-padding-y": `calc(2rem * ${controls.innerPaddingScale})`,
        "--resume-classic-right-padding-x": `calc(3rem * ${controls.innerPaddingScale})`,
        "--resume-classic-section-gap": `calc(2.5rem * ${classicModuleSpacingScale})`,
        "--resume-classic-section-gap-tight": `calc(1.5rem * ${classicModuleSpacingScale})`,
        "--resume-classic-stack-gap": `calc(1rem * ${classicModuleSpacingScale})`,
        "--resume-classic-bullet-gap": `calc(0.5rem * ${classicModuleSpacingScale})`,
        "--resume-classic-card-padding": `calc(1.25rem * ${controls.innerPaddingScale})`,
        "--resume-classic-avatar-size": `calc(8rem * ${controls.innerPaddingScale})`
    };
}
