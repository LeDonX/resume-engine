import {
    BASIC_INFO_COLORS,
    BASIC_INFO_ICON_OPTIONS,
    BASIC_INFO_PRESETS,
    DEFAULT_EXPERIENCE_WORK_BADGE_LABEL,
    ICON_PALETTE_OPTIONS,
    PROFESSIONAL_SKILLS_MODE_SKILLS,
    PROFESSIONAL_SKILLS_MODE_TEXT,
    RESUME_REORDERABLE_SECTION_IDS,
    RESUME_LAYOUT_CARDS,
    RESUME_LAYOUT_CLASSIC,
    RESUME_LAYOUT_MY_RESUME,
    RESUME_LAYOUT_MY_RESUME3,
    RESUME_LAYOUT_OPTIONS,
    RESUME_THEME_OPTIONS,
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

export function normalizeBasicInfoColor(value) {
    const normalized = pickText(value, "theme").trim().toLowerCase();
    return BASIC_INFO_COLORS.some((color) => color.key === normalized) ? normalized : "theme";
}

export function renderDynamicIcon(iconClass, colorKey, sizeClass, extraClass = "") {
    const color = BASIC_INFO_COLORS.find((item) => item.key === normalizeBasicInfoColor(colorKey)) || BASIC_INFO_COLORS[0];
    if (color.key === "theme") {
        return `<div class="resume-dynamic-icon relative flex items-center justify-center overflow-hidden text-theme shadow-sm ${sizeClass} ${extraClass}">
                    <div class="absolute inset-0 bg-theme opacity-15"></div>
                    <i class="${escapeHtml(iconClass)} relative z-10"></i>
                </div>`;
    }
    return `<div class="resume-dynamic-icon flex items-center justify-center shadow-sm ${color.bg} ${color.text} ${sizeClass} ${extraClass}">
                <i class="${escapeHtml(iconClass)}"></i>
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
    return option ? option.icon : "fas fa-circle";
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

export function resolveBasicInfoIcon(item) {
    if (pickText(item?.iconMode, "preset") === "custom") {
        const customClass = pickText(item?.customIcon, "").trim();
        if (customClass && isValidFontAwesomeClass(customClass)) {
            return customClass;
        }
    }
    return getBasicInfoIconByPreset(pickText(item?.iconPreset, ""));
}

export function buildProjectRenderModel(project) {
    const name = pickText(project?.name, "").trim();
    const badge = pickText(project?.badge, "").trim();
    const badgeStyle = pickText(project?.badgeStyle, "secondary") === "primary" ? "primary" : "secondary";
    const period = pickText(project?.period, "").trim();
    const description = pickText(project?.description, "").trim();
    const highlights = normalizeStringArray(project?.highlights);
    const techs = normalizeStringArray(project?.techs);

    return {
        name,
        badge,
        badgeStyle,
        period,
        description,
        highlights,
        techs,
        hasRenderableContent: Boolean(name || badge || period || description || highlights.length || techs.length)
    };
}

export function getRenderableProjects(projects) {
    return pickArray(projects)
        .map((project) => buildProjectRenderModel(project))
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
            const workBadgeEnabled = item && hasOwn(item, "workBadgeEnabled")
                ? Boolean(item.workBadgeEnabled)
                : Boolean(legacyWorkBadgeLabel);
            return {
                title: pickText(item?.title, ""),
                company: pickText(item?.company, ""),
                period: pickText(item?.period, ""),
                highlight,
                workBadgeEnabled,
                workBadgeLabel: workBadgeEnabled ? (workBadgeLabel || DEFAULT_EXPERIENCE_WORK_BADGE_LABEL) : workBadgeLabel,
                bullets: normalizeStringArray(item?.bullets)
            };
        }),
        projects: pickArray(projectsSource).map((item) => {
            const { hasRenderableContent, ...projectData } = buildProjectRenderModel(item);
            return projectData;
        })
    };
}

export { arrayToLines };
