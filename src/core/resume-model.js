import {
    BASIC_INFO_COLORS,
    BASIC_INFO_ICON_SET_MAPS,
    BASIC_INFO_ICON_SET_OPTIONS,
    BASIC_INFO_ICON_OPTIONS,
    BASIC_INFO_PRESETS,
    DEFAULT_EXPERIENCE_WORK_BADGE_LABEL,
    ICON_PALETTE_OPTIONS,
    LEGACY_FOLLOW_LAYOUT_ICON_SET,
    PROFESSIONAL_SKILLS_MODE_SKILLS,
    PROFESSIONAL_SKILLS_MODE_TEXT,
    RESUME_REORDERABLE_SECTION_IDS,
    RESUME_LAYOUT_CARDS,
    RESUME_LAYOUT_CLASSIC,
    RESUME_LAYOUT_MY_RESUME,
    RESUME_LAYOUT_MY_RESUME3,
    RESUME_LAYOUT_OPTIONS,
    RESUME_THEME_OPTIONS,
    SECTION_TITLE_ICON_SET_MAPS,
    SECTION_TITLE_ICON_SET_OPTIONS,
    getDefaultBasicInfoIconSetForLayout,
    getDefaultSectionTitleIconSetForLayout,
    isExperienceWorkBadgeEnabledByLayout,
    sampleResumeData
} from "./config.js";
import {
    arrayToLines,
    escapeHtml,
    hasOwn,
    normalizeStringArray,
    pickArray,
    pickText
} from "./utils.js";
import {
    cacheAvatarImageMeta,
    createDefaultAvatarFrame,
    getDraftAvatarValue,
    hasCustomAvatarImage,
    normalizeAvatarFrame,
    normalizeAvatarImageMeta,
    normalizeAvatarShape
} from "../avatar/avatar-utils.js";
import {
    buildResumeLayoutControlVars,
    normalizeResumeLayoutControlsForLayout
} from "../resume-layout-controls.js";

const REORDERABLE_SECTION_ID_SET = new Set(RESUME_REORDERABLE_SECTION_IDS);
const BASIC_INFO_ICON_OPTION_KEY_SET = new Set(BASIC_INFO_ICON_OPTIONS.map((item) => item.key));
const BASIC_INFO_ICON_SET_KEY_SET = new Set([...BASIC_INFO_ICON_SET_OPTIONS.map((item) => item.key), LEGACY_FOLLOW_LAYOUT_ICON_SET]);
const SECTION_TITLE_ICON_SET_KEY_SET = new Set([...SECTION_TITLE_ICON_SET_OPTIONS.map((item) => item.key), LEGACY_FOLLOW_LAYOUT_ICON_SET]);

function normalizeConfigOption(value, validKeys, fallbackKey) {
    const normalized = pickText(value, fallbackKey).trim().toLowerCase();
    return validKeys.has(normalized) ? normalized : fallbackKey;
}

export function normalizeBasicInfoIconSet(value) {
    return normalizeConfigOption(value, BASIC_INFO_ICON_SET_KEY_SET, BASIC_INFO_ICON_SET_OPTIONS[0].key);
}

export function normalizeSectionTitleIconSet(value) {
    return normalizeConfigOption(value, SECTION_TITLE_ICON_SET_KEY_SET, SECTION_TITLE_ICON_SET_OPTIONS[0].key);
}

export function resolveBasicInfoIconSetSelection(value, resumeLayout) {
    const normalizedSetKey = normalizeBasicInfoIconSet(value);
    if (normalizedSetKey === LEGACY_FOLLOW_LAYOUT_ICON_SET) {
        return getDefaultBasicInfoIconSetForLayout(normalizeResumeLayout(resumeLayout));
    }
    return normalizedSetKey;
}

export function resolveSectionTitleIconSetSelection(value, resumeLayout) {
    const normalizedSetKey = normalizeSectionTitleIconSet(value);
    if (normalizedSetKey === LEGACY_FOLLOW_LAYOUT_ICON_SET) {
        return getDefaultSectionTitleIconSetForLayout(normalizeResumeLayout(resumeLayout));
    }
    return normalizedSetKey;
}

function resolveBasicInfoIconSetFamily(setKey, resumeLayout) {
    return resolveBasicInfoIconSetSelection(setKey, resumeLayout);
}

export function resolveSectionTitleIconSetFamily(setKey, resumeLayout) {
    return resolveSectionTitleIconSetSelection(setKey, resumeLayout);
}

export function normalizeBasicInfoColor(value) {
    const normalized = pickText(value, "theme").trim().toLowerCase();
    return BASIC_INFO_COLORS.some((color) => color.key === normalized) ? normalized : "theme";
}

