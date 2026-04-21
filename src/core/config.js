export const STORAGE_KEY = "resume-generator-draft-v1";
export const DRAFT_STORAGE_VERSION = 2;
export const DRAFT_AVATAR_SENTINEL = "__resume-avatar-sidecar__";
export const AVATAR_SIDECAR_DB_NAME = `${STORAGE_KEY}-sidecar`;
export const AVATAR_SIDECAR_STORE_NAME = "draft-assets";
export const AVATAR_SIDECAR_RECORD_KEY = `${STORAGE_KEY}:profile-image`;
export const RENDER_MODE_SCREEN = "screen";
export const RENDER_MODE_PRINT = "print";
export const RESUME_LAYOUT_CLASSIC = "classic";
export const RESUME_LAYOUT_CARDS = "cards";
export const RESUME_LAYOUT_MY_RESUME = "my-resume";
export const RESUME_LAYOUT_MY_RESUME3 = "my-resume3";
export const PROFESSIONAL_SKILLS_MODE_SKILLS = "skills";
export const PROFESSIONAL_SKILLS_MODE_TEXT = "text";

export const RESUME_LAYOUT_OPTIONS = [
    { key: RESUME_LAYOUT_CLASSIC, label: "经典版", description: "原始简历排版" },
    { key: RESUME_LAYOUT_CARDS, label: "卡片版", description: "双栏卡片排版" },
    { key: RESUME_LAYOUT_MY_RESUME, label: "模板 1", description: "单栏 my-resume 排版" },
    { key: RESUME_LAYOUT_MY_RESUME3, label: "模板 2", description: "单栏 my-resume3 排版" }
];

export function isExperienceWorkBadgeEnabledByLayout(layout) {
    return layout === RESUME_LAYOUT_MY_RESUME || layout === RESUME_LAYOUT_MY_RESUME3;
}

export const PROFESSIONAL_SKILLS_MODE_OPTIONS = [
    { key: PROFESSIONAL_SKILLS_MODE_SKILLS, label: "标签分组", description: "使用 skills 分组标签展示" },
    { key: PROFESSIONAL_SKILLS_MODE_TEXT, label: "文本摘要", description: "使用 professionalSkillsText 文本展示" }
];

export const FALLBACK_AVATAR = "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20viewBox%3D%270%200%20120%20120%27%3E%3Crect%20width%3D%27120%27%20height%3D%27120%27%20fill%3D%27%23e5e7eb%27/%3E%3Ccircle%20cx%3D%2760%27%20cy%3D%2745%27%20r%3D%2722%27%20fill%3D%27%239ca3af%27/%3E%3Crect%20x%3D%2726%27%20y%3D%2778%27%20width%3D%2768%27%20height%3D%2736%27%20rx%3D%2718%27%20fill%3D%27%239ca3af%27/%3E%3C/svg%3E";
export const PAGE_BREAK_BUFFER_PX = 8;
export const PRINT_RESTORE_DELAY_MS = 400;
export const MAX_AVATAR_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_AVATAR_DRAFT_DATA_URL_LENGTH = 1500000;
export const MAX_AVATAR_STORAGE_EDGE = 1600;
export const AVATAR_STORAGE_QUALITIES = [0.92, 0.86, 0.8, 0.72, 0.64, 0.56];
export const ALLOWED_AVATAR_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
export const ALLOWED_AVATAR_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"];
export const DEFAULT_AVATAR_FRAME = Object.freeze({ zoom: 1, offsetX: 0, offsetY: 0 });
export const DEFAULT_AVATAR_IMAGE_META = Object.freeze({ width: 0, height: 0 });
export const AVATAR_OFFSET_LIMIT = 40;
export const AVATAR_CROP_FRAME_RATIO = 0.8;
export const AVATAR_CROP_MASK_INSET = `${(((1 - AVATAR_CROP_FRAME_RATIO) / 2) * 100).toFixed(1)}%`;
export const AVATAR_SHAPE_CIRCLE = "circle";
export const AVATAR_SHAPE_RECTANGLE = "rectangle";

