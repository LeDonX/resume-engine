import {
    RESUME_LAYOUT_CLASSIC,
    isExperienceWorkBadgeEnabledByLayout
} from "./config.js";

export function createEducation() {
    return { degree: "", school: "", period: "" };
}

export function createSkillGroup() {
    return { name: "", items: [] };
}

export function createExperience(resumeLayout = RESUME_LAYOUT_CLASSIC) {
    return { title: "", company: "", period: "", highlight: false, workBadgeEnabled: isExperienceWorkBadgeEnabledByLayout(resumeLayout), workBadgeLabel: "", bullets: [] };
}

export function createProject() {
    return {
        name: "",
        iconBadgeEnabled: false,
        iconBadgeLabel: "",
        badge: "",
        badgeStyle: "secondary",
        period: "",
        description: "",
        highlights: [],
        techs: []
    };
}

export function cloneData(data) {
    return JSON.parse(JSON.stringify(data));
}

export function hasOwn(objectValue, key) {
    return Object.hasOwn(objectValue, key);
}

export function pickText(value, fallback = "") {
    if (typeof value !== "string") {
        return fallback;
    }
    return value;
}

export function pickArray(value) {
    return Array.isArray(value) ? value : [];
}

export function linesToArray(value) {
    return String(value ?? "")
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean);
}

export function normalizeStringArray(value) {
    if (Array.isArray(value)) {
        return value.map((item) => pickText(item, "").trim()).filter(Boolean);
    }
    if (typeof value === "string") {
        return linesToArray(value);
    }
    return [];
}

export function arrayToLines(value) {
    return normalizeStringArray(value).join("\n");
}

const escapeMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
};

export function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => escapeMap[char]);
}

export function clampNumber(value, min, max, fallback) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        return fallback;
    }
    return Math.min(max, Math.max(min, parsed));
}