export function resolveBasicInfoIconSlot(item) {
    const presetKey = pickText(item?.iconPreset, "").trim().toLowerCase();
    if (BASIC_INFO_ICON_OPTION_KEY_SET.has(presetKey)) {
        return presetKey;
    }

    const idKey = pickText(item?.id, "").trim().toLowerCase();
    if (BASIC_INFO_ICON_OPTION_KEY_SET.has(idKey)) {
        return idKey;
    }

    const lookup = [item?.label, item?.value]
        .map((value) => pickText(value, "").trim().toLowerCase())
        .filter(Boolean)
        .join(" ");

    if (lookup.includes("phone") || lookup.includes("手机") || lookup.includes("电话")) return "phone";
    if (lookup.includes("mail") || lookup.includes("email") || lookup.includes("邮箱")) return "email";
    if (lookup.includes("salary") || lookup.includes("薪资") || lookup.includes("薪酬")) return "salary";
    if (lookup.includes("birth") || lookup.includes("生日") || lookup.includes("出生")) return "birth";
    if (lookup.includes("education") || lookup.includes("学历")) return "education";
    if (lookup.includes("location") || lookup.includes("地址") || lookup.includes("城市") || lookup.includes("居住")) return "location";
    if (lookup.includes("website") || lookup.includes("网址") || lookup.includes("网站") || lookup.includes("link") || lookup.includes("http") || lookup.includes("www.")) return "website";
    if (lookup.includes("company") || lookup.includes("公司")) return "company";
    if (lookup.includes("role") || lookup.includes("岗位") || lookup.includes("职位")) return "role";
    if (lookup.includes("calendar") || lookup.includes("时间") || lookup.includes("工龄") || lookup.includes("经验") || lookup.includes("年限")) return "calendar";
    if (lookup.includes("status") || lookup.includes("状态") || lookup.includes("标签")) return "status";
    return "profile";
}

function renderMyResumeSvgIcon(name, className = "") {
    const safeClass = pickText(className, "").trim();
    const iconClass = safeClass ? ` class="${escapeHtml(safeClass)}"` : "";
    const baseAttrs = `viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"${iconClass}`;
    const icons = {
        phone: `<svg ${baseAttrs}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.77.62 2.62a2 2 0 0 1-.45 2.11L8 9.91a16 16 0 0 0 6.09 6.09l1.46-1.28a2 2 0 0 1 2.11-.45c.85.29 1.72.5 2.62.62A2 2 0 0 1 22 16.92Z"/></svg>`,
        mail: `<svg ${baseAttrs}><path d="M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"/><path d="m22 7-10 7L2 7"/></svg>`,
        userCircle: `<svg ${baseAttrs}><circle cx="12" cy="8" r="4"/><path d="M6 20a6 6 0 0 1 12 0"/><circle cx="12" cy="12" r="10"/></svg>`,
        wallet: `<svg ${baseAttrs}><path d="M4 7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v1H6a2 2 0 0 0-2 2V7Z"/><path d="M4 10a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7Z"/><circle cx="16" cy="13.5" r="1"/></svg>`,
        link: `<svg ${baseAttrs}><path d="M10 13a5 5 0 0 0 7.07 0l1.41-1.41a5 5 0 0 0-7.07-7.07L10.6 5.32"/><path d="M14 11a5 5 0 0 0-7.07 0l-1.41 1.41a5 5 0 0 0 7.07 7.07l.79-.79"/></svg>`,
        clock: `<svg ${baseAttrs}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`,
        mapPin: `<svg ${baseAttrs}><path d="M12 21s-6-4.35-6-10a6 6 0 0 1 12 0c0 5.65-6 10-6 10Z"/><circle cx="12" cy="11" r="2.5"/></svg>`,
        user: `<svg ${baseAttrs}><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/></svg>`,
        building: `<svg ${baseAttrs}><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7h.01M15 7h.01M9 11h.01M15 11h.01M9 15h.01M15 15h.01"/><path d="M11 21v-4h2v4"/></svg>`,
        layers: `<svg ${baseAttrs}><path d="m12 3 9 4.5-9 4.5L3 7.5 12 3Z"/><path d="m3 12 9 4.5 9-4.5"/><path d="m3 16.5 9 4.5 9-4.5"/></svg>`,
        briefcase: `<svg ${baseAttrs}><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 12h18"/></svg>`,
        calendar: `<svg ${baseAttrs}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4"/><path d="M8 3v4"/><path d="M3 10h18"/></svg>`,
        award: `<svg ${baseAttrs}><circle cx="12" cy="8" r="4"/><path d="m8.5 12.5-1 8L12 18l4.5 2.5-1-8"/></svg>`,
        zap: `<svg ${baseAttrs}><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/></svg>`,
        graduation: `<svg ${baseAttrs}><path d="m3 8 9-4 9 4-9 4-9-4Z"/><path d="M7 10.5v4.25c0 .48.24.93.65 1.19C8.96 16.79 10.43 17.5 12 17.5s3.04-.71 4.35-1.56c.41-.26.65-.71.65-1.19V10.5"/><path d="M21 9v6"/></svg>`
    };

    return icons[name] || icons.user;
}