export const BASIC_INFO_ICON_OPTIONS = [
    { key: "phone", label: "手机", icon: "fas fa-phone", chipClass: "bg-sky-100 text-sky-700", cardClass: "border-sky-200 bg-sky-50/80 text-sky-700" },
    { key: "email", label: "邮箱", icon: "fas fa-envelope", chipClass: "bg-indigo-100 text-indigo-700", cardClass: "border-indigo-200 bg-indigo-50/80 text-indigo-700" },
    { key: "salary", label: "薪资", icon: "fas fa-money-bill-wave", chipClass: "bg-emerald-100 text-emerald-700", cardClass: "border-emerald-200 bg-emerald-50/80 text-emerald-700" },
    { key: "birth", label: "出生", icon: "fas fa-cake-candles", chipClass: "bg-rose-100 text-rose-700", cardClass: "border-rose-200 bg-rose-50/80 text-rose-700" },
    { key: "education", label: "学历", icon: "fas fa-user-graduate", chipClass: "bg-violet-100 text-violet-700", cardClass: "border-violet-200 bg-violet-50/80 text-violet-700" },
    { key: "location", label: "城市", icon: "fas fa-location-dot", chipClass: "bg-amber-100 text-amber-700", cardClass: "border-amber-200 bg-amber-50/80 text-amber-700" },
    { key: "website", label: "网站", icon: "fas fa-link", chipClass: "bg-cyan-100 text-cyan-700", cardClass: "border-cyan-200 bg-cyan-50/80 text-cyan-700" },
    { key: "profile", label: "身份", icon: "fas fa-id-card", chipClass: "bg-slate-200 text-slate-700", cardClass: "border-slate-200 bg-slate-50/90 text-slate-700" },
    { key: "role", label: "岗位", icon: "fas fa-briefcase", chipClass: "bg-fuchsia-100 text-fuchsia-700", cardClass: "border-fuchsia-200 bg-fuchsia-50/80 text-fuchsia-700" },
    { key: "company", label: "公司", icon: "fas fa-building", chipClass: "bg-blue-100 text-blue-700", cardClass: "border-blue-200 bg-blue-50/80 text-blue-700" },
    { key: "calendar", label: "时间", icon: "fas fa-calendar-check", chipClass: "bg-teal-100 text-teal-700", cardClass: "border-teal-200 bg-teal-50/80 text-teal-700" },
    { key: "status", label: "标签", icon: "fas fa-certificate", chipClass: "bg-orange-100 text-orange-700", cardClass: "border-orange-200 bg-orange-50/80 text-orange-700" }
];

export const BASIC_INFO_PRESETS = [
    { id: "phone", label: "手机", value: "138-xxxx-xxxx", iconPreset: "phone", iconMode: "preset", customIcon: "" },
    { id: "email", label: "邮箱", value: "zhangsan@qq.com", iconPreset: "email", iconMode: "preset", customIcon: "" },
    { id: "salary", label: "期望薪资", value: "25K-35K", iconPreset: "salary", iconMode: "preset", customIcon: "" },
    { id: "birth", label: "出生年月", value: "1998.08", iconPreset: "birth", iconMode: "preset", customIcon: "" },
    { id: "education", label: "学历", value: "硕士", iconPreset: "education", iconMode: "preset", customIcon: "" }
];

export const BASIC_INFO_ICON_SET_OPTIONS = [
    { key: "font-awesome", label: "Font Awesome", description: "四个模板都使用当前 Font Awesome 实心图标" },
    { key: "my-resume", label: "模板 1 线性", description: "四个模板都使用模板 1 的线性 SVG 图标" },
    { key: "my-resume3", label: "模板 2 几何", description: "四个模板都使用模板 2 的几何 SVG 图标" }
];