function renderMyResume3SvgIcon(name, className = "") {
    const safeClass = pickText(className, "").trim();
    const iconClass = safeClass ? ` class="${escapeHtml(safeClass)}"` : "";
    const icons = {
        clock: `<svg${iconClass} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="1.8"/><path d="M12 7v5l3 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
        cap: `<svg${iconClass} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 10v6M2 10l10-5 10 5-10 5z" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 12v5c3 3 9 3 12 0v-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
        pin: `<svg${iconClass} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="1.8"/></svg>`,
        calendar: `<svg${iconClass} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="4" width="18" height="18" rx="2" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="1.8"/><path d="M8 2v4M16 2v4M3 10h18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
        phone: `<svg${iconClass} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
        mail: `<svg${iconClass} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="4" width="20" height="16" rx="2" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="1.8"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
        github: `<svg${iconClass} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" fill="currentColor" fill-opacity="0.15"/><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3-.3 6-1.5 6-6.5a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 5 3 6.2 6 6.5a4.8 4.8 0 0 0-1 3.2v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 18c-4.51 2-5-2-7-2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
        link: `<svg${iconClass} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 13a5 5 0 0 0 7.07 0l1.41-1.41a5 5 0 0 0-7.07-7.07L10.6 5.32" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 11a5 5 0 0 0-7.07 0l-1.41 1.41a5 5 0 1 0 7.07 7.07l.79-.79" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
        user: `<svg${iconClass} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="7" r="4" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="1.8"/><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
        wallet: `<svg${iconClass} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v1H6a2 2 0 0 0-2 2V7Z" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 10a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7Z" fill="currentColor" fill-opacity="0.08" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="16" cy="13.5" r="1" fill="currentColor"/></svg>`,
        code: `<svg${iconClass} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="18" height="18" rx="2" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="1.8"/><path d="m9 10-3 2.5L9 15M15 10l3 2.5-3 2.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
        briefcase: `<svg${iconClass} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="7" width="20" height="14" rx="2" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="1.8"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
        building: `<svg${iconClass} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="3" width="14" height="18" rx="2" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="1.8"/><path d="M9 7h.01M15 7h.01M9 11h.01M15 11h.01M9 15h.01M15 15h.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M11 21v-4h2v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
        layers: `<svg${iconClass} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="12 2 2 7 12 12 22 7 12 2" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="m2 12 10 5 10-5M2 17l10 5 10-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
        award: `<svg${iconClass} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="8" r="4" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="1.8"/><path d="m8.5 12.5-1 8L12 18l4.5 2.5-1-8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
        book: `<svg${iconClass} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`
    };

    return icons[name] || icons.user;
}

export function renderIconToken(token, className = "") {
    const source = pickText(token, "").trim();
    const safeClass = pickText(className, "").trim();

    if (source.startsWith("my3:")) {
        return renderMyResume3SvgIcon(source.slice(4), safeClass);
    }
    if (source.startsWith("my:")) {
        return renderMyResumeSvgIcon(source.slice(3), safeClass);
    }

    const fontAwesomeClass = (source.startsWith("fa:") ? source.slice(3) : source).trim() || "fas fa-circle";
    const mergedClass = [fontAwesomeClass, safeClass].filter(Boolean).join(" ");
    return `<i class="${escapeHtml(mergedClass)}"></i>`;
}

export function resolveSectionTitleIcon(sectionKey, resumeLayout, setKey = LEGACY_FOLLOW_LAYOUT_ICON_SET) {
    const iconSetFamily = resolveSectionTitleIconSetFamily(setKey, resumeLayout);
    const iconSet = SECTION_TITLE_ICON_SET_MAPS[iconSetFamily] || SECTION_TITLE_ICON_SET_MAPS.classic;
    return iconSet?.[sectionKey] || SECTION_TITLE_ICON_SET_MAPS.classic?.[sectionKey] || "fa:fas fa-circle";
}

export function renderDynamicIcon(iconClass, colorKey, sizeClass, extraClass = "") {
    const color = BASIC_INFO_COLORS.find((item) => item.key === normalizeBasicInfoColor(colorKey)) || BASIC_INFO_COLORS[0];
    const iconHtml = renderIconToken(iconClass, "h-[1em] w-[1em] relative z-10");
    if (color.key === "theme") {
        return `<div class="resume-dynamic-icon relative flex items-center justify-center overflow-hidden text-theme shadow-sm ${sizeClass} ${extraClass}">
                    <div class="absolute inset-0 bg-theme opacity-15"></div>
                    ${iconHtml}
                </div>`;
    }
    return `<div class="resume-dynamic-icon flex items-center justify-center shadow-sm ${color.bg} ${color.text} ${sizeClass} ${extraClass}">
                ${iconHtml}
            </div>`;
}

export function normalizeResumeTheme(value) {
    const normalized = pickText(value, "").trim().toLowerCase();
    return RESUME_THEME_OPTIONS.some((option) => option.key === normalized) ? normalized : RESUME_THEME_OPTIONS[0].key;
}

export function normalizeResumeLayout(value) {
    const normalized = pickText(value, "").trim().toLowerCase();
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

export function normalizeProfessionalSkillsMode(value) {
    const normalized = pickText(value, "").trim().toLowerCase();
    return normalized === PROFESSIONAL_SKILLS_MODE_TEXT ? PROFESSIONAL_SKILLS_MODE_TEXT : PROFESSIONAL_SKILLS_MODE_SKILLS;
}

export function normalizeSectionOrder(value) {
    const source = Array.isArray(value) ? value : RESUME_REORDERABLE_SECTION_IDS;
    const seen = new Set();
    const normalized = [];

    for (const item of source) {
        const sectionId = pickText(item, "").trim().toLowerCase();
        if (!REORDERABLE_SECTION_ID_SET.has(sectionId) || seen.has(sectionId)) {
            continue;
        }
        seen.add(sectionId);
        normalized.push(sectionId);
    }

    for (const sectionId of RESUME_REORDERABLE_SECTION_IDS) {
        if (!seen.has(sectionId)) {
            normalized.push(sectionId);
        }
    }

    return normalized;
}

export function normalizeRenderMode(value) {
    return value === "print" ? "print" : "screen";
}

export function getResumeLayoutClass(value) {
    const normalized = normalizeResumeLayout(value);
    if (normalized === RESUME_LAYOUT_CARDS) {
        return "resume-layout-cards";
    }
    if (normalized === RESUME_LAYOUT_MY_RESUME) {
        return "resume-layout-my-resume";
    }
    if (normalized === RESUME_LAYOUT_MY_RESUME3) {
        return "resume-layout-my-resume3";
    }
    return "resume-layout-classic";
}

export function getResumeLayoutLabel(value) {
    return RESUME_LAYOUT_OPTIONS.find((option) => option.key === normalizeResumeLayout(value))?.label || "经典版";
}

export function getResumeThemeOption(themeKey) {
    return RESUME_THEME_OPTIONS.find((option) => option.key === normalizeResumeTheme(themeKey)) || RESUME_THEME_OPTIONS[0];
}

export function resolveExperienceWorkBadgeEnabled(item, resumeLayout) {
    if (item && hasOwn(item, "workBadgeEnabled")) {
        return Boolean(item.workBadgeEnabled);
    }

    const legacyWorkBadgeLabel = pickText(item?.highlightLabel, "").trim();
    const workBadgeLabel = pickText(item?.workBadgeLabel, legacyWorkBadgeLabel).trim();
    if (workBadgeLabel) {
        return true;
    }

    return isExperienceWorkBadgeEnabledByLayout(normalizeResumeLayout(resumeLayout));
}

export function resolveExperienceWorkBadgeLabel(item, resumeLayout) {
    const legacyWorkBadgeLabel = pickText(item?.highlightLabel, "").trim();
    const workBadgeLabel = pickText(item?.workBadgeLabel, legacyWorkBadgeLabel).trim();

    if (!resolveExperienceWorkBadgeEnabled(item, resumeLayout)) {
        return workBadgeLabel;
    }

    return workBadgeLabel || DEFAULT_EXPERIENCE_WORK_BADGE_LABEL;
}

export function resolveProjectIconBadgeEnabled(project, resumeLayout) {
    if (project && hasOwn(project, "iconBadgeEnabled")) {
        return Boolean(project.iconBadgeEnabled);
    }

    return Boolean(pickText(project?.iconBadgeLabel, "").trim());
}

function hexToRgb(hexColor) {
    const normalized = pickText(hexColor, "").trim().replace(/^#/, "");
    if (![3, 6].includes(normalized.length) || /[^0-9a-f]/i.test(normalized)) {
        return null;
    }
    const fullHex = normalized.length === 3
        ? normalized.split("").map((char) => `${char}${char}`).join("")
        : normalized;
    const value = Number.parseInt(fullHex, 16);
    return {
        r: (value >> 16) & 255,
        g: (value >> 8) & 255,
        b: value & 255
    };
}

function rgbToHex({ r, g, b }) {
    const channelToHex = (channel) => Math.max(0, Math.min(255, Math.round(channel))).toString(16).padStart(2, "0");
    return `#${channelToHex(r)}${channelToHex(g)}${channelToHex(b)}`;
}

function mixHexColors(baseColor, mixColor, weight = 0.5, fallback = baseColor) {
    const baseRgb = hexToRgb(baseColor);
    const mixRgb = hexToRgb(mixColor);
    if (!baseRgb || !mixRgb) {
        return fallback;
    }
    const clampedWeight = Math.max(0, Math.min(1, Number(weight) || 0));
    return rgbToHex({
        r: (baseRgb.r * (1 - clampedWeight)) + (mixRgb.r * clampedWeight),
        g: (baseRgb.g * (1 - clampedWeight)) + (mixRgb.g * clampedWeight),
        b: (baseRgb.b * (1 - clampedWeight)) + (mixRgb.b * clampedWeight)
    });
}

function toRgbaString(hexColor, alpha, fallback = `rgba(37, 99, 235, ${alpha})`) {
    const rgb = hexToRgb(hexColor);
    if (!rgb) {
        return fallback;
    }
    const safeAlpha = Math.max(0, Math.min(1, Number(alpha) || 0));
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${safeAlpha})`;
}

export function buildResumeThemeVars(theme, data = sampleResumeData) {
    const layoutControlVars = buildResumeLayoutControlVars(data);
    const isCardsLayout = normalizeResumeLayout(data?.resumeLayout) === RESUME_LAYOUT_CARDS;
    const leftBackground = theme.leftBg
        ? theme.leftBg
        : `linear-gradient(180deg, ${theme.softBg || "#f8fbff"}40, ${theme.softBg || "#f3f7fe"}80)`;
    const pageCanvas = isCardsLayout
        ? "#f5f5f7"
        : mixHexColors(theme.softBg || "#f3f4f6", "#e5e7eb", 0.52, "#eceef2");
    const pageBorder = isCardsLayout
        ? "#e5e5ea"
        : mixHexColors(pageCanvas, "#cbd5e1", 0.42, "#d8dee7");
    const cardBorder = isCardsLayout
        ? "#ececef"
        : mixHexColors(theme.softBg || "#eef2f7", "#cfd7e3", 0.72, "#dde3ea");
    const cardSubtle = isCardsLayout
        ? "#f5f5f7"
        : mixHexColors(theme.softBg || "#f8fafc", "#ffffff", 0.46, "#f8fafc");
    const mutedText = isCardsLayout
        ? "#86868b"
        : mixHexColors(theme.accentStrong, "#667085", 0.8, "#667085");
    const subtleText = isCardsLayout
        ? "#a1a1aa"
        : mixHexColors(mutedText, "#98a2b3", 0.58, "#98a2b3");
    const pillBg = isCardsLayout
        ? "#eff6ff"
        : mixHexColors(theme.softBg || "#edf2ff", "#ffffff", 0.28, "#f5f7fb");
    const pillText = isCardsLayout
        ? "#0071e3"
        : mixHexColors(theme.accentStrong, "#667085", 0.5, theme.accentStrong);
    const timelineTrack = isCardsLayout
        ? "#f0f0f5"
        : mixHexColors(theme.softBg || "#e5ebf3", "#cbd5e1", 0.54, "#d9e0e8");
    const pageShadow = isCardsLayout
        ? "0 18px 50px rgba(0, 0, 0, 0.04)"
        : `0 32px 72px ${toRgbaString(theme.accentStrong, 0.08, "rgba(15, 23, 42, 0.08)")}, 0 10px 26px rgba(15, 23, 42, 0.06)`;
    const cardShadow = isCardsLayout
        ? "0 4px 24px rgba(0, 0, 0, 0.04)"
        : `0 18px 38px ${toRgbaString(theme.accentStrong, 0.06, "rgba(15, 23, 42, 0.06)")}, 0 4px 14px rgba(15, 23, 42, 0.04)`;
    const dividerColor = isCardsLayout
        ? "#d6dde8"
        : (theme.iconMode === "strict_gray"
            ? "#cbd5e1"
            : `${theme.accent}66`);

    return {
        "--resume-accent": theme.accent,
        "--resume-accent-strong": theme.accentStrong,
        "--resume-accent-border": theme.accentBorder || toRgbaString(theme.accent, 0.28, "rgba(59, 130, 246, 0.28)"),
        "--resume-accent-glow": theme.accentGlow || toRgbaString(theme.accentStrong || theme.accent, 0.16, "rgba(37, 99, 235, 0.16)"),
        "--resume-accent-soft-strong": dividerColor,
        "--resume-accent-soft": theme.softBg || `${theme.accent}15`,
        "--resume-badge-bg": theme.softBg || `${theme.accent}20`,
        "--resume-badge-text": theme.softText || theme.accentStrong,
        "--resume-role-text": theme.accentStrong,
        "--resume-left-bg": leftBackground,
        "--resume-page-canvas": pageCanvas,
        "--resume-page-border": pageBorder,
        "--resume-page-shadow": pageShadow,
        "--resume-card-bg": "#ffffff",
        "--resume-card-border": cardBorder,
        "--resume-card-shadow": cardShadow,
        "--resume-card-subtle": cardSubtle,
        "--resume-text-muted": mutedText,
        "--resume-text-subtle": subtleText,
        "--resume-pill-bg": pillBg,
        "--resume-pill-text": pillText,
        "--resume-timeline-track": timelineTrack,
        "--resume-timeline-dot-glow": toRgbaString(theme.accent, 0.22, "rgba(37, 99, 235, 0.22)"),
        ...layoutControlVars
    };
}

export function buildResumeThemeInlineStyle(theme, data = sampleResumeData) {
    const vars = buildResumeThemeVars(theme, data);
    return Object.entries(vars)
        .map(([key, value]) => `${key}: ${value};`)
        .join(" ");
}

export function resolveIconColorToneForTheme(index, itemColorOverride, globalPaletteKey, themeKey) {
    if (itemColorOverride && itemColorOverride !== "theme") {
        return itemColorOverride;
    }

    const activeGlobalPalette = globalPaletteKey || "theme";
    const currentTheme = getResumeThemeOption(themeKey);

    if (activeGlobalPalette === "theme" && currentTheme.iconMode === "strict_gray") {
        return "slate";
    }

    if (activeGlobalPalette === "theme") {
        return "theme";
    }

    const palette = ICON_PALETTE_OPTIONS.find((item) => item.key === activeGlobalPalette) || ICON_PALETTE_OPTIONS[1];
    if (!palette.colors || !palette.colors.length) {
        return "theme";
    }
    return palette.colors[index % palette.colors.length];
}

export function createBasicInfoPresets() {
    return BASIC_INFO_PRESETS.map((item) => ({
        ...item,
        iconColor: normalizeBasicInfoColor(item.iconColor)
    }));
}

export function getBasicInfoIconOption(presetKey) {
    return BASIC_INFO_ICON_OPTIONS.find((item) => item.key === presetKey) || BASIC_INFO_ICON_OPTIONS[0];
}

export function getBasicInfoIconByPreset(presetKey) {
    const option = getBasicInfoIconOption(presetKey);
    return option ? `fa:${option.icon}` : "fa:fas fa-circle";
}

export function getBasicInfoIconTone(presetKey) {
    const option = getBasicInfoIconOption(presetKey);
    return {
        chipClass: option.chipClass || "bg-slate-100 text-slate-700",
        cardClass: option.cardClass || "border-slate-200 bg-slate-50/90 text-slate-700",
        label: option.label || "图标"
    };
}

export function isValidFontAwesomeClass(className) {
    if (!className || typeof className !== "string") {
        return false;
    }
    const trimmed = className.trim();
    if (!trimmed) {
        return false;
    }

    const styleTokens = new Set([
        "fa-solid", "fa-regular", "fa-light", "fa-thin", "fa-brands",
        "fas", "far", "fal", "fat", "fab", "fad"
    ]);
    const iconPattern = /\bfa-([a-z][a-z0-9]*)\b/i;
    const helperSuffixes = new Set([
        "spin", "pulse", "fade", "bounce", "shake", "beat", "flip",
        "flip-v", "flip-h", "classy", "classy-1", "inverse", "layers",
        "layers-2x", "layers-3x", "stack", "stack-2x", "stack-3x"
    ]);

    const tokens = trimmed.split(/\s+/);
    let hasValidStyle = false;
    let hasValidIcon = false;

    for (const token of tokens) {
        const tokenLower = token.toLowerCase();
        if (styleTokens.has(tokenLower)) {
            hasValidStyle = true;
        } else if (iconPattern.test(token)) {
            const iconName = tokenLower.replace(/^fa-/, "");
            if (!styleTokens.has(`fa-${iconName}`) && !helperSuffixes.has(iconName)) {
                hasValidIcon = true;
            }
        }
    }

    return hasValidStyle && hasValidIcon;
}

export function resolveBasicInfoIcon(item, options = {}) {
    if (pickText(item?.iconMode, "preset") === "custom") {
        const customClass = pickText(item?.customIcon, "").trim();
        if (customClass && isValidFontAwesomeClass(customClass)) {
            return `fa:${customClass}`;
        }
    }

    const iconSlot = resolveBasicInfoIconSlot(item);
    const iconSetFamily = resolveBasicInfoIconSetFamily(options.iconSet, options.resumeLayout);
    const iconSet = BASIC_INFO_ICON_SET_MAPS[iconSetFamily] || BASIC_INFO_ICON_SET_MAPS["font-awesome"];
    return iconSet?.[iconSlot] || getBasicInfoIconByPreset(pickText(item?.iconPreset, ""));
}

export function buildProjectRenderModel(project, resumeLayout) {
    const name = pickText(project?.name, "").trim();
    const iconBadgeEnabled = resolveProjectIconBadgeEnabled(project, resumeLayout);
    const iconBadgeLabel = iconBadgeEnabled ? pickText(project?.iconBadgeLabel, "").trim() : "";
    const badge = pickText(project?.badge, "").trim();
    const badgeStyle = pickText(project?.badgeStyle, "secondary") === "primary" ? "primary" : "secondary";
    const period = pickText(project?.period, "").trim();
    const description = pickText(project?.description, "").trim();
    const highlights = normalizeStringArray(project?.highlights);
    const techs = normalizeStringArray(project?.techs);

    return {
        name,
        iconBadgeEnabled,
        iconBadgeLabel,
        badge,
        badgeStyle,
        period,
        description,
        highlights,
        techs,
        hasRenderableContent: Boolean(name || iconBadgeLabel || badge || period || description || highlights.length || techs.length)
    };
}

export function getRenderableProjects(projects, resumeLayout) {
    return pickArray(projects)
        .map((project) => buildProjectRenderModel(project, resumeLayout))
        .filter((project) => project.hasRenderableContent);
}

const VALID_BASIC_INFO_IDS = new Set(BASIC_INFO_PRESETS.map((preset) => preset.id));

export function normalizeBasicInfoList(sourceValue) {
    const source = pickArray(sourceValue);
    const validItems = source.filter((item) => VALID_BASIC_INFO_IDS.has(item?.id));
    const seenIds = new Set();
    const deduplicated = [];

    for (const item of validItems) {
        if (!seenIds.has(item.id)) {
            seenIds.add(item.id);
            deduplicated.push(item);
        }
    }

    const normalized = deduplicated.map((item) => {
        const preset = BASIC_INFO_PRESETS.find((candidate) => candidate.id === item.id) || BASIC_INFO_PRESETS[0];
        const iconMode = pickText(item?.iconMode, preset.iconMode) === "custom" ? "custom" : "preset";

        return {
            id: pickText(item?.id, preset.id),
            label: pickText(item?.label, preset.label),
            value: pickText(item?.value, preset.value),
            iconPreset: pickText(item?.iconPreset, preset.iconPreset) || preset.iconPreset,
            iconMode,
            customIcon: pickText(item?.customIcon, preset.customIcon),
            iconColor: normalizeBasicInfoColor(item?.iconColor)
        };
    });

    if (!normalized.length) {
        return createBasicInfoPresets();
    }

    const existingIds = new Set(normalized.map((item) => item.id));
    for (const preset of BASIC_INFO_PRESETS) {
        if (!existingIds.has(preset.id)) {
            normalized.push({ ...preset });
        }
    }

    return normalized.slice(0, 5);
}

export function normalizeResumeData(rawData) {
    const raw = rawData && typeof rawData === "object" ? rawData : {};
    const fallback = sampleResumeData;
    const resumeLayout = hasOwn(raw, "resumeLayout") ? normalizeResumeLayout(raw.resumeLayout) : normalizeResumeLayout(fallback.resumeLayout);
    const layoutControls = normalizeResumeLayoutControlsForLayout(raw, resumeLayout);
    const basicInfoSource = hasOwn(raw, "basicInfo") ? raw.basicInfo : fallback.basicInfo;
    const educationSource = hasOwn(raw, "education") ? raw.education : fallback.education;
    const skillsSource = hasOwn(raw, "skills") ? raw.skills : fallback.skills;
    const experiencesSource = hasOwn(raw, "experiences") ? raw.experiences : fallback.experiences;
    const projectsSource = hasOwn(raw, "projects") ? raw.projects : fallback.projects;
    const avatarImageMeta = hasOwn(raw, "avatarImageMeta") ? normalizeAvatarImageMeta(raw.avatarImageMeta) : normalizeAvatarImageMeta(fallback.avatarImageMeta);
    const profileImage = hasOwn(raw, "profileImage") ? pickText(raw.profileImage, "") : fallback.profileImage;
    const hasProfileImage = hasCustomAvatarImage(profileImage);
    const normalizedAvatarImageMeta = hasProfileImage ? avatarImageMeta : null;

    if (hasProfileImage && normalizedAvatarImageMeta) {
        cacheAvatarImageMeta(profileImage, normalizedAvatarImageMeta);
    }

    return {
        documentTitle: hasOwn(raw, "documentTitle") ? pickText(raw.documentTitle, "") : fallback.documentTitle,
        resumeLayout,
        resumeTheme: hasOwn(raw, "resumeTheme") ? normalizeResumeTheme(raw.resumeTheme) : normalizeResumeTheme(fallback.resumeTheme),
        basicInfoIconSet: hasOwn(raw, "basicInfoIconSet")
            ? resolveBasicInfoIconSetSelection(raw.basicInfoIconSet, resumeLayout)
            : getDefaultBasicInfoIconSetForLayout(resumeLayout),
        sectionTitleIconSet: hasOwn(raw, "sectionTitleIconSet")
            ? resolveSectionTitleIconSetSelection(raw.sectionTitleIconSet, resumeLayout)
            : getDefaultSectionTitleIconSetForLayout(resumeLayout),
        ...layoutControls,
        showExperienceTimeline: hasOwn(raw, "showExperienceTimeline") ? Boolean(raw.showExperienceTimeline) : Boolean(fallback.showExperienceTimeline),
        useThemeTimeline: hasOwn(raw, "useThemeTimeline") ? Boolean(raw.useThemeTimeline) : Boolean(fallback.useThemeTimeline),
        useFlatIcons: hasOwn(raw, "useFlatIcons") ? Boolean(raw.useFlatIcons) : true,
        iconPalette: hasOwn(raw, "iconPalette") ? pickText(raw.iconPalette, "macaron") : "macaron",
        skillBadgeColor: hasOwn(raw, "skillBadgeColor") ? pickText(raw.skillBadgeColor, "theme") : "theme",
        professionalSkillsMode: hasOwn(raw, "professionalSkillsMode")
            ? normalizeProfessionalSkillsMode(raw.professionalSkillsMode)
            : normalizeProfessionalSkillsMode(fallback.professionalSkillsMode),
        sectionOrder: hasOwn(raw, "sectionOrder")
            ? normalizeSectionOrder(raw.sectionOrder)
            : normalizeSectionOrder(fallback.sectionOrder),
        profileImage: hasProfileImage ? profileImage : "",
        avatarImageMeta: normalizedAvatarImageMeta,
        avatarFrame: hasProfileImage
            ? (hasOwn(raw, "avatarFrame") ? normalizeAvatarFrame(raw.avatarFrame, normalizedAvatarImageMeta) : createDefaultAvatarFrame())
            : createDefaultAvatarFrame(),
        avatarShape: hasOwn(raw, "avatarShape") ? normalizeAvatarShape(raw.avatarShape) : normalizeAvatarShape(fallback.avatarShape),
        name: hasOwn(raw, "name") ? pickText(raw.name, "") : fallback.name,
        role: hasOwn(raw, "role") ? pickText(raw.role, "") : fallback.role,
        summary: hasOwn(raw, "summary") ? pickText(raw.summary, "") : fallback.summary,
        professionalSkillsText: hasOwn(raw, "professionalSkillsText") ? pickText(raw.professionalSkillsText, "") : "",
        basicInfo: normalizeBasicInfoList(basicInfoSource),
        education: pickArray(educationSource).map((item) => ({
            degree: pickText(item?.degree, ""),
            school: pickText(item?.school, ""),
            period: pickText(item?.period, "")
        })),
        skills: pickArray(skillsSource).map((item) => ({
            name: pickText(item?.name, ""),
            items: normalizeStringArray(item?.items)
        })),
        experiences: pickArray(experiencesSource).map((item) => {
            const highlight = Boolean(item?.highlight);
            const legacyWorkBadgeLabel = pickText(item?.highlightLabel, "").trim();
            const workBadgeLabel = pickText(item?.workBadgeLabel, legacyWorkBadgeLabel).trim();
            const experienceData = {
                title: pickText(item?.title, ""),
                company: pickText(item?.company, ""),
                period: pickText(item?.period, ""),
                highlight,
                workBadgeLabel,
                bullets: normalizeStringArray(item?.bullets)
            };

            if (item && hasOwn(item, "workBadgeEnabled")) {
                experienceData.workBadgeEnabled = Boolean(item.workBadgeEnabled);
            }

            return experienceData;
        }),
        projects: pickArray(projectsSource).map((item) => {
            const projectData = {
                name: pickText(item?.name, ""),
                iconBadgeLabel: pickText(item?.iconBadgeLabel, ""),
                badge: pickText(item?.badge, ""),
                badgeStyle: pickText(item?.badgeStyle, "secondary") === "primary" ? "primary" : "secondary",
                period: pickText(item?.period, ""),
                description: pickText(item?.description, ""),
                highlights: normalizeStringArray(item?.highlights),
                techs: normalizeStringArray(item?.techs)
            };

            if (item && hasOwn(item, "iconBadgeEnabled")) {
                projectData.iconBadgeEnabled = Boolean(item.iconBadgeEnabled);
            }

            return projectData;
        })
    };
}

export { arrayToLines };