export const SECTION_TITLE_ICON_SET_OPTIONS = [
    { key: "classic", label: "经典标题组", description: "使用经典版当前的标题图标组合" },
    { key: "cards", label: "卡片标题组", description: "使用卡片版当前的标题图标组合" },
    { key: "my-resume", label: "模板 1 标题组", description: "使用模板 1 的线性标题图标" },
    { key: "my-resume3", label: "模板 2 标题组", description: "使用模板 2 的几何标题图标" }
];

export const LEGACY_FOLLOW_LAYOUT_ICON_SET = "follow-layout";

export function getDefaultBasicInfoIconSetForLayout(layout) {
    if (layout === RESUME_LAYOUT_MY_RESUME) {
        return RESUME_LAYOUT_MY_RESUME;
    }
    if (layout === RESUME_LAYOUT_MY_RESUME3) {
        return RESUME_LAYOUT_MY_RESUME3;
    }
    return "font-awesome";
}

export function getDefaultSectionTitleIconSetForLayout(layout) {
    if (layout === RESUME_LAYOUT_CARDS) {
        return RESUME_LAYOUT_CARDS;
    }
    if (layout === RESUME_LAYOUT_MY_RESUME) {
        return RESUME_LAYOUT_MY_RESUME;
    }
    if (layout === RESUME_LAYOUT_MY_RESUME3) {
        return RESUME_LAYOUT_MY_RESUME3;
    }
    return RESUME_LAYOUT_CLASSIC;
}

const fontAwesomeBasicInfoIconMap = BASIC_INFO_ICON_OPTIONS.reduce((result, option) => {
    result[option.key] = `fa:${option.icon}`;
    return result;
}, {});

export const BASIC_INFO_ICON_SET_MAPS = {
    "font-awesome": fontAwesomeBasicInfoIconMap,
    "my-resume": {
        phone: "my:phone",
        email: "my:mail",
        salary: "my:wallet",
        birth: "my:calendar",
        education: "my:graduation",
        location: "my:mapPin",
        website: "my:link",
        profile: "my:userCircle",
        role: "my:briefcase",
        company: "my:building",
        calendar: "my:clock",
        status: "my:award"
    },
    "my-resume3": {
        phone: "my3:phone",
        email: "my3:mail",
        salary: "my3:wallet",
        birth: "my3:calendar",
        education: "my3:cap",
        location: "my3:pin",
        website: "my3:link",
        profile: "my3:user",
        role: "my3:briefcase",
        company: "my3:building",
        calendar: "my3:clock",
        status: "my3:award"
    }
};

export const SECTION_TITLE_ICON_SET_MAPS = {
    classic: {
        contact: "fa:fas fa-envelope",
        basicInfo: "fa:fas fa-envelope",
        summary: "fa:fas fa-user-tie",
        skills: "fa:fas fa-wand-magic-sparkles",
        experiences: "fa:fas fa-briefcase",
        projects: "fa:fas fa-project-diagram",
        education: "fa:fas fa-user-graduate"
    },
    cards: {
        contact: "fa:fas fa-envelope",
        basicInfo: "fa:fas fa-envelope",
        summary: "fa:fas fa-user",
        skills: "fa:fas fa-wand-magic-sparkles",
        experiences: "fa:fas fa-briefcase",
        projects: "fa:fas fa-code",
        education: "fa:fas fa-user-graduate"
    },
    "my-resume": {
        contact: "my:mail",
        basicInfo: "my:mail",
        summary: "my:user",
        skills: "my:layers",
        experiences: "my:briefcase",
        projects: "my:zap",
        education: "my:graduation"
    },
    "my-resume3": {
        contact: "my3:mail",
        basicInfo: "my3:mail",
        summary: "my3:user",
        skills: "my3:code",
        experiences: "my3:briefcase",
        projects: "my3:layers",
        education: "my3:book"
    }
};

export const BASIC_INFO_COLORS = [
    { key: "theme", label: "跟随主题" },
    { key: "slate", label: "石板灰", bg: "bg-slate-100", text: "text-slate-700" },
    { key: "stone", label: "大地灰", bg: "bg-stone-100", text: "text-stone-700" },
    { key: "zinc", label: "锌灰", bg: "bg-zinc-100", text: "text-zinc-700" },
    { key: "red", label: "正红", bg: "bg-red-100", text: "text-red-700" },
    { key: "rose", label: "玫瑰红", bg: "bg-rose-100", text: "text-rose-700" },
    { key: "pink", label: "芭比粉", bg: "bg-pink-100", text: "text-pink-700" },
    { key: "orange", label: "活力橙", bg: "bg-orange-100", text: "text-orange-700" },
    { key: "amber", label: "琥珀黄", bg: "bg-amber-100", text: "text-amber-700" },
    { key: "yellow", label: "柠檬黄", bg: "bg-yellow-100", text: "text-yellow-700" },
    { key: "lime", label: "青柠绿", bg: "bg-lime-100", text: "text-lime-700" },
    { key: "emerald", label: "翡翠绿", bg: "bg-emerald-100", text: "text-emerald-700" },
    { key: "teal", label: "水鸭青", bg: "bg-teal-100", text: "text-teal-700" },
    { key: "cyan", label: "明亮青", bg: "bg-cyan-100", text: "text-cyan-700" },
    { key: "sky", label: "天空蓝", bg: "bg-sky-100", text: "text-sky-700" },
    { key: "blue", label: "经典蓝", bg: "bg-blue-100", text: "text-blue-700" },
    { key: "indigo", label: "靛青蓝", bg: "bg-indigo-100", text: "text-indigo-700" },
    { key: "violet", label: "罗兰紫", bg: "bg-violet-100", text: "text-violet-700" },
    { key: "fuchsia", label: "紫红色", bg: "bg-fuchsia-100", text: "text-fuchsia-700" }
];

export const RESUME_THEME_OPTIONS = [
    { key: "pro_blue", label: "严谨商务蓝", type: "solid", swatch: "#2563eb", accent: "#2563eb", accentStrong: "#1d4ed8", softBg: "#eff6ff", softText: "#1d4ed8", leftBg: "#f4f5f8", iconMode: "strict_gray" },
    { key: "pro_slate", label: "严谨极简黑", type: "solid", swatch: "#334155", accent: "#475569", accentStrong: "#0f172a", softBg: "#f1f5f9", softText: "#0f172a", leftBg: "#f4f5f8", iconMode: "strict_gray" },
    { key: "cobalt", label: "深海蓝", type: "solid", swatch: "#2563eb", accent: "#2563eb", accentStrong: "#1d4ed8", softBg: "#dbeafe", softText: "#1d4ed8" },
    { key: "indigo", label: "靛青蓝", type: "solid", swatch: "#4f46e5", accent: "#4f46e5", accentStrong: "#3730a3", softBg: "#e0e7ff", softText: "#3730a3" },
    { key: "emerald", label: "翡翠绿", type: "solid", swatch: "#059669", accent: "#059669", accentStrong: "#047857", softBg: "#d1fae5", softText: "#047857" },
    { key: "teal", label: "水鸭青", type: "solid", swatch: "#0d9488", accent: "#0d9488", accentStrong: "#0f766e", softBg: "#ccfbf1", softText: "#0f766e" },
    { key: "violet", label: "暮光紫", type: "solid", swatch: "#7c3aed", accent: "#7c3aed", accentStrong: "#6d28d9", softBg: "#ede9fe", softText: "#6d28d9" },
    { key: "fuchsia", label: "洋红紫", type: "solid", swatch: "#c026d3", accent: "#c026d3", accentStrong: "#a21caf", softBg: "#fae8ff", softText: "#a21caf" },
    { key: "rose", label: "玫瑰粉", type: "solid", swatch: "#e11d48", accent: "#e11d48", accentStrong: "#be123c", softBg: "#ffe4e6", softText: "#be123c" },
    { key: "amber", label: "琥珀棕", type: "solid", swatch: "#d97706", accent: "#d97706", accentStrong: "#b45309", softBg: "#fef3c7", softText: "#b45309" },
    { key: "orange", label: "活力橙", type: "solid", swatch: "#ea580c", accent: "#ea580c", accentStrong: "#c2410c", softBg: "#ffedd5", softText: "#c2410c" },
    { key: "slate", label: "极简灰", type: "solid", swatch: "#475569", accent: "#475569", accentStrong: "#334155", softBg: "#f1f5f9", softText: "#334155" },
    { key: "stone", label: "大地灰", type: "solid", swatch: "#57534e", accent: "#57534e", accentStrong: "#44403c", softBg: "#f5f5f4", softText: "#44403c" },
    { key: "noir", label: "纯粹黑", type: "solid", swatch: "#171717", accent: "#171717", accentStrong: "#000000", softBg: "#e5e5e5", softText: "#000000" },
    { key: "ocean", label: "珊瑚海", type: "gradient", swatch: "linear-gradient(135deg, #0284c7, #14b8a6)", accent: "#0284c7", accentStrong: "#0f766e", softBg: "#e0f2fe", softText: "#0369a1" },
    { key: "sunset", label: "日落橘", type: "gradient", swatch: "linear-gradient(135deg, #ea580c, #e11d48)", accent: "#ea580c", accentStrong: "#be123c", softBg: "#ffe4e6", softText: "#e11d48" },
    { key: "cyber", label: "赛博紫", type: "gradient", swatch: "linear-gradient(135deg, #8b5cf6, #ec4899)", accent: "#8b5cf6", accentStrong: "#be185d", softBg: "#fce7f3", softText: "#db2777" },
    { key: "berry", label: "青柠蓝", type: "gradient", swatch: "linear-gradient(135deg, #4f46e5, #10b981)", accent: "#4f46e5", accentStrong: "#047857", softBg: "#d1fae5", softText: "#059669" },
    { key: "peach", label: "蜜桃粉", type: "gradient", swatch: "linear-gradient(135deg, #f43f5e, #f59e0b)", accent: "#f43f5e", accentStrong: "#e11d48", softBg: "#fff1f2", softText: "#be123c" },
    { key: "lavender", label: "薰衣草", type: "gradient", swatch: "linear-gradient(135deg, #a855f7, #6366f1)", accent: "#a855f7", accentStrong: "#4f46e5", softBg: "#f3e8ff", softText: "#6d28d9" },
    { key: "mint", label: "薄荷冰", type: "gradient", swatch: "linear-gradient(135deg, #14b8a6, #3b82f6)", accent: "#14b8a6", accentStrong: "#1d4ed8", softBg: "#ccfbf1", softText: "#0f766e" },
    { key: "midnight", label: "极光黑", type: "gradient", swatch: "linear-gradient(135deg, #0f172a, #3730a3)", accent: "#334155", accentStrong: "#0f172a", softBg: "#f1f5f9", softText: "#1e293b" }
];

export const ICON_PALETTE_OPTIONS = [
    { key: "theme", label: "统一主色", colors: [], preview: ["#94a3b8"] },
    { key: "classic", label: "经典原味", colors: ["sky", "indigo", "emerald", "rose", "violet", "amber"], preview: ["#0ea5e9", "#10b981", "#6366f1"] },
    { key: "macaron", label: "马卡龙", colors: ["pink", "cyan", "yellow", "lime", "violet", "sky"], preview: ["#f472b6", "#22d3ee", "#facc15"] },
    { key: "morandi", label: "莫兰迪", colors: ["slate", "stone", "teal", "rose", "indigo", "zinc"], preview: ["#64748b", "#78716c", "#14b8a6"] },
    { key: "neon", label: "赛博霓虹", colors: ["fuchsia", "cyan", "lime", "violet", "rose"], preview: ["#d946ef", "#06b6d4", "#84cc16"] },
    { key: "ocean", label: "海蓝之吻", colors: ["blue", "sky", "cyan", "teal", "indigo"], preview: ["#3b82f6", "#0ea5e9", "#06b6d4"] },
    { key: "forest", label: "森林大地", colors: ["emerald", "lime", "teal", "stone", "amber"], preview: ["#10b981", "#84cc16", "#78716c"] },
    { key: "sunset", label: "黄昏暖阳", colors: ["orange", "rose", "red", "amber", "fuchsia"], preview: ["#f97316", "#f43f5e", "#f59e0b"] }
];

export const RESUME_LAYOUT_CONTROL_FIELDS = [
    { key: "fontScale", label: "正文", hint: "控制正文与阅读类文本" },
    { key: "basicInfoScale", label: "基本信息文字大小", hint: "仅控制顶部基本信息文字" },
    { key: "titleScale", label: "模块标题", hint: "控制模块与分区标题" },
    { key: "nameScale", label: "姓名", hint: "控制顶部姓名展示" },
    { key: "roleScale", label: "目标岗位", hint: "控制顶部目标岗位展示" },
    { key: "basicInfoIconScale", label: "基本信息图标", hint: "仅控制顶部基本信息图标" },
    { key: "skillGroupNameScale", label: "技能组名称", hint: "控制技能分组标题" },
    { key: "skillTagScale", label: "技能标签", hint: "控制技能标签与技能项" },
    { key: "workProjectMetaScale", label: "工作/项目元信息", hint: "控制工作与项目标题、标签、时间" }
];

export const RESUME_LAYOUT_SPACING_CONTROL_FIELDS = [
    { key: "moduleMarginYScale", label: "模块外边距（纵向）", hint: "控制模块与分组包装器的纵向间距" },
    { key: "moduleMarginXScale", label: "模块外边距（横向）", hint: "控制模块列与横向模块边界间距" },
    { key: "modulePaddingYScale", label: "模块内边距（纵向）", hint: "控制卡片与内容容器的纵向留白" },
    { key: "modulePaddingXScale", label: "模块内边距（横向）", hint: "控制卡片与内容容器的横向留白" },
    { key: "pagePaddingYScale", label: "页面边距（纵向）", hint: "控制页面上下留白" },
    { key: "pagePaddingXScale", label: "页面边距（横向）", hint: "控制页面左右留白" },
    { key: "bodyLineHeightScale", label: "正文行高", hint: "仅控制正文段落、描述与项目要点行高" }
];

export const RESUME_REORDERABLE_SECTION_IDS = ["skills", "experiences", "projects", "education"];
export const DEFAULT_EXPERIENCE_WORK_BADGE_LABEL = "重点经历";

export const sampleResumeData = {
    documentTitle: "张三的简历",
    resumeLayout: RESUME_LAYOUT_CLASSIC,
    resumeTheme: "pro_blue",
    fontScale: 1,
    basicInfoScale: 1,
    titleScale: 1,
    nameScale: 1,
    roleScale: 1,
    basicInfoIconScale: 1,
    skillGroupNameScale: 1,
    skillTagScale: 1,
    workProjectMetaScale: 1,
    moduleMarginYScale: 1,
    moduleMarginXScale: 1,
    modulePaddingYScale: 1,
    modulePaddingXScale: 1,
    pagePaddingYScale: 1,
    pagePaddingXScale: 1,
    bodyLineHeightScale: 1,
    showExperienceTimeline: false,
    useFlatIcons: true,
    profileImage: "",
    avatarImageMeta: null,
    avatarFrame: { ...DEFAULT_AVATAR_FRAME },
    avatarShape: AVATAR_SHAPE_CIRCLE,
    basicInfoIconSet: getDefaultBasicInfoIconSetForLayout(RESUME_LAYOUT_CLASSIC),
    sectionTitleIconSet: getDefaultSectionTitleIconSetForLayout(RESUME_LAYOUT_CLASSIC),
    basicInfo: BASIC_INFO_PRESETS,
    professionalSkillsMode: PROFESSIONAL_SKILLS_MODE_SKILLS,
    sectionOrder: [...RESUME_REORDERABLE_SECTION_IDS],
    education: [
        { degree: "计算机科学与技术 - 本科", school: "北京某某大学", period: "2016.09 - 2020.06" },
        { degree: "软件工程 - 硕士", school: "北京某某大学", period: "2020.09 - 2023.06" }
    ],
    skills: [
        { name: "编程语言", items: ["JavaScript", "TypeScript", "Python", "HTML/CSS"] },
        { name: "框架与工具", items: ["React", "Vue.js", "Node.js", "Git", "Webpack"] },
        { name: "语言能力", items: ["英语 (CET-6 580)", "普通话 (一级乙等)"] }
    ],
    name: "张 三",
    role: "高级前端开发工程师",
    summary: "拥有3年以上前端开发经验，熟练掌握React、Vue等主流前端框架。热爱技术，对用户体验和性能优化有深入研究。曾主导并成功交付多个大型企业级Web应用项目，具备良好的团队协作能力和项目管理能力。致力于通过技术创新解决业务痛点，提升产品价值。",
    professionalSkillsText: "熟悉 React、Vue.js、TypeScript 与现代前端工程化体系，具备组件化设计、性能优化、跨端适配和团队协作落地经验。能够结合业务目标快速抽象页面结构与交互方案，并持续推动代码质量与交付效率提升。",
    experiences: [
        {
            title: "前端开发组长",
            company: "北京某某科技有限公司",
            period: "2022.07 - 至今",
            highlight: true,
            bullets: [
                "负责公司核心SAAS平台的架构设计与前端重构，采用 React + TypeScript，将页面首屏加载时间降低了 40%。",
                "带领5人前端团队，制定代码规范并引入CI/CD自动化部署流程，提升团队整体研发效率约30%。",
                "主导开发内部通用组件库，提取了30+个基础业务组件，极大减少了各业务线的重复开发工作。"
            ]
        },
        {
            title: "前端开发工程师",
            company: "上海某某互联网公司",
            period: "2020.07 - 2022.06",
            highlight: false,
            bullets: [
                "参与电商PC端及H5端页面的日常迭代开发，使用 Vue.js 与后端工程师紧密配合。",
                "实现了大型营销活动的复杂交互抽奖转盘及动画效果，活动期间稳定支撑10w+ QPS。",
                "优化了大量的冗余CSS及无用依赖，使得整体打包体积缩小了25%。"
            ]
        }
    ],
    projects: [
        {
            name: "企业级数据可视化大屏",
            iconBadgeLabel: "",
            badge: "独立负责",
            badgeStyle: "primary",
            period: "2023.03 - 2023.10",
            description: "基于 ECharts 和 Three.js 开发的大型数据监控大屏，对接WebSocket实现数据的实时动态更新与3D地图交互展示。",
            highlights: [
                "从 0 到 1 完成多维监控驾驶舱搭建，覆盖实时态势、预警播报与 3D 地图联动展示。",
                "接入 WebSocket 推流并优化可视化渲染节奏，保证大屏在高频刷新场景下仍能保持稳定体验。"
            ],
            techs: ["Vue3", "ECharts", "WebSocket"]
        },
        {
            name: "开源协同办公小程序",
            iconBadgeLabel: "",
            badge: "核心贡献者",
            badgeStyle: "secondary",
            period: "2022.05 - 2022.12",
            description: "一款支持多人实时协作编辑的微信小程序。解决了复杂网络环境下的数据同步冲突问题，获得了 2K+ GitHub Stars。",
            highlights: [
                "参与多人协作编辑链路设计，重点处理弱网环境下的数据同步冲突与离线恢复问题。",
                "项目上线后累计获得 2K+ GitHub Stars，并沉淀出可复用的小程序协同编辑方案。"
            ],
            techs: ["Taro", "Redux", "Node.js"]
        }
    ]
};

export function createInitialPanelState() {
    return {
        profile: false,
        theme: true,
        font: false,
        spacing: true,
        contact: true,
        education: true,
        skills: true,
        experiences: true,
        projects: true
    };
}
