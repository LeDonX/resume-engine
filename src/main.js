import Sortable from "sortablejs";
import "./styles/main.css";

const STORAGE_KEY = "resume-generator-draft-v1";
        const DRAFT_STORAGE_VERSION = 2;
        const DRAFT_AVATAR_SENTINEL = "__resume-avatar-sidecar__";
        const AVATAR_SIDECAR_DB_NAME = `${STORAGE_KEY}-sidecar`;
        const AVATAR_SIDECAR_STORE_NAME = "draft-assets";
        const AVATAR_SIDECAR_RECORD_KEY = `${STORAGE_KEY}:profile-image`;
        const RENDER_MODE_SCREEN = "screen";
        const RENDER_MODE_PRINT = "print";
        const RESUME_LAYOUT_CLASSIC = "classic";
        const RESUME_LAYOUT_CARDS = "cards";
        const RESUME_LAYOUT_OPTIONS = [
            { key: RESUME_LAYOUT_CLASSIC, label: "经典版", description: "原始简历排版" },
            { key: RESUME_LAYOUT_CARDS, label: "卡片版", description: "双栏卡片排版" }
        ];
        const FALLBACK_AVATAR = "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20viewBox%3D%270%200%20120%20120%27%3E%3Crect%20width%3D%27120%27%20height%3D%27120%27%20fill%3D%27%23e5e7eb%27/%3E%3Ccircle%20cx%3D%2760%27%20cy%3D%2745%27%20r%3D%2722%27%20fill%3D%27%239ca3af%27/%3E%3Crect%20x%3D%2726%27%20y%3D%2778%27%20width%3D%2768%27%20height%3D%2736%27%20rx%3D%2718%27%20fill%3D%27%239ca3af%27/%3E%3C/svg%3E";
        const PAGE_BREAK_BUFFER_PX = 8;
        const PRINT_RESTORE_DELAY_MS = 400;
        const MAX_AVATAR_FILE_SIZE = 10 * 1024 * 1024;
        const MAX_AVATAR_DRAFT_DATA_URL_LENGTH = 1500000;
        const MAX_AVATAR_STORAGE_EDGE = 1600;
        const AVATAR_STORAGE_QUALITIES = [0.92, 0.86, 0.8, 0.72, 0.64, 0.56];
        const ALLOWED_AVATAR_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
        const ALLOWED_AVATAR_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"];
        const DEFAULT_AVATAR_FRAME = Object.freeze({ zoom: 1, offsetX: 0, offsetY: 0 });
        const DEFAULT_AVATAR_IMAGE_META = Object.freeze({ width: 0, height: 0 });
        const AVATAR_OFFSET_LIMIT = 40;
        const AVATAR_CROP_FRAME_RATIO = 0.8;
        const AVATAR_CROP_MASK_INSET = `${(((1 - AVATAR_CROP_FRAME_RATIO) / 2) * 100).toFixed(1)}%`;
        const AVATAR_SHAPE_CIRCLE = "circle";
        const AVATAR_SHAPE_RECTANGLE = "rectangle";
        const avatarImageMetaCache = new Map();

        const BASIC_INFO_ICON_OPTIONS = [
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

        const BASIC_INFO_PRESETS = [
            { id: "phone", label: "手机", value: "138-xxxx-xxxx", iconPreset: "phone", iconMode: "preset", customIcon: "" },
            { id: "email", label: "邮箱", value: "zhangsan@qq.com", iconPreset: "email", iconMode: "preset", customIcon: "" },
            { id: "salary", label: "期望薪资", value: "25K-35K", iconPreset: "salary", iconMode: "preset", customIcon: "" },
            { id: "birth", label: "出生年月", value: "1998.08", iconPreset: "birth", iconMode: "preset", customIcon: "" },
            { id: "education", label: "学历", value: "硕士", iconPreset: "education", iconMode: "preset", customIcon: "" }
        ];
		
		// ----------------- 2. 图标原子色库 (构建调色板的积木，扩充至24种) -----------------
        const BASIC_INFO_COLORS = [
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

        function normalizeBasicInfoColor(value) {
            const normalized = pickText(value, "theme").trim().toLowerCase();
            return BASIC_INFO_COLORS.some((color) => color.key === normalized) ? normalized : "theme";
        }

        // --- 新增：动态渲染带颜色的图标 ---
        function renderDynamicIcon(iconClass, colorKey, sizeClass, extraClass = "") {
            const color = BASIC_INFO_COLORS.find(c => c.key === normalizeBasicInfoColor(colorKey)) || BASIC_INFO_COLORS[0];
            
            // 如果选择的是“跟随主题”，使用半透明主题色层叠效果
            if (color.key === "theme") {
                return `<div class="relative flex items-center justify-center overflow-hidden text-theme shadow-sm ${sizeClass} ${extraClass}">
                    <div class="absolute inset-0 bg-theme opacity-15"></div>
                    <i class="${escapeHtml(iconClass)} relative z-10"></i>
                </div>`;
            }
            // 否则使用选定的独立颜色
            return `<div class="flex items-center justify-center shadow-sm ${color.bg} ${color.text} ${sizeClass} ${extraClass}">
                <i class="${escapeHtml(iconClass)}"></i>
            </div>`;
        }

        // --- 扩充后的主题色配置 (分为单色系和多彩系) ---
        // ----------------- 1. 全局主色调库 (20款) -----------------
        const RESUME_THEME_OPTIONS = [
			{ key: "pro_blue", label: "严谨商务蓝", type: "solid", swatch: "#2563eb", accent: "#2563eb", accentStrong: "#1d4ed8", softBg: "#eff6ff", softText: "#1d4ed8", leftBg: "#f4f5f8", iconMode: "strict_gray" },
			{ key: "pro_slate", label: "严谨极简黑", type: "solid", swatch: "#334155", accent: "#475569", accentStrong: "#0f172a", softBg: "#f1f5f9", softText: "#0f172a", leftBg: "#f4f5f8", iconMode: "strict_gray" },
            // 🎨 纯粹单色
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

            // 🌈 渐变双拼混搭 (8款)
            { key: "ocean", label: "珊瑚海", type: "gradient", swatch: "linear-gradient(135deg, #0284c7, #14b8a6)", accent: "#0284c7", accentStrong: "#0f766e", softBg: "#e0f2fe", softText: "#0369a1" },
            { key: "sunset", label: "日落橘", type: "gradient", swatch: "linear-gradient(135deg, #ea580c, #e11d48)", accent: "#ea580c", accentStrong: "#be123c", softBg: "#ffe4e6", softText: "#e11d48" },
            { key: "cyber", label: "赛博紫", type: "gradient", swatch: "linear-gradient(135deg, #8b5cf6, #ec4899)", accent: "#8b5cf6", accentStrong: "#be185d", softBg: "#fce7f3", softText: "#db2777" },
            { key: "berry", label: "青柠蓝", type: "gradient", swatch: "linear-gradient(135deg, #4f46e5, #10b981)", accent: "#4f46e5", accentStrong: "#047857", softBg: "#d1fae5", softText: "#059669" },
            { key: "peach", label: "蜜桃粉", type: "gradient", swatch: "linear-gradient(135deg, #f43f5e, #f59e0b)", accent: "#f43f5e", accentStrong: "#e11d48", softBg: "#fff1f2", softText: "#be123c" },
            { key: "lavender", label: "薰衣草", type: "gradient", swatch: "linear-gradient(135deg, #a855f7, #6366f1)", accent: "#a855f7", accentStrong: "#4f46e5", softBg: "#f3e8ff", softText: "#6d28d9" },
            { key: "mint", label: "薄荷冰", type: "gradient", swatch: "linear-gradient(135deg, #14b8a6, #3b82f6)", accent: "#14b8a6", accentStrong: "#1d4ed8", softBg: "#ccfbf1", softText: "#0f766e" },
            { key: "midnight", label: "极光黑", type: "gradient", swatch: "linear-gradient(135deg, #0f172a, #3730a3)", accent: "#334155", accentStrong: "#0f172a", softBg: "#f1f5f9", softText: "#1e293b" }
        ];
		
		 // ----------------- 3. 高级多色调色板组合 (8组) -----------------
        const ICON_PALETTE_OPTIONS = [
            { key: "theme", label: "统一主色", colors: [], preview: ["#94a3b8"] }, 
            
            // 🌟 1. 原版经典色：你最初版本的那组颜色！
            { key: "classic", label: "经典原味", colors: ["sky", "indigo", "emerald", "rose", "violet", "amber"], preview: ["#0ea5e9", "#10b981", "#6366f1"] },
            
            // 🌟 2. 改进版马卡龙：抛弃笨重颜色，采用粉/青/鹅黄/草绿的粉嫩低饱和撞色
            { key: "macaron", label: "马卡龙", colors: ["pink", "cyan", "yellow", "lime", "violet", "sky"], preview: ["#f472b6", "#22d3ee", "#facc15"] },
            
            // 🌟 3. 莫兰迪色：灰调优雅高级感，适合极简/设计岗
            { key: "morandi", label: "莫兰迪", colors: ["slate", "stone", "teal", "rose", "indigo", "zinc"], preview: ["#64748b", "#78716c", "#14b8a6"] },
            
            // 🌟 4. 其他风格组
            { key: "neon", label: "赛博霓虹", colors: ["fuchsia", "cyan", "lime", "violet", "rose"], preview: ["#d946ef", "#06b6d4", "#84cc16"] },
            { key: "ocean", label: "海蓝之吻", colors: ["blue", "sky", "cyan", "teal", "indigo"], preview: ["#3b82f6", "#0ea5e9", "#06b6d4"] },
            { key: "forest", label: "森林大地", colors: ["emerald", "lime", "teal", "stone", "amber"], preview: ["#10b981", "#84cc16", "#78716c"] },
            { key: "sunset", label: "黄昏暖阳", colors: ["orange", "rose", "red", "amber", "fuchsia"], preview: ["#f97316", "#f43f5e", "#f59e0b"] }
        ];

        // 🌟 智能计算图标颜色的终极算法 🌟
        function resolveIconColorToneForTheme(index, itemColorOverride, globalPaletteKey, themeKey) {
            
            // 1. 如果用户【手动强制指定】了某个图标的独立颜色（比如非要把它变成红色），绝对优先级最高！听用户的！
            if (itemColorOverride && itemColorOverride !== "theme") {
                return itemColorOverride;
            }
            
            // 2. 读取当前全局选中的混搭调色板
            const activeGlobalPalette = globalPaletteKey || "theme";

            // 3. 读取当前简历选中的大主题 (比如 "严谨商务蓝")
            const currentTheme = getResumeThemeOption(themeKey);

            // 🌟 4. 核心逻辑：如果当前全局调色板选的是“跟随主题”，并且当前主题自带“默认灰色”属性
            // 那我们就给它渲染成灰色。
            if (activeGlobalPalette === "theme" && currentTheme.iconMode === "strict_gray") {
                return "slate"; // 默认呈现石板灰
            }

            // 5. 如果选了“统一主色”（且不是上面那种强制灰的商务主题）
            if (activeGlobalPalette === "theme") {
                return "theme";
            }
            
            // 6. 如果用户开启了“马卡龙”、“海蓝之吻”等多色调色板，尊重用户的多色选择！
            const palette = ICON_PALETTE_OPTIONS.find(p => p.key === activeGlobalPalette) || ICON_PALETTE_OPTIONS[1];
            if (!palette.colors || !palette.colors.length) return "theme";
            
            // 7. 无限安全循环取色
            return palette.colors[index % palette.colors.length];
        }

        function resolveIconColorTone(index, itemColorOverride, globalPaletteKey) {
            return resolveIconColorToneForTheme(index, itemColorOverride, globalPaletteKey, resumeData.resumeTheme);
        }

        const sampleResumeData = {
            documentTitle: "张三的简历",
            resumeLayout: RESUME_LAYOUT_CLASSIC,
            resumeTheme: "pro_blue",
            useFlatIcons: true,
            profileImage: "",
            avatarImageMeta: null,
            avatarFrame: { ...DEFAULT_AVATAR_FRAME },
            avatarShape: AVATAR_SHAPE_CIRCLE,
            basicInfo: BASIC_INFO_PRESETS,
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
                    badge: "独立负责",
                    badgeStyle: "primary",
                    description: "基于 ECharts 和 Three.js 开发的大型数据监控大屏，对接WebSocket实现数据的实时动态更新与3D地图交互展示。",
                    techs: ["Vue3", "ECharts", "WebSocket"]
                },
                {
                    name: "开源协同办公小程序",
                    badge: "核心贡献者",
                    badgeStyle: "secondary",
                    description: "一款支持多人实时协作编辑的微信小程序。解决了复杂网络环境下的数据同步冲突问题，获得了 2K+ GitHub Stars。",
                    techs: ["Taro", "Redux", "Node.js"]
                }
            ]
        };

        function createBasicInfoPresets() {
            return BASIC_INFO_PRESETS.map((item) => ({
                ...item,
                iconColor: normalizeBasicInfoColor(item.iconColor)
            }));
        }

        function createDefaultAvatarFrame() {
            return { ...DEFAULT_AVATAR_FRAME };
        }

        function normalizeResumeTheme(value) {
            const normalized = pickText(value, "").trim().toLowerCase();
            return RESUME_THEME_OPTIONS.some((option) => option.key === normalized) ? normalized : RESUME_THEME_OPTIONS[0].key;
        }

        function normalizeResumeLayout(value) {
            const normalized = pickText(value, "").trim().toLowerCase();
            return normalized === RESUME_LAYOUT_CARDS ? RESUME_LAYOUT_CARDS : RESUME_LAYOUT_CLASSIC;
        }

        function normalizeRenderMode(value) {
            return value === RENDER_MODE_PRINT ? RENDER_MODE_PRINT : RENDER_MODE_SCREEN;
        }

        function getResumeLayoutClass(value) {
            return normalizeResumeLayout(value) === RESUME_LAYOUT_CARDS
                ? "resume-layout-cards"
                : "resume-layout-classic";
        }

        function getResumeLayoutLabel(value) {
            return RESUME_LAYOUT_OPTIONS.find((option) => option.key === normalizeResumeLayout(value))?.label || "经典版";
        }

        function getResumeThemeOption(themeKey) {
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

        function buildResumeThemeVars(theme) {
            // 如果主题配置了 leftBg (如专业商务风)，就用纯色；否则用柔和的微渐变
            const leftBackground = theme.leftBg 
                ? theme.leftBg 
                : `linear-gradient(180deg, ${theme.softBg || '#f8fbff'}40, ${theme.softBg || '#f3f7fe'}80)`;

            const pageCanvas = mixHexColors(theme.softBg || "#f3f4f6", "#e5e7eb", 0.52, "#eceef2");
            const pageBorder = mixHexColors(pageCanvas, "#cbd5e1", 0.42, "#d8dee7");
            const cardBorder = mixHexColors(theme.softBg || "#eef2f7", "#cfd7e3", 0.72, "#dde3ea");
            const cardSubtle = mixHexColors(theme.softBg || "#f8fafc", "#ffffff", 0.46, "#f8fafc");
            const mutedText = mixHexColors(theme.accentStrong, "#667085", 0.8, "#667085");
            const subtleText = mixHexColors(mutedText, "#98a2b3", 0.58, "#98a2b3");
            const pillBg = mixHexColors(theme.softBg || "#edf2ff", "#ffffff", 0.28, "#f5f7fb");
            const pillText = mixHexColors(theme.accentStrong, "#667085", 0.5, theme.accentStrong);
            const timelineTrack = mixHexColors(theme.softBg || "#e5ebf3", "#cbd5e1", 0.54, "#d9e0e8");
            const pageShadow = `0 32px 72px ${toRgbaString(theme.accentStrong, 0.08, "rgba(15, 23, 42, 0.08)")}, 0 10px 26px rgba(15, 23, 42, 0.06)`;
            const cardShadow = `0 18px 38px ${toRgbaString(theme.accentStrong, 0.06, "rgba(15, 23, 42, 0.06)")}, 0 4px 14px rgba(15, 23, 42, 0.04)`;
			const dividerColor = theme.iconMode === "strict_gray" 
							? "#cbd5e1" // Tailwind 里的 slate-300，最完美的浅灰分割线
							: (theme.accent + "66"); // 其他主题保留主色带透明度的横线

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
                "--resume-timeline-dot-glow": toRgbaString(theme.accent, 0.22, "rgba(37, 99, 235, 0.22)")
            };
        }

        function buildResumeThemeInlineStyle(theme) {
            const vars = buildResumeThemeVars(theme);
            return Object.entries(vars)
                .map(([key, value]) => `${key}: ${value};`)
                .join(" ");
        }

        function normalizeAvatarShape(value) {
            return value === AVATAR_SHAPE_RECTANGLE ? AVATAR_SHAPE_RECTANGLE : AVATAR_SHAPE_CIRCLE;
        }

        function getAvatarFrameLabel(shape) {
            return normalizeAvatarShape(shape) === AVATAR_SHAPE_RECTANGLE ? "矩形框" : "圆框";
        }

        function getAvatarCropMaskRadius(shape) {
            return normalizeAvatarShape(shape) === AVATAR_SHAPE_RECTANGLE ? "1rem" : "9999px";
        }

        function getAvatarFrameContainerClass(shape) {
            return normalizeAvatarShape(shape) === AVATAR_SHAPE_RECTANGLE ? "rounded-2xl" : "rounded-full";
        }

        function normalizeAvatarImageMeta(sourceValue) {
            const source = sourceValue && typeof sourceValue === "object" ? sourceValue : {};
            const width = Math.max(0, Math.round(clampNumber(source.width, 0, 100000, DEFAULT_AVATAR_IMAGE_META.width)));
            const height = Math.max(0, Math.round(clampNumber(source.height, 0, 100000, DEFAULT_AVATAR_IMAGE_META.height)));
            if (!width || !height) {
                return null;
            }
            return { width, height };
        }

        function getBasicInfoIconByPreset(presetKey) {
            const option = getBasicInfoIconOption(presetKey);
            return option ? option.icon : "fas fa-circle";
        }

        function getBasicInfoIconOption(presetKey) {
            return BASIC_INFO_ICON_OPTIONS.find((item) => item.key === presetKey) || BASIC_INFO_ICON_OPTIONS[0];
        }

        function getBasicInfoIconTone(presetKey) {
            const option = getBasicInfoIconOption(presetKey);
            return {
                chipClass: option.chipClass || "bg-slate-100 text-slate-700",
                cardClass: option.cardClass || "border-slate-200 bg-slate-50/90 text-slate-700",
                label: option.label || "图标"
            };
        }

        // 预设白名单：仅允许这 5 个 id
        const VALID_BASIC_INFO_IDS = new Set(BASIC_INFO_PRESETS.map(p => p.id));

        function normalizeBasicInfoList(sourceValue) {
            const source = pickArray(sourceValue);

            // 步骤 1：白名单过滤 - 只保留已知 id，去除 unknown id
            const validItems = source.filter(item => VALID_BASIC_INFO_IDS.has(item?.id));

            // 步骤 2：去重（保留首次出现）
            const seenIds = new Set();
            const deduplicated = [];
            for (const item of validItems) {
                if (!seenIds.has(item.id)) {
                    seenIds.add(item.id);
                    deduplicated.push(item);
                }
            }

            // 步骤 3：标准化字段（使用 fallback 填充）
            const normalized = deduplicated.map((item) => {
                const preset = BASIC_INFO_PRESETS.find(p => p.id === item.id) || BASIC_INFO_PRESETS[0];
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

            // 步骤 4：如果没有有效项，返回默认值
            if (!normalized.length) {
                return createBasicInfoPresets();
            }

            // 步骤 5：补齐缺失的 preset 项（按 BASIC_INFO_PRESETS 顺序追加）
            const existingIds = new Set(normalized.map(item => item.id));
            for (const preset of BASIC_INFO_PRESETS) {
                if (!existingIds.has(preset.id)) {
                    normalized.push({ ...preset });
                }
            }

            // 步骤 6：硬约束 - 固定返回 5 项
            return normalized.slice(0, 5);
        }

        function clampNumber(value, min, max, fallback) {
            const parsed = Number(value);
            if (!Number.isFinite(parsed)) {
                return fallback;
            }
            return Math.min(max, Math.max(min, parsed));
        }

        function getCachedAvatarImageMeta(imageSrc) {
            const src = pickText(imageSrc, "").trim();
            return src ? (avatarImageMetaCache.get(src) || null) : null;
        }

        async function loadAvatarImageMeta(imageSrc) {
            const src = pickText(imageSrc, "").trim();
            if (!src) {
                return null;
            }
            if (typeof Image === "undefined") {
                return null;
            }
            if (avatarImageMetaCache.has(src)) {
                return avatarImageMetaCache.get(src);
            }
            const meta = await new Promise((resolve) => {
                const image = new Image();
                image.onload = () => resolve({ width: image.naturalWidth || 0, height: image.naturalHeight || 0 });
                image.onerror = () => resolve(null);
                image.src = src;
            });
            avatarImageMetaCache.set(src, meta);
            return meta;
        }

        function getAvatarEditorMinZoom(imageMeta) {
            const meta = normalizeAvatarImageMeta(imageMeta);
            if (!meta) {
                return 1;
            }
            const minDimension = Math.min(meta.width, meta.height);
            const maxDimension = Math.max(meta.width, meta.height);
            const fitZoom = minDimension / (maxDimension * AVATAR_CROP_FRAME_RATIO);
            return Math.min(1, Math.max(0.2, Number(fitZoom.toFixed(2))));
        }

        function createInitialAvatarCropFrame(imageMeta) {
            const frame = createDefaultAvatarFrame();
            frame.zoom = getAvatarEditorMinZoom(imageMeta);
            return frame;
        }

        function getAvatarOffsetLimits(zoom, imageMeta) {
            if (imageMeta?.width && imageMeta?.height) {
                const baseScale = 1 / Math.min(imageMeta.width, imageMeta.height);
                const renderedWidthRatio = imageMeta.width * baseScale * zoom;
                const renderedHeightRatio = imageMeta.height * baseScale * zoom;
                return {
                    x: Math.max(0, ((renderedWidthRatio - 1) / 2) * 100),
                    y: Math.max(0, ((renderedHeightRatio - 1) / 2) * 100)
                };
            }
            const genericLimit = Math.max(AVATAR_OFFSET_LIMIT, ((zoom - 1) / 2) * 100);
            return { x: genericLimit, y: genericLimit };
        }

        function normalizeAvatarFrame(sourceValue, imageMeta = null, minZoom = 1) {
            const source = sourceValue && typeof sourceValue === "object" ? sourceValue : {};
            const safeMinZoom = clampNumber(minZoom, 0.2, 1, 1);
            const zoom = clampNumber(source.zoom, safeMinZoom, 2.5, Math.max(DEFAULT_AVATAR_FRAME.zoom, safeMinZoom));
            const offsetLimit = getAvatarOffsetLimits(zoom, imageMeta);
            return {
                zoom,
                offsetX: Math.round(clampNumber(source.offsetX, -offsetLimit.x, offsetLimit.x, DEFAULT_AVATAR_FRAME.offsetX)),
                offsetY: Math.round(clampNumber(source.offsetY, -offsetLimit.y, offsetLimit.y, DEFAULT_AVATAR_FRAME.offsetY))
            };
        }

        function getAvatarImageStyle(frame, imageMeta = null, viewportRatio = 1, minZoom = 1) {
            const avatarFrame = normalizeAvatarFrame(frame, imageMeta, minZoom);
            const normalizedMeta = normalizeAvatarImageMeta(imageMeta);
            const minDimension = normalizedMeta ? Math.min(normalizedMeta.width, normalizedMeta.height) : 1;
            const widthRatio = normalizedMeta ? (normalizedMeta.width / minDimension) : 1;
            const heightRatio = normalizedMeta ? (normalizedMeta.height / minDimension) : 1;
            const safeViewportRatio = clampNumber(viewportRatio, 0.1, 1, 1);
            return [
                "position: absolute",
                "display: block",
                `width: ${(widthRatio * avatarFrame.zoom * safeViewportRatio * 100).toFixed(3)}%`,
                `height: ${(heightRatio * avatarFrame.zoom * safeViewportRatio * 100).toFixed(3)}%`,
                `left: ${(50 + (avatarFrame.offsetX * safeViewportRatio)).toFixed(3)}%`,
                `top: ${(50 + (avatarFrame.offsetY * safeViewportRatio)).toFixed(3)}%`,
                "transform: translate(-50%, -50%)",
                "transform-origin: center center",
                "max-width: none",
                "max-height: none",
                "will-change: transform"
            ].join("; ");
        }

        function createAvatarCropState(imageSrc, frame, fileName = "", imageMeta = null) {
            const minZoom = getAvatarEditorMinZoom(imageMeta);
            return {
                imageSrc: pickText(imageSrc, "").trim(),
                frame: normalizeAvatarFrame(frame, imageMeta, minZoom),
                fileName: pickText(fileName, ""),
                imageMeta: imageMeta && imageMeta.width && imageMeta.height ? { width: imageMeta.width, height: imageMeta.height } : null,
                pendingQuickAction: null
            };
        }

        function getAvatarEditorState() {
            if (avatarCropState) {
                return avatarCropState;
            }
            return {
                imageSrc: getAvatarImageSource(resumeData.profileImage),
                frame: normalizeAvatarFrame(resumeData.avatarFrame, resumeData.avatarImageMeta || getCachedAvatarImageMeta(resumeData.profileImage)),
                fileName: "",
                imageMeta: resumeData.avatarImageMeta || getCachedAvatarImageMeta(resumeData.profileImage)
            };
        }

        function setAvatarEditorFrame(frame) {
            if (avatarCropState) {
                avatarCropState.frame = normalizeAvatarFrame(frame, avatarCropState.imageMeta, getAvatarEditorMinZoom(avatarCropState.imageMeta));
                syncAvatarEditorUI();
                return;
            }
            resumeData.avatarFrame = normalizeAvatarFrame(frame, resumeData.avatarImageMeta || getCachedAvatarImageMeta(resumeData.profileImage));
            syncAvatarEditorUI();
            renderResume(resumeData);
            saveDraft();
        }

        function calculateAvatarFrameFromDrag(startFrame, deltaX, deltaY, width, height, imageMeta = null, minZoom = 1) {
            const avatarFrame = normalizeAvatarFrame(startFrame, imageMeta, minZoom);
            return normalizeAvatarFrame({
                ...avatarFrame,
                offsetX: avatarFrame.offsetX + ((deltaX / Math.max(width, 1)) * 100),
                offsetY: avatarFrame.offsetY + ((deltaY / Math.max(height, 1)) * 100)
            }, imageMeta, minZoom);
        }

        function openAvatarCropper(imageSrc, frame = createDefaultAvatarFrame(), fileName = "", imageMeta = null) {
            avatarCropState = createAvatarCropState(imageSrc, frame, fileName, imageMeta || getCachedAvatarImageMeta(imageSrc));
            renderForm();
            syncAvatarEditorUI();
            if (!avatarCropState.imageMeta && avatarCropState.imageSrc) {
                loadAvatarImageMeta(avatarCropState.imageSrc).then((resolvedMeta) => {
                    if (!resolvedMeta || !avatarCropState || avatarCropState.imageSrc !== imageSrc) {
                        return;
                    }
                    avatarCropState.imageMeta = resolvedMeta;
                    avatarCropState.frame = normalizeAvatarFrame(avatarCropState.frame, resolvedMeta, getAvatarEditorMinZoom(resolvedMeta));
                    if (avatarCropState.pendingQuickAction) {
                        const pendingAction = avatarCropState.pendingQuickAction;
                        avatarCropState.pendingQuickAction = null;
                        applyAvatarCropQuickAction(pendingAction);
                        return;
                    }
                    syncAvatarEditorUI();
                }).catch(() => {
                    // Ignore metadata lookup failure and keep generic drag bounds.
                });
            }
        }

        function closeAvatarCropper() {
            avatarCropState = null;
            avatarDragState = null;
            renderForm();
        }

        function applyAvatarCropQuickAction(mode) {
            if (!avatarCropState) {
                return;
            }

            const frameLabel = getAvatarFrameLabel(resumeData.avatarShape);

            if (mode === "show-full" && !avatarCropState.imageMeta) {
                avatarCropState.pendingQuickAction = mode;
                setStatus("正在读取图片尺寸，稍后会自动切换到完整预览。", "info");
                return;
            }

            const minZoom = getAvatarEditorMinZoom(avatarCropState.imageMeta);
            const currentFrame = normalizeAvatarFrame(avatarCropState.frame, avatarCropState.imageMeta, minZoom);

            if (mode === "center") {
                setAvatarEditorFrame({
                    ...currentFrame,
                    offsetX: 0,
                    offsetY: 0
                });
                setStatus("已将头像重新居中。", "info");
                return;
            }

            if (mode === "show-full") {
                setAvatarEditorFrame({
                    ...currentFrame,
                    zoom: minZoom,
                    offsetX: 0,
                    offsetY: 0
                });
                setStatus("已切换为完整预览。", "info");
                return;
            }

            if (mode === "fill-frame") {
                setAvatarEditorFrame({
                    ...currentFrame,
                    zoom: 1,
                    offsetX: 0,
                    offsetY: 0
                });
                setStatus(`已填满${frameLabel}，可继续微调。`, "info");
            }
        }

        function confirmAvatarCrop() {
            if (!avatarCropState) {
                return;
            }

            const nextCrop = createAvatarCropState(avatarCropState.imageSrc, avatarCropState.frame, avatarCropState.fileName, avatarCropState.imageMeta);
            if (nextCrop.frame.zoom < 1) {
                const frameLabel = getAvatarFrameLabel(resumeData.avatarShape);
                setStatus(`请先放大图片，让头像范围填满白色${frameLabel}后再确认。`, "info");
                syncAvatarEditorUI();
                return;
            }
            const previousProfileImage = resumeData.profileImage;
            const previousAvatarImageMeta = cloneData(resumeData.avatarImageMeta);
            const previousAvatarFrame = cloneData(resumeData.avatarFrame);

            resumeData.profileImage = nextCrop.imageSrc;
            resumeData.avatarImageMeta = normalizeAvatarImageMeta(nextCrop.imageMeta);
            resumeData.avatarFrame = nextCrop.frame;

            if (!saveDraft({
                showAvatarWarning: true,
                avatarWarningMessage: "头像已更新，但浏览器未能持久化头像图片；当前预览会保留头像，但刷新后可能丢失，请及时导出 JSON 备份。"
            })) {
                resumeData.profileImage = previousProfileImage;
                resumeData.avatarImageMeta = previousAvatarImageMeta;
                resumeData.avatarFrame = previousAvatarFrame;
                renderAll();
                setStatus("头像保存失败：无法写入本地草稿。", "error");
                return;
            }

            avatarCropState = null;
            renderAll();
            const suffix = nextCrop.fileName ? `：${nextCrop.fileName}` : "";
            setStatus(`头像已更新并保存${suffix}`, "success");
        }

        function renderAvatarCropModal() {
            if (!avatarCropState) {
                return "";
            }

            const cropImage = getAvatarImageSource(avatarCropState.imageSrc);
            const cropMinZoom = getAvatarEditorMinZoom(avatarCropState.imageMeta);
            const avatarFrame = normalizeAvatarFrame(avatarCropState.frame, avatarCropState.imageMeta, cropMinZoom);
            const minZoom = cropMinZoom;
            const canConfirmCrop = avatarFrame.zoom >= 1;
            const frameLabel = getAvatarFrameLabel(resumeData.avatarShape);
            const maskRadius = getAvatarCropMaskRadius(resumeData.avatarShape);

            // 估算图片信息 (宽 x 高)
            const imgWidth = avatarCropState.imageMeta ? avatarCropState.imageMeta.width : "未知";
            const imgHeight = avatarCropState.imageMeta ? avatarCropState.imageMeta.height : "未知";
            const imgSizeStr = (imgWidth !== "未知" && imgHeight !== "未知") ? `${imgWidth} × ${imgHeight} px` : "正在读取...";

            return `
                <div class="avatar-crop-backdrop" data-testid="avatar-crop-modal" role="dialog" aria-modal="true" aria-label="头像裁切设置">
                    <div class="avatar-crop-shell" style="--avatar-crop-mask-inset: ${AVATAR_CROP_MASK_INSET}; --avatar-crop-mask-radius: ${maskRadius};">
                        <div class="avatar-crop-layout">
                            
                            <!-- 左侧：暗色预览区 -->
                            <div class="avatar-crop-panel-left avatar-crop-panel-pad">
                                <p class="text-[11px] font-bold uppercase tracking-[0.32em] text-cyan-200/80">Avatar Crop</p>
                                <div class="mt-3">
                                    <h3 class="avatar-crop-heading font-extrabold text-white tracking-tight">调整头像进入最终${frameLabel}范围</h3>
                                    <p class="avatar-crop-description mt-2 text-slate-300/90 text-[13px] leading-relaxed pr-4">
										拖动图片把头部放进白色${frameLabel}内，再用右侧滑块控制脸部比例。确认前不会覆盖当前简历头像。
									</p>
                                </div>
                                <div class="avatar-crop-stage-area mt-4">
                                    <div class="avatar-crop-stage-shell ring-1 ring-white/10 shadow-[0_0_40px_rgba(0,0,0,0.3)]">
                                        
                                        <!-- 拖拽操作区 -->
                                        <div class="avatar-crop-stage cursor-grab active:cursor-grabbing touch-none select-none group/stage relative" data-testid="avatar-drag-surface" data-avatar-drag-surface="true" aria-label="拖拽调整头像位置">
                                            <img src="${escapeHtml(cropImage)}" alt="Avatar crop preview" class="pointer-events-none select-none transition-transform duration-75" data-testid="avatar-editor-image" data-avatar-editor-image="true" style="${getAvatarImageStyle(avatarFrame, avatarCropState.imageMeta, AVATAR_CROP_FRAME_RATIO, cropMinZoom)}" onerror="this.onerror=null;this.src='${FALLBACK_AVATAR}'">
                                            
                                            <!-- 白色遮罩层 -->
                                            <div class="avatar-crop-mask transition-all"></div>

                                            <!-- 🌟 增强版：高清晰度九宫格辅助线 🌟 -->
                                            <!-- 1. 去掉 mix-blend-overlay 防止被背景吃色 -->
                                            <!-- 2. 提升了基础的 opacity 让它更显眼 -->
                                            <!-- 3. 加入了一层极其轻微的 drop-shadow(黑边)，保证在纯白背景图下依然清晰可见 -->
                                            <div class="absolute inset-[9%] pointer-events-none opacity-0 group-hover/stage:opacity-60 transition-opacity duration-300 border border-white/60 shadow-[0_0_1px_rgba(0,0,0,0.5)]" style="border-radius: ${maskRadius}; z-index: 20;">
                                                <div class="absolute inset-x-0 top-1/3 border-t border-dashed border-white/80 shadow-[0_1px_1px_rgba(0,0,0,0.3)]"></div>
                                                <div class="absolute inset-x-0 top-2/3 border-t border-dashed border-white/80 shadow-[0_1px_1px_rgba(0,0,0,0.3)]"></div>
                                                <div class="absolute inset-y-0 left-1/3 border-l border-dashed border-white/80 shadow-[1px_0_1px_rgba(0,0,0,0.3)]"></div>
                                                <div class="absolute inset-y-0 left-2/3 border-l border-dashed border-white/80 shadow-[1px_0_1px_rgba(0,0,0,0.3)]"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <p class="text-[11px] font-medium tracking-wide text-slate-400 mt-4 flex items-center gap-1.5">
                                        <i class="fas fa-info-circle"></i> 方形工作区显示原图的完整移动空间，白色${frameLabel}才是最终头像。
                                    </p>
                                </div>
                            </div>

                            <!-- 右侧：亮色操作区 -->
                            <div class="avatar-crop-panel-right avatar-crop-panel-pad">
                                <div class="avatar-crop-controls avatar-crop-controls-card flex flex-col h-full rounded-3xl border border-slate-100 bg-white/95 backdrop-blur-xl shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                                    
                                    <div class="flex items-center justify-between mb-5">
                                        <p class="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">参数调整</p>
                                        <span class="flex h-5 items-center rounded-full bg-slate-100 px-2 text-[9px] font-bold text-slate-500 ring-1 ring-slate-200">
                                            ${avatarCropState.fileName ? escapeHtml(avatarCropState.fileName).substring(0, 15) + (avatarCropState.fileName.length > 15 ? '...' : '') : '当前图片'}
                                        </span>
                                    </div>
                                    
                                    <div class="flex-1 flex flex-col gap-5">
                                        
                                        <!-- 1. 缩放滑块 (带放大镜图标) -->
                                        <div class="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                                            <div class="flex items-center justify-between mb-3">
                                                <span class="text-[12px] font-extrabold text-slate-700">图像缩放</span>
                                                <span class="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md" data-testid="avatar-zoom-readout">${avatarFrame.zoom.toFixed(2)}x</span>
                                            </div>
                                            <div class="flex items-center gap-3">
                                                <i class="fas fa-search-minus text-[11px] text-slate-400 hover:text-blue-500 transition-colors cursor-pointer" onclick="document.querySelector('[data-testid=\\'avatar-zoom-control\\']').stepDown(); document.querySelector('[data-testid=\\'avatar-zoom-control\\']').dispatchEvent(new Event('input'))"></i>
                                                <input name="avatar-zoom" type="range" min="${escapeHtml(String(minZoom))}" max="2.5" step="0.01" value="${escapeHtml(String(avatarFrame.zoom))}" class="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 hover:accent-blue-500 transition-all" data-section="avatarFrame" data-field="zoom" data-testid="avatar-zoom-control">
                                                <i class="fas fa-search-plus text-[11px] text-slate-400 hover:text-blue-500 transition-colors cursor-pointer" onclick="document.querySelector('[data-testid=\\'avatar-zoom-control\\']').stepUp(); document.querySelector('[data-testid=\\'avatar-zoom-control\\']').dispatchEvent(new Event('input'))"></i>
                                            </div>
                                        </div>

                                        <!-- 2. 快捷对齐与位置重置 (拟物分段控制器) -->
                                        <div>
                                            <p class="text-[11px] font-bold text-slate-700 mb-2">快捷定位</p>
                                            <div class="rounded-xl bg-slate-100/80 p-1 ring-1 ring-slate-200/50">
                                                <div class="flex flex-col gap-1">
                                                    <div class="flex gap-1">
                                                        <button type="button" data-action="avatar-crop-center" data-testid="avatar-crop-center" class="flex-1 rounded-lg bg-white px-3 py-2 text-[11px] font-bold text-slate-600 shadow-sm transition-all hover:text-blue-600 hover:shadow">重新居中</button>
                                                        <button type="button" data-action="avatar-crop-show-full" data-testid="avatar-crop-show-full" class="flex-1 rounded-lg bg-white px-3 py-2 text-[11px] font-bold text-slate-600 shadow-sm transition-all hover:text-blue-600 hover:shadow">查看全图</button>
                                                    </div>
                                                    <button type="button" data-action="avatar-crop-fill-frame" data-testid="avatar-crop-fill-frame" class="w-full rounded-lg bg-white px-3 py-2 text-[11px] font-bold text-slate-600 shadow-sm transition-all hover:text-blue-600 hover:shadow ring-1 ring-transparent hover:ring-blue-100">一键填满${frameLabel}</button>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- 3. 新增：图片原始信息卡片 (填补留白，增加专业感) -->
                                        <div class="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                                            <div class="flex items-center gap-2">
                                                <div class="flex h-6 w-6 items-center justify-center rounded bg-slate-100 text-slate-500">
                                                    <i class="far fa-image text-[10px]"></i>
                                                </div>
                                                <span class="text-[11px] font-bold text-slate-600">原图尺寸</span>
                                            </div>
                                            <span class="text-[11px] font-bold text-slate-800 tracking-tight">${imgSizeStr}</span>
                                        </div>

                                        <!-- 4. 状态反馈框 (放大、强化视觉) -->
                                        <div class="mt-auto rounded-2xl px-4 py-3.5 text-xs leading-relaxed transition-all duration-300 ${canConfirmCrop ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200 shadow-[0_4px_12px_rgba(16,185,129,0.1)]' : 'bg-amber-50 text-amber-800 ring-1 ring-amber-200'}" data-testid="avatar-crop-feedback">
                                            ${canConfirmCrop
                                                ? `<div class="flex items-start gap-2.5">
                                                        <div class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mt-0.5">
                                                            <i class="fas fa-check text-[10px]"></i>
                                                        </div>
                                                        <div>
                                                            <p class="font-bold text-[12px]">允许应用当前范围</p>
                                                            <p class="mt-0.5 text-[10px] font-medium text-emerald-600/80 leading-tight">边缘已被完全填满。你可以继续微调脸部比例，或直接点击下方应用。</p>
                                                        </div>
                                                   </div>`
                                                : `<div class="flex items-start gap-2.5">
                                                        <div class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 mt-0.5">
                                                            <i class="fas fa-exclamation text-[10px]"></i>
                                                        </div>
                                                        <div>
                                                            <p class="font-bold text-[12px]">无法应用：存在空白</p>
                                                            <p class="mt-0.5 text-[10px] font-medium text-amber-600/80 leading-tight">白色${frameLabel}内有透明区域。<br/>请向右拖动上方滑块，放大图片至填满。</p>
                                                        </div>
                                                   </div>`}
                                        </div>
                                    </div>

                                    <!-- 5. 底部按钮组 -->
                                    <div class="avatar-crop-actions mt-5 pt-4 border-t border-slate-100 flex gap-2">
                                        <button type="button" data-action="cancel-avatar-crop" class="flex-1 rounded-xl bg-slate-100 px-4 py-3 text-[13px] font-bold text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-800">取消</button>
                                        <button type="button" data-action="confirm-avatar-crop" data-testid="avatar-crop-confirm" ${canConfirmCrop ? '' : 'disabled'} class="flex-[1.5] rounded-xl px-4 py-3 text-[13px] font-bold whitespace-nowrap transition-all duration-200 flex items-center justify-center gap-1.5 ${canConfirmCrop ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/25 hover:bg-slate-800 hover:shadow-xl hover:-translate-y-0.5' : 'cursor-not-allowed bg-slate-100 text-slate-400 ring-1 ring-inset ring-slate-200'}">
                                            ${canConfirmCrop ? '<i class="fas fa-crop-alt text-[11px] opacity-80"></i> 应用头像' : '请先填满边框'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        // Helper to validate Font Awesome class (balance rule)
        // Valid if: has at least one style token + at least one icon token (fa-<name>)
        function isValidFontAwesomeClass(className) {
            if (!className || typeof className !== "string") {
                return false;
            }
            const trimmed = className.trim();
            if (!trimmed) {
                return false;
            }

            // Style tokens (modern + legacy) - these are NOT icons
            const styleTokens = new Set([
                "fa-solid", "fa-regular", "fa-light", "fa-thin", "fa-brands",
                "fas", "far", "fal", "fat", "fab", "fad"
            ]);
            // Icon token: fa-<name> where name is not just a helper suffix or style
            const iconPattern = /\bfa-([a-z][a-z0-9]*)\b/i;
            // Known helper suffixes that are NOT icons
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
                    // This is an icon token - check if it's a real icon (not helper/style)
                    const iconName = tokenLower.replace(/^fa-/, "");
                    if (!styleTokens.has("fa-" + iconName) && !helperSuffixes.has(iconName)) {
                        hasValidIcon = true;
                    }
                }
            }

            return hasValidStyle && hasValidIcon;
        }

        function resolveBasicInfoIcon(item) {
            if (pickText(item?.iconMode, "preset") === "custom") {
                const customClass = pickText(item?.customIcon, "").trim();
                // Valid custom icon only if non-empty AND passes validation
                if (customClass && isValidFontAwesomeClass(customClass)) {
                    return customClass;
                }
                // Invalid or empty -> fall back to preset
            }
            return getBasicInfoIconByPreset(pickText(item?.iconPreset, ""));
        }

        function createEducation() {
            return { degree: "", school: "", period: "" };
        }

        function createSkillGroup() {
            return { name: "", items: [] };
        }

        function createExperience() {
            return { title: "", company: "", period: "", highlight: false, bullets: [] };
        }

        function createProject() {
            return { name: "", badge: "", badgeStyle: "secondary", description: "", techs: [] };
        }

        function cloneData(data) {
            return JSON.parse(JSON.stringify(data));
        }

        function hasOwn(objectValue, key) {
            return Object.hasOwn(objectValue, key);
        }

        function pickText(value, fallback = "") {
            if (typeof value !== "string") {
                return fallback;
            }
            return value;
        }

        function pickArray(value) {
            return Array.isArray(value) ? value : [];
        }

        function linesToArray(value) {
            return String(value ?? "")
                .split(/\r?\n/)
                .map((item) => item.trim())
                .filter(Boolean);
        }

        function normalizeStringArray(value) {
            if (Array.isArray(value)) {
                return value.map((item) => pickText(item, "").trim()).filter(Boolean);
            }
            if (typeof value === "string") {
                return linesToArray(value);
            }
            return [];
        }

        function arrayToLines(value) {
            return normalizeStringArray(value).join("\n");
        }

        const escapeMap = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        function escapeHtml(value) {
            return String(value ?? "").replace(/[&<>"']/g, (char) => escapeMap[char]);
        }

        function getAvatarImageSource(value) {
            const image = pickText(value, "").trim();
            return /^data:image\/(png|jpeg|webp);/i.test(image) ? image : FALLBACK_AVATAR;
        }

        function hasCustomAvatarImage(value) {
            return /^data:image\/(png|jpeg|webp);/i.test(pickText(value, "").trim());
        }

        function syncAvatarEditorUI() {
            const editorState = getAvatarEditorState();
            const avatarMinZoom = avatarCropState ? getAvatarEditorMinZoom(editorState.imageMeta) : 1;
            const avatarFrame = normalizeAvatarFrame(editorState.frame, editorState.imageMeta, avatarMinZoom);
            const dragSurface = formRoot.querySelector('[data-avatar-drag-surface="true"]');
            const editorImage = formRoot.querySelector('[data-avatar-editor-image="true"]');
            const zoomReadout = formRoot.querySelector('[data-testid="avatar-zoom-readout"]');
            const zoomControl = formRoot.querySelector('[data-testid="avatar-zoom-control"]');
            const confirmButton = formRoot.querySelector('[data-testid="avatar-crop-confirm"]');
            const feedback = formRoot.querySelector('[data-testid="avatar-crop-feedback"]');
            const canConfirmCrop = avatarFrame.zoom >= 1;
            const frameLabel = getAvatarFrameLabel(resumeData.avatarShape);

                if (avatarCropState && editorImage?.naturalWidth && editorImage?.naturalHeight) {
                    avatarCropState.imageMeta = {
                        width: editorImage.naturalWidth,
                        height: editorImage.naturalHeight
                    };
                    if (avatarCropState.imageSrc) {
                        avatarImageMetaCache.set(avatarCropState.imageSrc, avatarCropState.imageMeta);
                    }
                    avatarCropState.frame = normalizeAvatarFrame(avatarCropState.frame, avatarCropState.imageMeta, getAvatarEditorMinZoom(avatarCropState.imageMeta));
                }

            if (dragSurface) {
                dragSurface.dataset.avatarOffsetX = String(avatarFrame.offsetX);
                dragSurface.dataset.avatarOffsetY = String(avatarFrame.offsetY);
            }
            if (editorImage) {
                editorImage.style.cssText = getAvatarImageStyle(
                    avatarFrame,
                    avatarCropState?.imageMeta || editorState.imageMeta,
                    avatarCropState ? AVATAR_CROP_FRAME_RATIO : 1,
                    avatarMinZoom
                );
            }
            if (zoomReadout) {
                zoomReadout.textContent = `当前缩放 ${avatarFrame.zoom.toFixed(2)}x`;
            }
            if (zoomControl) {
                zoomControl.min = String(avatarMinZoom);
                zoomControl.value = String(avatarFrame.zoom);
            }
            if (confirmButton) {
                confirmButton.disabled = !canConfirmCrop;
                confirmButton.textContent = "应用头像";
                confirmButton.className = canConfirmCrop
                    ? "flex-1 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold whitespace-nowrap text-white shadow-lg shadow-slate-900/20 transition-transform hover:-translate-y-0.5"
                    : "flex-1 cursor-not-allowed rounded-2xl bg-slate-200 px-4 py-3 text-sm font-semibold whitespace-nowrap text-slate-400";
            }
            if (feedback) {
                feedback.className = canConfirmCrop
                    ? "rounded-2xl border border-emerald-100 bg-emerald-50/80 px-4 py-3 text-xs leading-5 text-emerald-700"
                    : "rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-700";
                feedback.innerHTML = canConfirmCrop
                    ? '<p class="font-semibold">当前范围可直接应用。</p><p class="mt-1">如果想让头像更饱满，可以继续放大或拖动后再应用。</p>'
                    : `<p class="font-semibold">还不能应用</p><p class="mt-1">白色${frameLabel}里还有空白区域。请继续放大，直到${frameLabel}被图片完全填满。</p>`;
            }
        }

        function normalizeResumeData(rawData) {
            const raw = rawData && typeof rawData === "object" ? rawData : {};
            const fallback = sampleResumeData;

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
                avatarImageMetaCache.set(profileImage, normalizedAvatarImageMeta);
            }

            return {
                documentTitle: hasOwn(raw, "documentTitle") ? pickText(raw.documentTitle, "") : fallback.documentTitle,
                resumeLayout: hasOwn(raw, "resumeLayout") ? normalizeResumeLayout(raw.resumeLayout) : normalizeResumeLayout(fallback.resumeLayout),
                resumeTheme: hasOwn(raw, "resumeTheme") ? normalizeResumeTheme(raw.resumeTheme) : normalizeResumeTheme(fallback.resumeTheme),
				useFlatIcons: hasOwn(raw, "useFlatIcons") ? Boolean(raw.useFlatIcons) : true,
				iconPalette: hasOwn(raw, "iconPalette") ? pickText(raw.iconPalette, "macaron") : "macaron",
				skillBadgeColor: hasOwn(raw, "skillBadgeColor") ? pickText(raw.skillBadgeColor, "theme") : "theme",
                profileImage: hasProfileImage ? profileImage : "",
                avatarImageMeta: normalizedAvatarImageMeta,
                avatarFrame: hasProfileImage
                    ? (hasOwn(raw, "avatarFrame") ? normalizeAvatarFrame(raw.avatarFrame, normalizedAvatarImageMeta) : createDefaultAvatarFrame())
                    : createDefaultAvatarFrame(),
                avatarShape: hasOwn(raw, "avatarShape") ? normalizeAvatarShape(raw.avatarShape) : normalizeAvatarShape(fallback.avatarShape),
                name: hasOwn(raw, "name") ? pickText(raw.name, "") : fallback.name,
                role: hasOwn(raw, "role") ? pickText(raw.role, "") : fallback.role,
                summary: hasOwn(raw, "summary") ? pickText(raw.summary, "") : fallback.summary,
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
                experiences: pickArray(experiencesSource).map((item) => ({
                    title: pickText(item?.title, ""),
                    company: pickText(item?.company, ""),
                    period: pickText(item?.period, ""),
                    highlight: Boolean(item?.highlight),
                    bullets: normalizeStringArray(item?.bullets)
                })),
                projects: pickArray(projectsSource).map((item) => ({
                    name: pickText(item?.name, ""),
                    badge: pickText(item?.badge, ""),
                    badgeStyle: pickText(item?.badgeStyle, "secondary") === "primary" ? "primary" : "secondary",
                    description: pickText(item?.description, ""),
                    techs: normalizeStringArray(item?.techs)
                }))
            };
        }

        let resumeData = normalizeResumeData(cloneData(sampleResumeData));
		let panelState = {
            profile: false,      // 个人信息
            theme: true,         // 主题与头像
            contact: true,       // 联系方式
            education: true,     // 教育背景
            skills: true,        // 专业技能
            experiences: true,   // 工作经历
            projects: true       // 项目经验
        };
        const formRoot = document.getElementById("form-root");
        const resumeRoot = document.getElementById("resume-root");
        const statusText = document.getElementById("form-status");
        const resetButton = document.getElementById("reset-data");
        const exportButton = document.getElementById("export-data");
        const importButton = document.getElementById("import-data");
        const importFileInput = document.getElementById("import-file");
        const printButton = document.getElementById("print-pdf");
        let activeBasicInfoPickerIndex = -1;
        let basicInfoSortable = null;
        let lastExportedJson = "";
        let avatarDragState = null;
        let avatarCropState = null;
        let activeRenderMode = RENDER_MODE_SCREEN;
        let avatarSidecarPersistedValue = "";
        let avatarSidecarDesiredValue = "";
        let avatarSidecarSyncInFlight = false;
        let avatarSidecarSyncQueue = Promise.resolve(true);

        // Dirty state tracking
        let lastPersistedSnapshot = null;

        function getCleanSnapshot() {
            return lastPersistedSnapshot;
        }

        function setCleanSnapshot(snapshot) {
            lastPersistedSnapshot = snapshot ? JSON.parse(JSON.stringify(snapshot)) : null;
        }

        function isDirty() {
            if (lastPersistedSnapshot === null) {
                return false;
            }
            const currentSerialized = JSON.stringify(resumeData);
            const snapshotSerialized = JSON.stringify(lastPersistedSnapshot);
            return currentSerialized !== snapshotSerialized;
        }

        const inputClass = "mt-1.5 w-full rounded-xl border-2 border-transparent bg-slate-100 px-4 py-2.5 text-sm text-slate-800 transition-all placeholder:text-slate-400 hover:bg-slate-200/60 focus:bg-white focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10";
        
        const textareaClass = "mt-1.5 w-full rounded-xl border-2 border-transparent bg-slate-100 px-4 py-2.5 text-sm text-slate-800 min-h-[100px] transition-all placeholder:text-slate-400 hover:bg-slate-200/60 focus:bg-white focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10";

        // 🌟 重构：极简且带有自动淡出动画的状态提示
        let statusTimer = null;
        function setStatus(message, type = "info") {
            const statusText = document.getElementById("form-status");
            if (!statusText) return;

            let colorClass = "text-slate-500";
            let icon = '<i class="fas fa-info-circle mr-1"></i>';
            
            if (type === "success") {
                colorClass = "text-emerald-600";
                icon = '<i class="fas fa-check-circle mr-1"></i>';
            } else if (type === "error") {
                colorClass = "text-rose-600";
                icon = '<i class="fas fa-exclamation-triangle mr-1"></i>';
            }

            // 直接用 Tailwind 赋予它极小、精致的排版，并开启透明度过渡动画
            statusText.className = `truncate text-[10px] font-bold tracking-wide transition-opacity duration-300 ${colorClass}`;
            statusText.innerHTML = `${icon} ${message}`;
            
            // 出现
            statusText.style.opacity = '1';
            
            // 核心魔法：3 秒后自动淡出消失！绝不长时间占用视觉空间！
            if (statusTimer) clearTimeout(statusTimer);
            statusTimer = setTimeout(() => {
                statusText.style.opacity = '0';
            }, 3000);
        }

        function getDraftAvatarValue(value) {
            const image = pickText(value, "").trim();
            return hasCustomAvatarImage(image) ? image : "";
        }

        function buildDraftStoragePayload(data) {
            const draftData = cloneData(data);
            const avatarValue = getDraftAvatarValue(draftData.profileImage);
            const hasAvatarSidecar = Boolean(avatarValue);

            if (hasAvatarSidecar) {
                draftData.profileImage = DRAFT_AVATAR_SENTINEL;
            }

            return {
                version: DRAFT_STORAGE_VERSION,
                hasAvatarSidecar,
                data: draftData
            };
        }

        function parseDraftStoragePayload(raw) {
            const parsed = JSON.parse(raw);

            if (parsed && typeof parsed === "object" && typeof parsed.version === "number" && parsed.version > DRAFT_STORAGE_VERSION) {
                throw new Error("草稿版本过新，当前版本暂不支持读取");
            }

            if (parsed && typeof parsed === "object" && parsed.version === DRAFT_STORAGE_VERSION && parsed.data && typeof parsed.data === "object") {
                const draftData = cloneData(parsed.data);
                const hasAvatarSidecar = Boolean(parsed.hasAvatarSidecar) || pickText(draftData.profileImage, "") === DRAFT_AVATAR_SENTINEL;

                if (pickText(draftData.profileImage, "") === DRAFT_AVATAR_SENTINEL) {
                    draftData.profileImage = "";
                }

                return {
                    draftData,
                    hasAvatarSidecar,
                    needsUpgrade: false
                };
            }

            return {
                draftData: parsed,
                hasAvatarSidecar: false,
                needsUpgrade: hasCustomAvatarImage(parsed?.profileImage)
            };
        }

        function openAvatarSidecarDatabase() {
            return new Promise((resolve, reject) => {
                if (typeof indexedDB === "undefined") {
                    reject(new Error("当前浏览器不支持 IndexedDB"));
                    return;
                }

                const request = indexedDB.open(AVATAR_SIDECAR_DB_NAME, 1);

                request.onupgradeneeded = () => {
                    const database = request.result;
                    if (!database.objectStoreNames.contains(AVATAR_SIDECAR_STORE_NAME)) {
                        database.createObjectStore(AVATAR_SIDECAR_STORE_NAME);
                    }
                };

                request.onsuccess = () => {
                    resolve(request.result);
                };

                request.onerror = () => {
                    reject(request.error || new Error("打开头像草稿缓存失败"));
                };
            });
        }

        function readAvatarSidecar() {
            return openAvatarSidecarDatabase().then((database) => new Promise((resolve, reject) => {
                const transaction = database.transaction(AVATAR_SIDECAR_STORE_NAME, "readonly");
                const store = transaction.objectStore(AVATAR_SIDECAR_STORE_NAME);
                const request = store.get(AVATAR_SIDECAR_RECORD_KEY);

                const closeDatabase = () => {
                    try {
                        database.close();
                    } catch (_error) {
                        // Ignore close failures.
                    }
                };

                transaction.oncomplete = closeDatabase;
                transaction.onabort = () => {
                    closeDatabase();
                    reject(transaction.error || request.error || new Error("读取头像草稿缓存失败"));
                };

                request.onsuccess = () => {
                    const record = request.result;
                    resolve(record && typeof record === "object"
                        ? pickText(record.profileImage, "")
                        : pickText(record, ""));
                };

                request.onerror = () => {
                    closeDatabase();
                    reject(request.error || new Error("读取头像草稿缓存失败"));
                };
            }));
        }

        function writeAvatarSidecar(profileImage) {
            return openAvatarSidecarDatabase().then((database) => new Promise((resolve, reject) => {
                const transaction = database.transaction(AVATAR_SIDECAR_STORE_NAME, "readwrite");
                const store = transaction.objectStore(AVATAR_SIDECAR_STORE_NAME);
                const request = store.put({ profileImage: pickText(profileImage, "") }, AVATAR_SIDECAR_RECORD_KEY);

                const closeDatabase = () => {
                    try {
                        database.close();
                    } catch (_error) {
                        // Ignore close failures.
                    }
                };

                transaction.oncomplete = () => {
                    closeDatabase();
                    resolve(true);
                };
                transaction.onabort = () => {
                    closeDatabase();
                    reject(transaction.error || request.error || new Error("写入头像草稿缓存失败"));
                };
                request.onerror = () => {
                    closeDatabase();
                    reject(request.error || new Error("写入头像草稿缓存失败"));
                };
            }));
        }

        function clearAvatarSidecar() {
            return openAvatarSidecarDatabase().then((database) => new Promise((resolve, reject) => {
                const transaction = database.transaction(AVATAR_SIDECAR_STORE_NAME, "readwrite");
                const store = transaction.objectStore(AVATAR_SIDECAR_STORE_NAME);
                const request = store.delete(AVATAR_SIDECAR_RECORD_KEY);

                const closeDatabase = () => {
                    try {
                        database.close();
                    } catch (_error) {
                        // Ignore close failures.
                    }
                };

                transaction.oncomplete = () => {
                    closeDatabase();
                    resolve(true);
                };
                transaction.onabort = () => {
                    closeDatabase();
                    reject(transaction.error || request.error || new Error("清理头像草稿缓存失败"));
                };
                request.onerror = () => {
                    closeDatabase();
                    reject(request.error || new Error("清理头像草稿缓存失败"));
                };
            }));
        }

        function primeAvatarSidecarState(persistedValue = "", desiredValue = persistedValue) {
            avatarSidecarPersistedValue = getDraftAvatarValue(persistedValue);
            avatarSidecarDesiredValue = getDraftAvatarValue(desiredValue);
        }

        function syncAvatarSidecar(options = {}) {
            const nextAvatarValue = getDraftAvatarValue(resumeData.profileImage);
            avatarSidecarDesiredValue = nextAvatarValue;

            if (!avatarSidecarSyncInFlight && avatarSidecarPersistedValue === avatarSidecarDesiredValue) {
                return avatarSidecarSyncQueue;
            }

            const saveWarningMessage = pickText(options.avatarWarningMessage, "头像已更新，但浏览器未能持久化头像图片，刷新后可能丢失；建议立即导出 JSON 备份。");
            const clearWarningMessage = pickText(options.avatarClearWarningMessage, "头像已从当前简历移除，但浏览器未能更新头像缓存；刷新后可能仍会出现旧头像。");

            avatarSidecarSyncQueue = avatarSidecarSyncQueue
                .catch(() => false)
                .then(async () => {
                    if (avatarSidecarPersistedValue === avatarSidecarDesiredValue) {
                        return true;
                    }

                    avatarSidecarSyncInFlight = true;
                    const targetValue = avatarSidecarDesiredValue;

                    try {
                        if (targetValue) {
                            await writeAvatarSidecar(targetValue);
                        } else {
                            await clearAvatarSidecar();
                        }

                        avatarSidecarPersistedValue = targetValue;
                        return true;
                    } catch (error) {
                        console.warn("保存头像草稿失败：", error);
                        if (options.showAvatarWarning !== false) {
                            setStatus(targetValue ? saveWarningMessage : clearWarningMessage, "error");
                        }
                        return false;
                    } finally {
                        avatarSidecarSyncInFlight = false;
                    }
                });

            return avatarSidecarSyncQueue;
        }

        async function hydrateAvatarStateIfNeeded(targetData) {
            if (!targetData || typeof targetData !== "object") {
                return false;
            }

            const profileImage = getDraftAvatarValue(targetData.profileImage);
            if (!profileImage) {
                targetData.profileImage = "";
                targetData.avatarImageMeta = null;
                targetData.avatarFrame = createDefaultAvatarFrame();
                return false;
            }

            const normalizedMeta = normalizeAvatarImageMeta(targetData.avatarImageMeta);
            if (normalizedMeta) {
                targetData.avatarImageMeta = normalizedMeta;
                targetData.avatarFrame = normalizeAvatarFrame(targetData.avatarFrame, normalizedMeta);
                avatarImageMetaCache.set(profileImage, normalizedMeta);
                return false;
            }

            try {
                const resolvedMeta = normalizeAvatarImageMeta(await loadAvatarImageMeta(profileImage));
                if (resolvedMeta) {
                    targetData.avatarImageMeta = resolvedMeta;
                    targetData.avatarFrame = normalizeAvatarFrame(targetData.avatarFrame, resolvedMeta);
                    avatarImageMetaCache.set(profileImage, resolvedMeta);
                    return true;
                }
            } catch (error) {
                console.warn("补充头像尺寸信息失败：", error);
            }

            targetData.avatarImageMeta = null;
            targetData.avatarFrame = createDefaultAvatarFrame();
            return false;
        }

        function saveDraft(options = {}) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(buildDraftStoragePayload(resumeData)));
                setCleanSnapshot(resumeData);
                if (options.syncAvatarSidecar !== false) {
                    syncAvatarSidecar(options);
                }
                return true;
            } catch (error) {
                console.warn("保存草稿失败：", error);
                return false;
            }
        }

        async function loadDraft() {
            try {
                const raw = localStorage.getItem(STORAGE_KEY);
                if (!raw) {
                    return null;
                }

                const { draftData, hasAvatarSidecar, needsUpgrade } = parseDraftStoragePayload(raw);
                const normalizedDraft = normalizeResumeData(draftData);
                let avatarRestored = false;
                let avatarRestoreWarning = "";

                if (hasAvatarSidecar) {
                    try {
                        const avatarValue = await readAvatarSidecar();
                        if (hasCustomAvatarImage(avatarValue)) {
                            normalizedDraft.profileImage = avatarValue;
                            avatarRestored = true;
                            if (normalizedDraft.avatarImageMeta) {
                                avatarImageMetaCache.set(avatarValue, normalizedDraft.avatarImageMeta);
                            }
                        } else {
                            avatarRestoreWarning = "已恢复文本草稿，但头像缓存未找回；如需恢复头像，请重新上传或导入已导出的 JSON。";
                        }
                    } catch (error) {
                        console.warn("读取头像草稿缓存失败：", error);
                        avatarRestoreWarning = "已恢复文本草稿，但头像缓存未找回；如需恢复头像，请重新上传或导入已导出的 JSON。";
                    }
                }

                await hydrateAvatarStateIfNeeded(normalizedDraft);

                return {
                    data: normalizedDraft,
                    avatarRestored,
                    avatarRestoreWarning,
                    needsUpgrade
                };
            } catch (error) {
                console.warn("读取草稿失败：", error);
                return null;
            }
        }

        function removeItem(list, index) {
            if (!Array.isArray(list)) {
                return;
            }
            if (index < 0 || index >= list.length) {
                return;
            }
            list.splice(index, 1);
        }

        function moveItem(list, fromIndex, toIndex) {
            if (!Array.isArray(list)) {
                return;
            }
            if (fromIndex < 0 || fromIndex >= list.length) {
                return;
            }
            if (toIndex < 0 || toIndex >= list.length || fromIndex === toIndex) {
                return;
            }
            const [moved] = list.splice(fromIndex, 1);
            list.splice(toIndex, 0, moved);
        }

        function renderBasicForm() {
            // 1. 头像与主题状态
            const hasUploadedAvatar = hasCustomAvatarImage(resumeData.profileImage);
            const avatarShape = normalizeAvatarShape(resumeData.avatarShape);
            const activeLayout = normalizeResumeLayout(resumeData.resumeLayout);
            const activeTheme = normalizeResumeTheme(resumeData.resumeTheme);
            
            const isProfileCollapsed = panelState.profile;
            const isThemeCollapsed = panelState.theme;

            // 2. 🌟 预渲染联系方式区块 (合并进来的逻辑)
            const contactBlocks = resumeData.basicInfo.map((item, index) => {
                const iconClass = resolveBasicInfoIcon(item);
                const showPicker = activeBasicInfoPickerIndex === index;
                const disableUp = index === 0;
                const disableDown = index === resumeData.basicInfo.length - 1;
                
                const currentColorOverride = item.iconColor || "theme";
                const globalPaletteKey = resumeData.iconPalette || "theme";
                const finalColorKey = resolveIconColorTone(index, currentColorOverride, globalPaletteKey);

                const iconBtnHtml = renderDynamicIcon(iconClass, finalColorKey, "h-7 w-7 rounded-md text-[12px]", "transition-transform group-hover/icon:scale-105");

                return `
                    <div class="form-item basic-info-item group relative rounded-2xl border border-slate-100 bg-white p-3 shadow-[0_2px_10px_rgba(15,23,42,0.02)] transition-all hover:border-slate-200 hover:shadow-[0_4px_16px_rgba(15,23,42,0.04)]" data-index="${index}">
                        <div class="mb-2.5 flex items-center justify-between">
                            <div class="flex items-center gap-1.5">
                                <button type="button" class="basic-info-drag-handle flex h-6 w-6 cursor-grab items-center justify-center rounded-md text-slate-300 transition-colors hover:bg-slate-100 hover:text-slate-600 active:cursor-grabbing" title="拖拽排序"><i class="fas fa-grip-vertical text-[11px]"></i></button>
                                <p class="text-[13px] font-extrabold text-slate-700">${escapeHtml(item.label)}</p>
                            </div>
                            <div class="flex items-center gap-0.5 opacity-40 transition-opacity group-hover:opacity-100">
                                <button type="button" data-action="move-basic-info-up" data-index="${index}" ${disableUp ? "disabled" : ""} class="flex h-6 w-6 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:opacity-30 disabled:hover:bg-transparent" title="上移"><i class="fas fa-chevron-up text-[10px]"></i></button>
                                <button type="button" data-action="move-basic-info-down" data-index="${index}" ${disableDown ? "disabled" : ""} class="flex h-6 w-6 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:opacity-30 disabled:hover:bg-transparent" title="下移"><i class="fas fa-chevron-down text-[10px]"></i></button>
                            </div>
                        </div>
                        <div class="relative flex items-center overflow-visible rounded-xl border-2 border-transparent bg-slate-100 transition-all focus-within:border-blue-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10 hover:bg-slate-200/60 focus-within:hover:bg-white">
                            <button type="button" data-action="toggle-basic-info-picker" data-index="${index}" class="group/icon relative flex h-11 w-14 shrink-0 items-center justify-center gap-1 rounded-l-[10px] transition-colors hover:bg-slate-200/60 active:bg-slate-200">
                                ${iconBtnHtml}
                                <i class="fas fa-caret-down text-[10px] text-slate-400 transition-colors group-hover/icon:text-slate-600"></i>
                            </button>
                            <div class="h-5 w-px bg-slate-300/60"></div>
                            <input name="basic-info-value-${index}" class="h-11 w-full bg-transparent px-3 text-[13px] font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none" data-section="basicInfo" data-index="${index}" data-field="value" value="${escapeHtml(item.value)}" placeholder="请输入${escapeHtml(item.label)}内容">
                        </div>
                        ${showPicker ? `
                            <div class="mt-2.5 rounded-xl border border-slate-200/60 bg-slate-50 p-3 shadow-inner">
                                <div class="mb-4">
                                    <p class="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">图标颜色 (单独强制覆盖此图标)</p>
                                    <div class="flex flex-wrap gap-2">
                                        ${BASIC_INFO_COLORS.map(color => {
                                            const isActive = currentColorOverride === color.key;
                                            const ring = isActive ? "ring-2 ring-offset-1 ring-blue-400" : "hover:scale-110";
                                            if (color.key === "theme") return `<button type="button" data-action="set-basic-info-color" data-index="${index}" data-color="theme" class="relative flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition-all ${ring}" title="${color.label}"><div class="h-4 w-4 rounded-full bg-theme opacity-80"></div></button>`;
                                            return `<button type="button" data-action="set-basic-info-color" data-index="${index}" data-color="${color.key}" class="h-6 w-6 rounded-full ${color.bg} border border-white shadow-sm transition-all ${ring}" title="${color.label}"><div class="h-full w-full rounded-full ${color.bg}"></div></button>`;
                                        }).join("")}
                                    </div>
                                </div>
                                <p class="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">更换图标</p>
                                <div class="grid grid-cols-4 gap-1">${renderBasicInfoPicker(index, item.iconPreset, item.iconMode)}</div>
                                <div class="mt-3 flex items-center justify-between border-t border-slate-200/60 pt-3">
                                    <div class="flex gap-1">
                                        <button type="button" data-action="set-basic-info-mode" data-index="${index}" data-mode="preset" class="rounded-md border px-2.5 py-1 text-[10px] font-bold transition-colors ${item.iconMode === "preset" ? "border-blue-400 bg-white text-blue-700 shadow-sm" : "border-slate-200 bg-transparent text-slate-500 hover:bg-white hover:text-slate-700"}">预设图标</button>
                                        <button type="button" data-action="set-basic-info-mode" data-index="${index}" data-mode="custom" class="rounded-md border px-2.5 py-1 text-[10px] font-bold transition-colors ${item.iconMode === "custom" ? "border-blue-400 bg-white text-blue-700 shadow-sm" : "border-slate-200 bg-transparent text-slate-500 hover:bg-white hover:text-slate-700"}">高级自定义</button>
                                    </div>
                                </div>
                                ${item.iconMode === "custom" ? `
                                    <div class="mt-2">
                                        <input name="basic-info-custom-icon-${index}" class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100" data-section="basicInfo" data-index="${index}" data-field="customIcon" value="${escapeHtml(item.customIcon)}" placeholder="Font Awesome 类名，如：fas fa-star">
                                    </div>
                                ` : ""}
                            </div>
                        ` : ""}
                    </div>
                `;
            }).join("");

            return `
                <!-- 1. 大满贯：个人信息面板 (包含基础信息、头像、联系方式) -->
                <section class="form-section !p-0 overflow-hidden">
                    <button type="button" data-action="toggle-section" data-section-id="profile" class="flex w-full items-center justify-between p-4 transition-colors outline-none">
                        <div class="flex items-center gap-2">
                            <i class="fas fa-chevron-down text-[12px] text-slate-400 transition-transform duration-200 ${isProfileCollapsed ? '-rotate-90' : ''}"></i>
                            <h2 class="text-sm font-extrabold text-slate-900">个人信息</h2>
                        </div>
                    </button>
                    <div class="px-4 pb-6 transition-all ${isProfileCollapsed ? 'hidden' : 'block'}">
                        
                        <!-- 头像设置 -->
                        <div class="rounded-xl bg-slate-50/70 p-4 border border-slate-100 mb-4">
                            <p class="text-[13px] font-bold text-slate-700">头像设置</p>
                            <div class="mt-3 grid gap-2 sm:grid-cols-2">
                                <input id="avatar-upload-input-control" name="profileImageUpload" type="file" accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp" class="hidden" data-testid="avatar-upload-input">
                                <label for="avatar-upload-input-control" class="flex cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:text-blue-600 hover:bg-blue-50">
                                    <i class="fas fa-cloud-upload-alt mr-1.5"></i> 上传头像
                                </label>
                                <button type="button" data-action="open-avatar-cropper" ${hasUploadedAvatar ? '' : 'disabled'} class="flex items-center justify-center rounded-lg px-3 py-2 text-xs font-bold transition-all ${hasUploadedAvatar ? 'border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:text-blue-600 hover:bg-blue-50' : 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400'}">
                                    <i class="fas fa-crop-alt mr-1.5"></i> 调整头像
                                </button>
                            </div>
                            <div class="mt-3 flex items-center justify-between border-t border-slate-200/60 pt-3">
                                <p class="text-[11px] font-semibold text-slate-500">展示形状</p>
                                <div class="flex gap-2">
                                    <button type="button" data-action="set-avatar-shape" data-shape="circle" class="rounded-md border px-3 py-1 text-[11px] font-bold transition-colors ${avatarShape === AVATAR_SHAPE_CIRCLE ? 'border-blue-400 bg-blue-50 text-blue-700 ring-1 ring-blue-400' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}">圆形</button>
                                    <button type="button" data-action="set-avatar-shape" data-shape="rectangle" class="rounded-md border px-3 py-1 text-[11px] font-bold transition-colors ${avatarShape === AVATAR_SHAPE_RECTANGLE ? 'border-blue-400 bg-blue-50 text-blue-700 ring-1 ring-blue-400' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}">矩形</button>
                                </div>
                            </div>
                        </div>

                        <!-- 基础文本输入 -->
                        <div class="grid gap-4">
                            <label class="block text-xs font-semibold text-gray-600">
                                文档标题
                                <input name="documentTitle" class="${inputClass}" data-section="basic" data-field="documentTitle" value="${escapeHtml(resumeData.documentTitle)}">
                            </label>
                            <label class="block text-xs font-semibold text-gray-600">
                                姓名
                                <input name="name" class="${inputClass}" data-section="basic" data-field="name" value="${escapeHtml(resumeData.name)}">
                            </label>
                            <label class="block text-xs font-semibold text-gray-600">
                                目标岗位
                                <input name="role" class="${inputClass}" data-section="basic" data-field="role" value="${escapeHtml(resumeData.role)}">
                            </label>
                            <label class="block text-xs font-semibold text-gray-600">
                                个人简介
                                <textarea name="summary" class="${textareaClass}" data-section="basic" data-field="summary">${escapeHtml(resumeData.summary)}</textarea>
                            </label>
                        </div>

                        <!-- 🌟 融合进来且支持独立折叠的联系方式模块 -->
                        <div class="mt-6 border-t border-slate-200/80 pt-5">
                            
                            <!-- 可点击折叠的标题栏 -->
                            <button type="button" data-action="toggle-section" data-section-id="contact" class="flex w-full items-center justify-between outline-none group/contact pb-2">
                                <div class="flex items-center gap-2">
                                    <i class="fas fa-chevron-down text-[10px] text-slate-400 transition-transform duration-200 ${panelState.contact ? '-rotate-90' : ''} group-hover/contact:text-slate-600"></i>
                                    <p class="text-[13px] font-bold text-slate-700 group-hover/contact:text-slate-900 transition-colors">联系方式</p>
                                </div>
                                <!-- 拖拽提示小徽章，只有在展开时才显示，保持折叠时极致清爽 -->
                                <span class="rounded-full bg-slate-100/80 px-2.5 py-1 text-[9px] font-bold text-slate-400 border border-slate-200/50 transition-opacity duration-200 ${panelState.contact ? 'opacity-0' : 'opacity-100'}">支持拖拽排序</span>
                            </button>

                            <!-- 🌟 联系方式列表内容 (根据状态折叠或展开) -->
                            <div class="transition-all duration-300 overflow-hidden ${panelState.contact ? 'h-0 opacity-0 pointer-events-none mt-0' : 'h-auto opacity-100 mt-3'}">
                                <div id="basic-info-list" class="grid gap-3 pb-2">
                                    ${contactBlocks}
                                </div>
                            </div>

                        </div>
                    </div>
                </section>

                <!-- 2. 简历排版与主题面板 -->
                <section class="form-section !p-0 overflow-hidden">
                    <button type="button" data-action="toggle-section" data-section-id="theme" class="flex w-full items-center justify-between p-4 transition-colors outline-none">
                        <div class="flex items-center gap-2">
                            <i class="fas fa-chevron-down text-[12px] text-slate-400 transition-transform duration-200 ${isThemeCollapsed ? '-rotate-90' : ''}"></i>
                            <h2 class="text-sm font-extrabold text-slate-900">简历排版与主题</h2>
                        </div>
                    </button>
                    <div class="px-4 pb-6 transition-all ${isThemeCollapsed ? 'hidden' : 'block'}">
                        <div class="rounded-xl bg-slate-50 p-4 border border-slate-100">

                            <!-- 预览排版 -->
                            <div class="mb-5">
                                <div class="flex items-center justify-between mb-2.5">
                                    <div>
                                        <p class="text-[12px] font-bold text-slate-700">预览版式</p>
                                        <p class="text-[9px] text-slate-400 font-medium mt-0.5">使用同一份简历数据切换经典 / 卡片排版</p>
                                    </div>
                                </div>
                                <div class="flex flex-wrap gap-2">
                                    ${RESUME_LAYOUT_OPTIONS.map((layout) => {
                                        const isActive = activeLayout === layout.key;
                                        return `<button type="button" data-action="set-resume-layout" data-layout="${layout.key}" class="flex items-center gap-2 rounded-lg border px-3 py-2 text-[11px] font-bold transition-all ${isActive ? 'border-blue-400 bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-400' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300'}"><span class="inline-flex h-2.5 w-2.5 rounded-full ${layout.key === RESUME_LAYOUT_CLASSIC ? 'bg-slate-400' : 'bg-blue-400'}"></span>${layout.label}</button>`;
                                    }).join("")}
                                </div>
                            </div>

                            <!-- 全局主色调 -->
                            <div class="border-t border-slate-200/60 pt-4 mb-5">
                                <div class="flex items-center justify-between mb-3">
                                    <p class="text-[13px] font-bold text-slate-700">简历主题主色</p>
                                </div>
                                <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">纯粹单色</p>
                                <div class="flex flex-wrap gap-2 mb-3.5">
                                    ${RESUME_THEME_OPTIONS.filter(t => t.type === "solid").map((theme) => {
                                        const isActive = activeTheme === theme.key;
                                        return `<button type="button" data-action="set-resume-theme" data-theme="${theme.key}" class="h-6 w-6 rounded-full shadow-sm border border-slate-200/50 transition-all ${isActive ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'hover:scale-110 hover:shadow-md'}" style="background: ${theme.swatch};" title="${theme.label}"></button>`;
                                    }).join("")}
                                </div>
                                <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">设计感双拼</p>
                                <div class="flex flex-wrap gap-2">
                                    ${RESUME_THEME_OPTIONS.filter(t => t.type === "gradient").map((theme) => {
                                        const isActive = activeTheme === theme.key;
                                        return `<button type="button" data-action="set-resume-theme" data-theme="${theme.key}" class="h-6 w-6 rounded-full shadow-sm border border-slate-200/50 transition-all ${isActive ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'hover:scale-110 hover:shadow-md'}" style="background: ${theme.swatch};" title="${theme.label}"></button>`;
                                    }).join("")}
                                </div>
                            </div>

                            <!-- 图标色彩风格选择 -->
                            <div class="border-t border-slate-200/60 pt-4">
                                <div class="flex items-center justify-between mb-2.5">
                                    <div>
                                        <p class="text-[12px] font-bold text-slate-700">基本信息图标配色</p>
                                        <p class="text-[9px] text-slate-400 font-medium mt-0.5">智能无限循环取色</p>
                                    </div>
                                </div>
                                <div class="flex flex-wrap gap-2">
                                    ${ICON_PALETTE_OPTIONS.map(palette => {
                                        const isActive = (resumeData.iconPalette || "theme") === palette.key;
                                        const previewDots = palette.preview.map(color => `<span class="h-2.5 w-2.5 rounded-full border border-white/50" style="background-color: ${color};"></span>`).join('');
                                        return `<button type="button" data-action="set-icon-palette" data-palette="${palette.key}" class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition-all ${isActive ? 'border-blue-400 bg-blue-50 text-blue-700 shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300'}"><div class="flex -space-x-1">${previewDots}</div>${palette.label}</button>`;
                                    }).join("")}
                                </div>
                            </div>

                            <!-- 技能标签色彩风格 -->
                            <div class="border-t border-slate-200/60 pt-4 mt-4">
                                <div class="flex items-center justify-between mb-2.5">
                                    <div>
                                        <p class="text-[12px] font-bold text-slate-700">专业技能标签配色</p>
                                        <p class="text-[9px] text-slate-400 font-medium mt-0.5">控制简历中技能方块的风格</p>
                                    </div>
                                </div>
                                <div class="flex flex-wrap gap-2">
                                    ${[
                                        { key: "theme-soft", label: "主题浅色", class: "bg-blue-50 text-blue-700 border-blue-200" }, 
                                        { key: "theme-outline", label: "主题描边", class: "bg-white text-blue-600 border-blue-400" },
                                        { key: "gray", label: "经典灰", class: "bg-gray-100 text-gray-700 border-gray-200" },
                                        { key: "slate", label: "石板灰", class: "bg-slate-100 text-slate-700 border-slate-200" },
                                        { key: "zinc", label: "深沉灰", class: "bg-zinc-100 text-zinc-700 border-zinc-200" }
                                    ].map(color => {
                                        const isActive = (resumeData.skillBadgeColor || "theme-soft") === color.key || (resumeData.skillBadgeColor === "theme" && color.key === "theme-soft");
                                        return `<button type="button" data-action="set-skill-badge-color" data-color="${color.key}" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-all ${isActive ? 'border-blue-400 bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-400' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}"><span class="h-2.5 w-2.5 rounded-full border ${color.class}"></span>${color.label}</button>`;
                                    }).join("")}
                                </div>
                            </div>

                            <!-- 时间轴排版细节开关 -->
                            <div class="border-t border-slate-200/60 pt-4 mt-4">
                                <div class="flex items-center justify-between mb-3">
                                    <div>
                                        <p class="text-[12px] font-bold text-slate-700">彩色时间轴竖线</p>
                                        <p class="text-[9px] text-slate-400 font-medium mt-0.5">工作经历竖线是否跟随后台主色</p>
                                    </div>
                                    <button type="button" data-action="toggle-theme-timeline" class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors ${resumeData.useThemeTimeline ? 'bg-blue-500' : 'bg-slate-300'}">
                                        <span class="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${resumeData.useThemeTimeline ? 'translate-x-4' : 'translate-x-0'}"></span>
                                    </button>
                                </div>
                                
                                <!-- 🌟 新增：立体/扁平图标开关 -->
                                <div class="flex items-center justify-between">
                                    <div>
                                        <p class="text-[12px] font-bold text-slate-700">极简扁平图标</p>
                                        <p class="text-[9px] text-slate-400 font-medium mt-0.5">开启后去除简历图标上的立体高光阴影</p>
                                    </div>
                                    <button type="button" data-action="toggle-flat-icons" class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors ${resumeData.useFlatIcons ? 'bg-blue-500' : 'bg-slate-300'}">
                                        <span class="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${resumeData.useFlatIcons ? 'translate-x-4' : 'translate-x-0'}"></span>
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>
                </section>
            `;
        }

        function renderBasicInfoPicker(index, selectedPreset, selectedMode) {
            return BASIC_INFO_ICON_OPTIONS.map((option) => {
                const isActive = selectedMode === "preset" && option.key === selectedPreset;
                return (`
                <button
                    type="button"
                    data-action="choose-basic-info-icon"
                    data-index="${index}"
                    data-icon-preset="${option.key}"
                    class="group flex flex-col items-center justify-center gap-1.5 rounded-xl p-2 transition-all ${isActive ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] ring-1 ring-blue-400' : 'hover:bg-slate-200/50'}"
                    title="${option.label}"
                >
                    <!-- 恢复独立的预设颜色 -->
                    <span class="flex h-8 w-8 items-center justify-center rounded-full shadow-sm transition-transform group-hover:scale-110 ${option.chipClass}">
                        <i class="${option.icon} text-sm"></i>
                    </span>
                    <span class="text-[10px] font-bold ${isActive ? 'text-blue-700' : 'text-slate-500'}">${option.label}</span>
                </button>
            `);
            }).join("");
        }

        // 原来的联系方式面板已废弃，合并到了个人信息中
        function renderBasicInfoForm() {
            return "";
        }

        function renderEducationForm() {
            const isCollapsed = panelState.education;
            const blocks = resumeData.education.map((item, index) => (`
                <div class="group relative rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.02)] transition-all hover:border-slate-200 hover:shadow-[0_4px_16px_rgba(15,23,42,0.04)]">
                    <div class="mb-4 flex items-center justify-between border-b border-slate-100/80 pb-3">
                        <div class="flex items-center gap-2.5">
                            <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 shadow-sm"><i class="fas fa-graduation-cap text-[12px]"></i></div>
                            <p class="text-[13px] font-bold text-slate-700">教育经历 ${index + 1}</p>
                        </div>
                        <button type="button" data-action="remove-education" data-index="${index}" class="flex h-7 w-7 items-center justify-center rounded-md text-slate-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100" title="删除"><i class="fas fa-trash text-[11px]"></i></button>
                    </div>
                    <div class="grid gap-3.5">
                        <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500">学位 / 专业<input name="education-degree-${index}" class="${inputClass}" data-section="education" data-index="${index}" data-field="degree" value="${escapeHtml(item.degree)}"></label>
                        <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500">学校<input name="education-school-${index}" class="${inputClass}" data-section="education" data-index="${index}" data-field="school" value="${escapeHtml(item.school)}"></label>
                        <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500">时间<input name="education-period-${index}" class="${inputClass}" data-section="education" data-index="${index}" data-field="period" value="${escapeHtml(item.period)}"></label>
                    </div>
                </div>
            `)).join("");

            return `
				<section class="form-section !p-0 overflow-hidden">
                    <div class="flex w-full items-center justify-between">
                        <!-- 让左侧的折叠按钮占满除了右侧小加号之外的所有空间，上下左右撑开热区 -->
                        <button type="button" data-action="toggle-section" data-section-id="education" class="flex flex-1 items-center gap-2 p-4 transition-colors outline-none text-left">
                            <i class="fas fa-chevron-down text-[12px] text-slate-400 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}"></i>
                            <h2 class="text-sm font-extrabold text-slate-900">教育背景</h2>
                        </button>
                        <!-- 右侧的新增按钮，利用 pr-4 对齐边缘 -->
                        <div class="pr-4 ${isCollapsed ? '' : 'hidden'}">
                            <button type="button" data-action="add-education" class="text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors z-10 relative">+ 新增</button>
                        </div>
                    </div>
                    <div class="px-4 pb-6 ${isCollapsed ? 'hidden' : 'block'}">
                        <div class="grid gap-3">${blocks}</div>
                        <button type="button" data-action="add-education" class="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-3 text-[12px] font-bold text-slate-500 transition-all hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600"><i class="fas fa-plus"></i> 新增教育经历</button>
                    </div>
                </section>
            `;
        }

        function renderSkillsForm() {
            const isCollapsed = panelState.skills;
            const blocks = resumeData.skills.map((item, index) => (`
                <div class="group relative rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.02)] transition-all hover:border-slate-200 hover:shadow-[0_4px_16px_rgba(15,23,42,0.04)]">
                    <div class="mb-4 flex items-center justify-between border-b border-slate-100/80 pb-3">
                        <div class="flex items-center gap-2.5">
                            <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 shadow-sm"><i class="fas fa-layer-group text-[12px]"></i></div>
                            <p class="text-[13px] font-bold text-slate-700">技能分组 ${index + 1}</p>
                        </div>
                        <button type="button" data-action="remove-skill" data-index="${index}" class="flex h-7 w-7 items-center justify-center rounded-md text-slate-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100" title="删除"><i class="fas fa-trash text-[11px]"></i></button>
                    </div>
                    <div class="grid gap-3.5">
                        <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500">分组名称<input name="skill-name-${index}" class="${inputClass}" data-section="skills" data-index="${index}" data-field="name" value="${escapeHtml(item.name)}"></label>
                        <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500">标签 <span class="text-[9px] font-medium text-slate-400 normal-case tracking-normal ml-1">（每行输入一个）</span><textarea name="skill-items-${index}" class="${textareaClass}" data-section="skills" data-index="${index}" data-field="items" data-multiline="true">${escapeHtml(arrayToLines(item.items))}</textarea></label>
                    </div>
                </div>
            `)).join("");

            return `
				<section class="form-section !p-0 overflow-hidden">
                    <!-- 头部标题栏 -->
                    <div class="flex w-full items-center justify-between">
                        <button type="button" data-action="toggle-section" data-section-id="skills" class="flex flex-1 items-center gap-2 p-4 transition-colors outline-none text-left">
                            <i class="fas fa-chevron-down text-[12px] text-slate-400 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}"></i>
                            <h2 class="text-sm font-extrabold text-slate-900">专业技能</h2>
                        </button>
                        <div class="pr-4 ${isCollapsed ? '' : 'hidden'}">
                            <button type="button" data-action="add-skill" class="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors z-10 relative">+ 新增</button>
                        </div>
                    </div>

                    <div class="px-4 pb-6 ${isCollapsed ? 'hidden' : 'block'}">
                        <div class="grid gap-3">${blocks}</div>
                        
                        <!-- 底部的大虚线按钮 -->
                        <button type="button" data-action="add-skill" class="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-3 text-[12px] font-bold text-slate-500 transition-all hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-600">
                            <i class="fas fa-plus"></i> 新增技能分组
                        </button>
                    </div>
                </section>
            `;
        }

        function renderExperiencesForm() {
            const isCollapsed = panelState.experiences;
            const blocks = resumeData.experiences.map((item, index) => (`
                <div class="group relative rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.02)] transition-all hover:border-slate-200 hover:shadow-[0_4px_16px_rgba(15,23,42,0.04)]">
                    <div class="mb-4 flex items-center justify-between border-b border-slate-100/80 pb-3">
                        <div class="flex items-center gap-2.5">
                            <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 shadow-sm"><i class="fas fa-briefcase text-[12px]"></i></div>
                            <p class="text-[13px] font-bold text-slate-700">工作经历 ${index + 1}</p>
                        </div>
                        <button type="button" data-action="remove-experience" data-index="${index}" class="flex h-7 w-7 items-center justify-center rounded-md text-slate-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100" title="删除"><i class="fas fa-trash text-[11px]"></i></button>
                    </div>
                    <div class="grid gap-3.5">
                        <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500">职位<input name="experience-title-${index}" class="${inputClass}" data-section="experiences" data-index="${index}" data-field="title" value="${escapeHtml(item.title)}"></label>
                        <div class="grid grid-cols-2 gap-3">
                            <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500">公司<input name="experience-company-${index}" class="${inputClass}" data-section="experiences" data-index="${index}" data-field="company" value="${escapeHtml(item.company)}"></label>
                            <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500">时间<input name="experience-period-${index}" class="${inputClass}" data-section="experiences" data-index="${index}" data-field="period" value="${escapeHtml(item.period)}"></label>
                        </div>
                        <label class="mt-1 flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 transition-colors hover:bg-slate-100"><input name="experience-highlight-${index}" type="checkbox" class="h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500" data-section="experiences" data-index="${index}" data-field="highlight" ${item.highlight ? "checked" : ""}><span class="text-[12px] font-bold text-slate-600">标记为高亮经历</span></label>
                        <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500">工作内容 <span class="text-[9px] font-medium text-slate-400 normal-case tracking-normal ml-1">（每行一段描述）</span><textarea name="experience-bullets-${index}" class="${textareaClass}" data-section="experiences" data-index="${index}" data-field="bullets" data-multiline="true">${escapeHtml(arrayToLines(item.bullets))}</textarea></label>
                    </div>
                </div>
            `)).join("");

            return `
				<section class="form-section !p-0 overflow-hidden">
                    <div class="flex w-full items-center justify-between">
                        <button type="button" data-action="toggle-section" data-section-id="experiences" class="flex flex-1 items-center gap-2 p-4 transition-colors outline-none text-left">
                            <i class="fas fa-chevron-down text-[12px] text-slate-400 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}"></i>
                            <h2 class="text-sm font-extrabold text-slate-900">工作经历</h2>
                        </button>
                        <div class="pr-4 ${isCollapsed ? '' : 'hidden'}">
                            <button type="button" data-action="add-experience" class="text-[11px] font-bold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-lg transition-colors z-10 relative">+ 新增</button>
                        </div>
                    </div>
                    <div class="px-4 pb-6 ${isCollapsed ? 'hidden' : 'block'}">
                        <div class="grid gap-3">${blocks}</div>
                        <button type="button" data-action="add-experience" class="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-3 text-[12px] font-bold text-slate-500 transition-all hover:border-amber-400 hover:bg-amber-50 hover:text-amber-600"><i class="fas fa-plus"></i> 新增工作经历</button>
                    </div>
                </section>
            `;
        }

        function renderProjectsForm() {
            const isCollapsed = panelState.projects;
            const blocks = resumeData.projects.map((item, index) => (`
                <div class="group relative rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.02)] transition-all hover:border-slate-200 hover:shadow-[0_4px_16px_rgba(15,23,42,0.04)]">
                    <div class="mb-4 flex items-center justify-between border-b border-slate-100/80 pb-3">
                        <div class="flex items-center gap-2.5">
                            <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 shadow-sm"><i class="fas fa-code text-[11px]"></i></div>
                            <p class="text-[13px] font-bold text-slate-700">项目经验 ${index + 1}</p>
                        </div>
                        <button type="button" data-action="remove-project" data-index="${index}" class="flex h-7 w-7 items-center justify-center rounded-md text-slate-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100" title="删除"><i class="fas fa-trash text-[11px]"></i></button>
                    </div>
                    <div class="grid gap-3.5">
                        <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500">项目名称<input name="project-name-${index}" class="${inputClass}" data-section="projects" data-index="${index}" data-field="name" value="${escapeHtml(item.name)}"></label>
                        <div class="grid grid-cols-2 gap-3">
                            <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500">徽章文案<input name="project-badge-${index}" class="${inputClass}" data-section="projects" data-index="${index}" data-field="badge" value="${escapeHtml(item.badge)}"></label>
                            <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500">徽章样式
                                <select name="project-badge-style-${index}" class="mt-1.5 w-full appearance-none rounded-xl border-2 border-transparent bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-800 transition-all hover:bg-slate-200/60 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10" data-section="projects" data-index="${index}" data-field="badgeStyle">
                                    <option value="primary" ${item.badgeStyle === "primary" ? "selected" : ""}>🟢 主色（跟随主题）</option>
                                    <option value="secondary" ${item.badgeStyle === "secondary" ? "selected" : ""}>⚪️ 次级（灰色）</option>
                                </select>
                            </label>
                        </div>
                        <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500">技术栈 <span class="text-[9px] font-medium text-slate-400 normal-case tracking-normal ml-1">（每行输入一个）</span><textarea name="project-techs-${index}" class="${textareaClass} !min-h-[80px]" data-section="projects" data-index="${index}" data-field="techs" data-multiline="true">${escapeHtml(arrayToLines(item.techs))}</textarea></label>
                        <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500">项目描述<textarea name="project-description-${index}" class="${textareaClass}" data-section="projects" data-index="${index}" data-field="description">${escapeHtml(item.description)}</textarea></label>
                    </div>
                </div>
            `)).join("");

            return `
				<section class="form-section !p-0 overflow-hidden">
                    <div class="flex w-full items-center justify-between">
                        <button type="button" data-action="toggle-section" data-section-id="projects" class="flex flex-1 items-center gap-2 p-4 transition-colors outline-none text-left">
                            <i class="fas fa-chevron-down text-[12px] text-slate-400 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}"></i>
                            <h2 class="text-sm font-extrabold text-slate-900">项目经验</h2>
                        </button>
                        <div class="pr-4 ${isCollapsed ? '' : 'hidden'}">
                            <button type="button" data-action="add-project" class="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg transition-colors z-10 relative">+ 新增</button>
                        </div>
                    </div>
                    <div class="px-4 pb-6 ${isCollapsed ? 'hidden' : 'block'}">
                        <div class="grid gap-3">${blocks}</div>
                        <button type="button" data-action="add-project" class="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-3 text-[12px] font-bold text-slate-500 transition-all hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600"><i class="fas fa-plus"></i> 新增项目经验</button>
                    </div>
                </section>
            `;
        }

        function renderForm() {
            formRoot.innerHTML = [
                renderBasicForm(),
                renderBasicInfoForm(),
                renderEducationForm(),
                renderSkillsForm(),
                renderExperiencesForm(),
                renderProjectsForm(),
                renderAvatarCropModal()
            ].join("");

            initAvatarFrameEditor();
            initBasicInfoSortable();
        }

        function renderClassicBasicInfo(basicInfo, renderOptions) {
            const list = pickArray(basicInfo).filter((item) => pickText(item?.value, "").trim() !== "");
            if (!list.length) {
                return "";
            }

            const shadowClass = renderOptions.useFlatIcons ? "" : "shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]";

            const items = list.map((info, index) => {
                const icon = escapeHtml(resolveBasicInfoIcon(info));
                const text = escapeHtml(pickText(info.value, ""));
                const currentColorOverride = info.iconColor || "theme";
                const globalPaletteKey = renderOptions.iconPalette || "theme";
                const finalColorKey = resolveIconColorToneForTheme(index, currentColorOverride, globalPaletteKey, renderOptions.resumeTheme);
                const iconHtml = renderDynamicIcon(icon, finalColorKey, "w-8 h-8 rounded-full text-[13px]", shadowClass);

                return `
                    <li class="flex items-start gap-3">
                        ${iconHtml}
                        <span class="min-w-0 flex-1 break-words leading-8 text-sm text-gray-700">${text}</span>
                    </li>
                `;
            }).join("");

            return `<ul class="space-y-3.5">${items}</ul>`;
        }

        function renderClassicEducation(education) {
            const list = pickArray(education);
            if (!list.length) {
                return '<p class="text-sm text-gray-500">可在左侧表单中填写教育背景</p>';
            }

            return list.map((item, index) => {
                const blockClass = index === list.length - 1 ? "" : "mb-4";
                return `
                    <div class="${blockClass}">
                        <p class="font-bold text-gray-800">${escapeHtml(pickText(item.degree, ""))}</p>
                        <p class="resume-accent-company mt-1 text-sm font-medium">${escapeHtml(pickText(item.school, ""))}</p>
                        <p class="mt-1 text-xs text-gray-500"><i class="far fa-calendar-alt mr-1"></i> ${escapeHtml(pickText(item.period, ""))}</p>
                    </div>
                `;
            }).join("");
        }

        function renderClassicSkills(skills) {
            const groups = pickArray(skills);
            if (!groups.length) {
                return '<p class="text-sm text-gray-500">可在左侧表单中填写专业技能</p>';
            }

            return groups.map((group, index) => {
                const groupClass = index === groups.length - 1 ? "" : "mb-3";
                const tags = normalizeStringArray(group.items).map((item) => (
                    `<span class="rounded-full bg-gray-200 px-3 py-1 text-xs font-medium text-gray-700">${escapeHtml(item)}</span>`
                )).join("");

                return `
                    <div class="${groupClass}">
                        <p class="mb-2 text-sm font-semibold text-gray-700">${escapeHtml(pickText(group.name, ""))}</p>
                        <div class="flex flex-wrap gap-2">${tags}</div>
                    </div>
                `;
            }).join("");
        }

        function renderClassicExperienceItem(item, index, total, renderOptions) {
            const lineClass = renderOptions.useThemeTimeline ? "resume-section-divider" : "resume-soft-divider";
            const wrapperClass = index === total - 1
                ? `relative pl-6 border-l-2 ${lineClass} resume-avoid-break`
                : `mb-8 relative pl-6 border-l-2 ${lineClass} resume-avoid-break`;
            const isHighlight = Boolean(item.highlight);
            const dotClass = (renderOptions.useThemeTimeline || isHighlight) ? "resume-accent-dot" : "bg-gray-300";
            const companyClass = isHighlight ? "resume-accent-company" : "text-gray-600";
            const bullets = normalizeStringArray(item.bullets)
                .map((bullet) => (`<li>${escapeHtml(bullet)}</li>`))
                .join("");

            return `
                <div class="${wrapperClass}">
                    <div class="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full ${dotClass} ring-4 ring-white"></div>
                    <div class="mb-2 flex flex-col md:flex-row md:items-start md:justify-between">
                        <div>
                            <h4 class="text-lg font-bold text-gray-800">${escapeHtml(pickText(item.title, ""))}</h4>
                            <p class="text-sm font-medium ${companyClass}">${escapeHtml(pickText(item.company, ""))}</p>
                        </div>
                        <div class="mt-1 whitespace-nowrap text-sm font-medium text-gray-500 md:mt-0">
                            ${escapeHtml(pickText(item.period, ""))}
                        </div>
                    </div>
                    <ul class="mt-3 list-inside list-disc space-y-2 text-sm leading-relaxed text-gray-600">${bullets}</ul>
                </div>
            `;
        }

        function renderClassicProjectCard(project) {
            const badgeClass = pickText(project.badgeStyle, "secondary") === "primary"
                ? "resume-primary-badge rounded px-2 py-1 text-xs font-semibold"
                : "rounded bg-gray-200 px-2 py-1 text-xs font-semibold text-gray-700";
            const techTags = normalizeStringArray(project.techs).map((tech) => (
                `<span class="rounded border border-gray-200 bg-white px-2 py-0.5 text-xs text-gray-500">${escapeHtml(tech)}</span>`
            )).join("");
            const badgeText = pickText(project.badge, "").trim();
            const badgeHtml = badgeText ? `<span class="${badgeClass}">${escapeHtml(badgeText)}</span>` : "";

            return `
                <div class="resume-avoid-break rounded-lg border border-gray-100 bg-gray-50 p-5 transition-shadow hover:shadow-md">
                    <div class="mb-2 flex items-center justify-between gap-4">
                        <h4 class="font-bold text-gray-800">${escapeHtml(pickText(project.name, ""))}</h4>
                        ${badgeHtml}
                    </div>
                    <p class="mb-3 text-justify text-sm text-gray-600">${escapeHtml(pickText(project.description, ""))}</p>
                    <div class="mt-2 flex flex-wrap gap-2">${techTags}</div>
                </div>
            `;
        }

        function buildClassicLeftColumnBlocks(data, profileImage) {
            const basicInfoContent = renderClassicBasicInfo(data.basicInfo, data);
            const avatarMeta = data.avatarImageMeta || getCachedAvatarImageMeta(data.profileImage);
            const avatarFrame = normalizeAvatarFrame(data.avatarFrame, avatarMeta);
            const avatarStyle = getAvatarImageStyle(avatarFrame, avatarMeta);
            const avatarFrameClass = getAvatarFrameContainerClass(data.avatarShape);
            const blocks = [
                `
                    <div class="resume-avoid-break mb-8 flex justify-center">
                        <div class="relative h-32 w-32 overflow-hidden border-4 border-white shadow-md ${avatarFrameClass}">
                            <img src="${escapeHtml(profileImage)}" alt="Profile Picture" class="pointer-events-none select-none" style="${avatarStyle}" data-testid="avatar-preview-image" data-avatar-zoom="${escapeHtml(String(avatarFrame.zoom))}" data-avatar-offset-x="${escapeHtml(String(avatarFrame.offsetX))}" data-avatar-offset-y="${escapeHtml(String(avatarFrame.offsetY))}" onerror="this.onerror=null;this.src='${FALLBACK_AVATAR}'">
                        </div>
                    </div>
                `
            ];

            if (basicInfoContent) {
                blocks.push(`
                    <div class="resume-avoid-break mb-10">
                        <h3 class="resume-section-divider mb-4 border-b-2 pb-2 text-lg font-bold text-gray-800">基本信息</h3>
                        ${basicInfoContent}
                    </div>
                `);
            }

            blocks.push(
                `
                    <div class="resume-avoid-break mb-10">
                        <h3 class="resume-section-divider mb-4 border-b-2 pb-2 text-lg font-bold text-gray-800">教育背景</h3>
                        ${renderClassicEducation(data.education)}
                    </div>
                `,
                `
                    <div class="resume-avoid-break mb-10">
                        <h3 class="resume-section-divider mb-4 border-b-2 pb-2 text-lg font-bold text-gray-800">专业技能</h3>
                        ${renderClassicSkills(data.skills)}
                    </div>
                `
            );

            return blocks;
        }

        function buildClassicRightColumnBlocks(data) {
            const summaryText = pickText(data.summary, "").trim() || "可在左侧表单中填写个人简介";
            const blocks = [
                `
                    <div class="resume-soft-divider resume-avoid-break mb-10 border-b pb-8">
                        <h1 class="mb-2 text-4xl font-black tracking-tight text-gray-900 md:text-5xl">${escapeHtml(pickText(data.name, ""))}</h1>
                        <h2 class="resume-role-text text-xl font-medium tracking-wide md:text-2xl">${escapeHtml(pickText(data.role, ""))}</h2>
                    </div>
                `,
                `
                    <div class="resume-avoid-break mb-10">
                        <div class="mb-4 flex items-center">
                            <div class="resume-section-icon mr-3 flex h-10 w-10 items-center justify-center rounded-full"><i class="fas fa-user-tie text-lg"></i></div>
                            <h3 class="text-2xl font-bold text-gray-800">个人简介</h3>
                        </div>
                        <p class="text-justify leading-relaxed text-gray-600">${escapeHtml(summaryText)}</p>
                    </div>
                `
            ];

            const experienceList = pickArray(data.experiences);
            if (experienceList.length) {
                const experienceItems = experienceList.map((item, index) => renderClassicExperienceItem(item, index, experienceList.length, data));
                blocks.push(`
                    <div class="resume-avoid-break mb-10">
                        <div class="mb-6 flex items-center">
                            <div class="resume-section-icon mr-3 flex h-10 w-10 items-center justify-center rounded-full"><i class="fas fa-briefcase text-lg"></i></div>
                            <h3 class="text-2xl font-bold text-gray-800">工作经历</h3>
                        </div>
                        ${experienceItems[0]}
                    </div>
                `);

                for (let index = 1; index < experienceItems.length; index += 1) {
                    blocks.push(experienceItems[index]);
                }
            } else {
                blocks.push(`
                    <div class="resume-avoid-break mb-10">
                        <div class="mb-6 flex items-center">
                            <div class="resume-section-icon mr-3 flex h-10 w-10 items-center justify-center rounded-full"><i class="fas fa-briefcase text-lg"></i></div>
                            <h3 class="text-2xl font-bold text-gray-800">工作经历</h3>
                        </div>
                        <p class="text-sm text-gray-500">可在左侧表单中填写工作经历</p>
                    </div>
                `);
            }

            const projectList = pickArray(data.projects);
            if (projectList.length) {
                const projectCards = projectList.map((project) => renderClassicProjectCard(project));
                blocks.push(`
                    <div class="resume-avoid-break mb-6">
                        <div class="mb-6 flex items-center">
                            <div class="resume-section-icon mr-3 flex h-10 w-10 items-center justify-center rounded-full"><i class="fas fa-project-diagram text-lg"></i></div>
                            <h3 class="text-2xl font-bold text-gray-800">项目经验</h3>
                        </div>
                        ${projectCards[0]}
                    </div>
                `);

                for (let index = 1; index < projectCards.length; index += 1) {
                    const wrapperClass = index === projectCards.length - 1 ? "resume-avoid-break" : "resume-avoid-break mb-6";
                    blocks.push(`<div class="${wrapperClass}">${projectCards[index]}</div>`);
                }
            } else {
                blocks.push(`
                    <div class="resume-avoid-break">
                        <div class="mb-6 flex items-center">
                            <div class="resume-section-icon mr-3 flex h-10 w-10 items-center justify-center rounded-full"><i class="fas fa-project-diagram text-lg"></i></div>
                            <h3 class="text-2xl font-bold text-gray-800">项目经验</h3>
                        </div>
                        <p class="text-sm text-gray-500">可在左侧表单中填写项目经验</p>
                    </div>
                `);
            }

            return blocks;
        }

        function renderCardBasicInfo(basicInfo, renderOptions) {
            const list = pickArray(basicInfo).filter((item) => pickText(item?.value, "").trim() !== "");
            if (!list.length) return "";

            const shadowClass = renderOptions.useFlatIcons ? "" : "shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]";

            const items = list.map((info, index) => {
                const icon = escapeHtml(resolveBasicInfoIcon(info));
                const text = escapeHtml(pickText(info.value, ""));
                const label = escapeHtml(pickText(info.label, getBasicInfoIconTone(info.iconPreset).label));
                const currentColorOverride = info.iconColor || "theme";
                const globalPaletteKey = renderOptions.iconPalette || "theme";
                const finalColorKey = resolveIconColorToneForTheme(index, currentColorOverride, globalPaletteKey, renderOptions.resumeTheme);
                const iconHtml = renderDynamicIcon(icon, finalColorKey, "resume-info-icon h-9 w-9 rounded-full text-[13px]", shadowClass);

                return `
                    <li class="resume-info-item">
                        <div class="shrink-0">${iconHtml}</div>
                        <div class="min-w-0 flex-1">
                            <p class="resume-info-label">${label}</p>
                            <p class="resume-info-value">${text}</p>
                        </div>
                    </li>
                `;
            }).join("");

            return `<ul class="resume-info-list">${items}</ul>`;
        }

        function renderCardEducationEntry(item) {
            return `
                <article class="resume-card resume-side-item-card resume-avoid-break">
                    <h4 class="resume-meta-title">${escapeHtml(pickText(item.school, ""))}</h4>
                    <p class="resume-meta-subtitle">${escapeHtml(pickText(item.degree, ""))}</p>
                    <span class="resume-period-pill">${escapeHtml(pickText(item.period, ""))}</span>
                </article>
            `;
        }

        function buildCardEducationBlocks(education, iconShadowClass) {
            const list = pickArray(education);
            if (!list.length) {
                return [
                    `
                        <article class="resume-card resume-side-section-card resume-avoid-break">
                            <div class="resume-card-title-row resume-card-title-row-compact">
                                <div class="resume-section-icon resume-card-title-icon ${iconShadowClass}"><i class="fas fa-user-graduate text-sm"></i></div>
                                <div>
                                    <p class="resume-card-kicker">Education</p>
                                    <h3 class="resume-card-title">教育背景</h3>
                                </div>
                            </div>
                            <p class="resume-empty-state">可在左侧表单中填写教育背景</p>
                        </article>
                    `
                ];
            }

            return [
                `
                    <article class="resume-card resume-side-section-card resume-avoid-break">
                        <div class="resume-card-title-row resume-card-title-row-compact">
                            <div class="resume-section-icon resume-card-title-icon ${iconShadowClass}"><i class="fas fa-user-graduate text-sm"></i></div>
                            <div>
                                <p class="resume-card-kicker">Education</p>
                                <h3 class="resume-card-title">教育背景</h3>
                            </div>
                        </div>
                    </article>
                `,
                ...list.map((item) => renderCardEducationEntry(item))
            ];
        }

        function renderSkillTags(items, badgeColorPref) {
            return normalizeStringArray(items).map((item) => {
                let badgeClass = "";
                
                // 1. 主题浅色：使用底层的 CSS 变量（它会自动调用非常柔和的配色）
                if (badgeColorPref === "theme-soft" || badgeColorPref === "theme") {
                    badgeClass = "resume-primary-badge border border-black/5 mix-blend-multiply shadow-sm"; 
                } 
                // 🌟 2. 新增的主题描边：极简风的最爱，纯白底+主题色边框+主题色文字
                else if (badgeColorPref === "theme-outline") {
                    badgeClass = "bg-white text-theme border border-theme shadow-[0_2px_8px_var(--resume-accent-glow)]";
                } 
                // 3. 经典灰色系
                else if (badgeColorPref === "gray") {
                    badgeClass = "bg-gray-100 text-gray-700 border border-gray-200/50";
                } else if (badgeColorPref === "slate") {
                    badgeClass = "bg-slate-100 text-slate-700 border border-slate-200/50";
                } else if (badgeColorPref === "zinc") {
                    badgeClass = "bg-zinc-100 text-zinc-700 border border-zinc-200/50";
                }
                
                return `<span class="${badgeClass} resume-skill-tag">${escapeHtml(item)}</span>`;
            }).join("");
        }

        function renderCardSkillGroupCard(group, badgeColorPref) {
            return `
                <article class="resume-card resume-side-item-card resume-avoid-break">
                    <p class="resume-skill-group-name">${escapeHtml(pickText(group.name, ""))}</p>
                    <div class="resume-skill-tag-list">${renderSkillTags(group.items, badgeColorPref)}</div>
                </article>
            `;
        }

        function buildCardSkillBlocks(skills, iconShadowClass, badgeColorPref) {
            const groups = pickArray(skills);

            if (!groups.length) {
                return [
                    `
                        <article class="resume-card resume-side-section-card resume-avoid-break">
                            <div class="resume-card-title-row resume-card-title-row-compact">
                                <div class="resume-section-icon resume-card-title-icon ${iconShadowClass}"><i class="fas fa-layer-group text-sm"></i></div>
                                <div>
                                    <p class="resume-card-kicker">Skills</p>
                                    <h3 class="resume-card-title">专业技能</h3>
                                </div>
                            </div>
                            <p class="resume-empty-state">可在左侧表单中填写专业技能</p>
                        </article>
                    `
                ];
            }

            return [
                `
                    <article class="resume-card resume-side-section-card resume-avoid-break">
                        <div class="resume-card-title-row resume-card-title-row-compact">
                            <div class="resume-section-icon resume-card-title-icon ${iconShadowClass}"><i class="fas fa-layer-group text-sm"></i></div>
                            <div>
                                <p class="resume-card-kicker">Skills</p>
                                <h3 class="resume-card-title">专业技能</h3>
                            </div>
                        </div>
                    </article>
                `,
                ...groups.map((group) => renderCardSkillGroupCard(group, badgeColorPref))
            ];
        }

        function renderCardExperienceItem(item, index, total, useThemeTimeline) {
            const isThemeLine = Boolean(useThemeTimeline);
            const lineClass = isThemeLine ? "resume-timeline-rail-accent" : "resume-timeline-rail-neutral";
            const isHighlight = Boolean(item.highlight);
            const dotClass = isHighlight ? "resume-timeline-dot-accent" : "resume-timeline-dot-muted";
            const companyClass = isHighlight ? "resume-accent-company" : "resume-entry-company-muted";
            const bullets = normalizeStringArray(item.bullets)
                .map((bullet) => (`<li>${escapeHtml(bullet)}</li>`))
                .join("");
            const bulletList = bullets ? `<ul class="resume-bullet-list">${bullets}</ul>` : "";
            const highlightBadge = isHighlight
                ? '<span class="resume-primary-badge resume-entry-flag">重点经历</span>'
                : '';

            return `
                <article class="resume-card resume-card-lg resume-experience-card resume-avoid-break" data-resume-item-index="${index}" data-resume-item-total="${total}">
                    <div class="resume-timeline-rail ${lineClass}" aria-hidden="true"></div>
                    <div class="resume-timeline-dot ${dotClass}" aria-hidden="true"></div>
                    <div class="resume-entry-head">
                        <div class="min-w-0 flex-1">
                            ${highlightBadge}
                            <h4 class="resume-entry-title">${escapeHtml(pickText(item.title, ""))}</h4>
                            <p class="resume-entry-company ${companyClass}">${escapeHtml(pickText(item.company, ""))}</p>
                        </div>
                        <span class="resume-period-pill resume-period-pill-tight">${escapeHtml(pickText(item.period, ""))}</span>
                    </div>
                    ${bulletList}
                </article>
            `;
        }

        function renderCardProjectCard(project) {
            const badgeClass = pickText(project.badgeStyle, "secondary") === "primary"
                ? "resume-primary-badge resume-project-badge"
                : "resume-project-secondary-badge resume-project-badge";
            const techTags = normalizeStringArray(project.techs).map((tech) => (
                `<span class="resume-tech-tag">${escapeHtml(tech)}</span>`
            )).join("");
            const badgeText = pickText(project.badge, "").trim();
            const badgeHtml = badgeText ? `<span class="${badgeClass}">${escapeHtml(badgeText)}</span>` : "";
            const description = pickText(project.description, "").trim();

            return `
                <article class="resume-card resume-card-lg resume-project-card resume-avoid-break">
                    <div class="resume-project-accent" aria-hidden="true"></div>
                    <div class="resume-project-head">
                        <div class="min-w-0 flex-1">
                            <div class="resume-project-title-row">
                                <h4 class="resume-entry-title">${escapeHtml(pickText(project.name, ""))}</h4>
                                ${badgeHtml}
                            </div>
                            <p class="resume-project-description">${escapeHtml(description)}</p>
                        </div>
                    </div>
                    <div class="resume-tech-tag-list">${techTags}</div>
                </article>
            `;
        }

        function buildCardLeftColumnBlocks(data, profileImage) {
            const basicInfoContent = renderCardBasicInfo(data.basicInfo, data);
            const avatarMeta = data.avatarImageMeta || getCachedAvatarImageMeta(data.profileImage);
            const avatarFrame = normalizeAvatarFrame(data.avatarFrame, avatarMeta);
            const avatarStyle = getAvatarImageStyle(avatarFrame, avatarMeta);
            const avatarFrameClass = getAvatarFrameContainerClass(data.avatarShape);
            const iconShadowClass = data.useFlatIcons ? "" : "shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_10px_24px_var(--resume-accent-glow)]";
            const roleText = pickText(data.role, "").trim();
            const blocks = [
                `
                    <article class="resume-card resume-profile-card resume-avoid-break">
                        <div class="resume-profile-avatar-wrap">
                            <div class="resume-profile-avatar-shell ${avatarFrameClass}">
                                <img src="${escapeHtml(profileImage)}" alt="Profile Picture" class="pointer-events-none select-none" style="${avatarStyle}" data-testid="avatar-preview-image" data-avatar-zoom="${escapeHtml(String(avatarFrame.zoom))}" data-avatar-offset-x="${escapeHtml(String(avatarFrame.offsetX))}" data-avatar-offset-y="${escapeHtml(String(avatarFrame.offsetY))}" onerror="this.onerror=null;this.src='${FALLBACK_AVATAR}'">
                            </div>
                        </div>
                        <div class="resume-profile-copy">
                            <h1 class="resume-profile-name">${escapeHtml(pickText(data.name, ""))}</h1>
                            ${roleText ? `<p class="resume-profile-role">${escapeHtml(roleText)}</p>` : ""}
                        </div>
                    </article>
                `
            ];

            if (basicInfoContent) {
                blocks.push(`
                    <article class="resume-card resume-avoid-break">
                        <div class="resume-card-title-row">
                            <div class="resume-section-icon resume-card-title-icon ${iconShadowClass}"><i class="fas fa-address-book text-sm"></i></div>
                            <div>
                                <p class="resume-card-kicker">Contact</p>
                                <h3 class="resume-card-title">联系方式</h3>
                            </div>
                        </div>
                        ${basicInfoContent}
                    </article>
                `);
            }

            blocks.push(
                ...buildCardEducationBlocks(data.education, iconShadowClass),
                ...buildCardSkillBlocks(data.skills, iconShadowClass, data.skillBadgeColor || "theme-soft")
            );

            return blocks;
        }

        function buildCardRightColumnBlocks(data) {
            // 🌟 读取扁平开关状态，生成对应阴影类名
            const iconShadowClass = data.useFlatIcons ? "" : "shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_6px_16px_var(--resume-accent-glow)]";
            const summaryText = pickText(data.summary, "").trim() || "可在左侧表单中填写个人简介";

            const blocks = [
                `
                    <article class="resume-card resume-card-lg resume-summary-card resume-avoid-break">
                        <div class="resume-card-title-row">
                            <div class="resume-section-icon resume-card-title-icon ${iconShadowClass}"><i class="fas fa-user-tie text-base"></i></div>
                            <div>
                                <p class="resume-card-kicker">Profile</p>
                                <h3 class="resume-card-title resume-card-title-lg">个人简介</h3>
                            </div>
                        </div>
                        <p class="resume-summary-text">${escapeHtml(summaryText)}</p>
                    </article>
                `
            ];

            const experienceList = pickArray(data.experiences);
            if (experienceList.length) {
                blocks.push(`
                    <article class="resume-card resume-section-lead-card resume-avoid-break">
                        <div class="resume-card-title-row">
                            <div class="resume-section-icon resume-card-title-icon ${iconShadowClass}"><i class="fas fa-briefcase text-base"></i></div>
                            <div>
                                <p class="resume-card-kicker">Timeline</p>
                                <h3 class="resume-card-title resume-card-title-lg">工作经历</h3>
                            </div>
                        </div>
                    </article>
                `);

                for (let index = 0; index < experienceList.length; index += 1) {
                    blocks.push(renderCardExperienceItem(experienceList[index], index, experienceList.length, data.useThemeTimeline));
                }
            }

            const projectList = pickArray(data.projects);
            if (projectList.length) {
                blocks.push(`
                    <article class="resume-card resume-section-lead-card resume-avoid-break">
                        <div class="resume-card-title-row">
                            <div class="resume-section-icon resume-card-title-icon ${iconShadowClass}"><i class="fas fa-code text-base"></i></div>
                            <div>
                                <p class="resume-card-kicker">Selected Work</p>
                                <h3 class="resume-card-title resume-card-title-lg">项目经验</h3>
                            </div>
                        </div>
                    </article>
                `);

                for (let index = 0; index < projectList.length; index += 1) {
                    blocks.push(renderCardProjectCard(projectList[index]));
                }
            }

            return blocks;
        }

        function buildLayoutColumnBlocks(layout, data, profileImage) {
            if (normalizeResumeLayout(layout) === RESUME_LAYOUT_CARDS) {
                return {
                    leftBlocks: buildCardLeftColumnBlocks(data, profileImage),
                    rightBlocks: buildCardRightColumnBlocks(data)
                };
            }

            return {
                leftBlocks: buildClassicLeftColumnBlocks(data, profileImage),
                rightBlocks: buildClassicRightColumnBlocks(data)
            };
        }

        function renderResumeSheet(leftHtml, rightHtml, sheetOverflowClass = "") {
            return `
                <div class="resume-sheet ${sheetOverflowClass}">
                    <div class="resume-left">${leftHtml}</div>
                    <div class="resume-right">${rightHtml}</div>
                </div>
            `;
        }

        function createMeasurePage(layout, themeKey, themeInlineStyle, renderMode) {
            const host = document.createElement("div");
            host.className = `resume-page resume-page-measure resume-theme-shell ${getResumeLayoutClass(layout)}`;
            host.dataset.resumeTheme = escapeHtml(themeKey || "");
            host.dataset.resumeLayout = escapeHtml(normalizeResumeLayout(layout));
            host.dataset.renderMode = escapeHtml(normalizeRenderMode(renderMode));
            host.setAttribute("style", themeInlineStyle || "");
            host.innerHTML = renderResumeSheet("", "");
            document.body.appendChild(host);

            return {
                host,
                leftColumn: host.querySelector(".resume-left"),
                rightColumn: host.querySelector(".resume-right")
            };
        }

        function getOuterBottom(container, block) {
            const containerRect = container.getBoundingClientRect();
            const blockRect = block.getBoundingClientRect();
            const styles = window.getComputedStyle(block);
            const marginBottom = Number.parseFloat(styles.marginBottom) || 0;
            return (blockRect.bottom - containerRect.top) + marginBottom;
        }

        function paginateColumnBlocks(blocks, columnType, layout, themeKey, themeInlineStyle, renderMode) {
            const sourceBlocks = pickArray(blocks);
            if (!sourceBlocks.length) {
                return {
                    pages: [[]],
                    oversizePages: new Set()
                };
            }

            const pages = [];
            const oversizePages = new Set();
            let cursor = 0;

            while (cursor < sourceBlocks.length) {
                const { host, leftColumn, rightColumn } = createMeasurePage(layout, themeKey, themeInlineStyle, renderMode);
                const column = columnType === "left" ? leftColumn : rightColumn;
                const currentPage = [];

                if (!column) {
                    host.remove();
                    return {
                        pages: [sourceBlocks],
                        oversizePages: new Set()
                    };
                }

                while (cursor < sourceBlocks.length) {
                    column.insertAdjacentHTML("beforeend", sourceBlocks[cursor]);
                    const lastBlock = column.lastElementChild;
                    const fitsCurrentPage = !lastBlock
                        || getOuterBottom(column, lastBlock) <= (column.getBoundingClientRect().height - PAGE_BREAK_BUFFER_PX);

                    if (fitsCurrentPage || currentPage.length === 0) {
                        currentPage.push(sourceBlocks[cursor]);

                        if (!fitsCurrentPage) {
                            oversizePages.add(pages.length);
                        }

                        cursor += 1;

                        if (!fitsCurrentPage) {
                            break;
                        }
                    } else {
                        if (lastBlock) {
                            lastBlock.remove();
                        }
                        break;
                    }
                }

                host.remove();
                pages.push(currentPage);
            }

            return {
                pages,
                oversizePages
            };
        }

        function renderResumePage(layout, leftHtml, rightHtml, pageNumber, totalPages, isOverflowPage, renderMode) {
            const normalizedLayout = normalizeResumeLayout(layout);
            const normalizedRenderMode = normalizeRenderMode(renderMode);
            const pageClass = isOverflowPage
                ? "resume-page resume-page-overflow print-shadow-none"
                : "resume-page print-shadow-none";
            const sheetOverflowClass = isOverflowPage
                ? "resume-sheet-overflow"
                : "";
            const layoutClass = getResumeLayoutClass(normalizedLayout);
            const separator = pageNumber < totalPages
                ? `<div class="page-split-hint no-print">分页分割区域 · 第 ${pageNumber}/${totalPages} 页</div>`
                : "";

            return `
                <div class="${pageClass} ${layoutClass}" data-resume-layout="${escapeHtml(normalizedLayout)}" data-render-mode="${escapeHtml(normalizedRenderMode)}">
                    ${renderResumeSheet(leftHtml, rightHtml, sheetOverflowClass)}
                </div>
                ${separator}
            `;
        }

        function renderResume(data, renderMode = activeRenderMode) {
            const documentTitle = pickText(data.documentTitle, "简历") || "简历";
            const layout = normalizeResumeLayout(data.resumeLayout);
            const profileImage = getAvatarImageSource(data.profileImage);
            const theme = getResumeThemeOption(data.resumeTheme);
            const themeInlineStyle = buildResumeThemeInlineStyle(theme);
            const normalizedRenderMode = normalizeRenderMode(renderMode);

            activeRenderMode = normalizedRenderMode;

            document.title = documentTitle;
			// 🌟 动态注入丰富的主题变量（支持单色和混搭色）
            const rootStyle = document.documentElement.style;
            const themeVars = buildResumeThemeVars(theme);
            Object.entries(themeVars).forEach(([key, value]) => {
                rootStyle.setProperty(key, value);
			});

            const { leftBlocks, rightBlocks } = buildLayoutColumnBlocks(layout, data, profileImage);
            const leftResult = paginateColumnBlocks(leftBlocks, "left", layout, theme.key, themeInlineStyle, normalizedRenderMode);
            const rightResult = paginateColumnBlocks(rightBlocks, "right", layout, theme.key, themeInlineStyle, normalizedRenderMode);
            const leftPages = leftResult.pages;
            const rightPages = rightResult.pages;
            const totalPages = Math.max(leftPages.length, rightPages.length, 1);

            const pages = [];
            for (let pageIndex = 0; pageIndex < totalPages; pageIndex += 1) {
                const leftHtml = (leftPages[pageIndex] || []).join("");
                const rightHtml = (rightPages[pageIndex] || []).join("");
                const isOverflowPage = leftResult.oversizePages.has(pageIndex)
                    || rightResult.oversizePages.has(pageIndex);
                pages.push(renderResumePage(layout, leftHtml, rightHtml, pageIndex + 1, totalPages, isOverflowPage, normalizedRenderMode));
            }

            resumeRoot.innerHTML = `<div class="preview-stack resume-theme-shell ${getResumeLayoutClass(layout)}" data-resume-theme="${escapeHtml(theme.key)}" data-resume-layout="${escapeHtml(layout)}" data-render-mode="${escapeHtml(normalizedRenderMode)}" style="${escapeHtml(themeInlineStyle)}">${pages.join("")}</div>`;
        }

        function renderAll() {
            renderForm();
            renderResume(resumeData, activeRenderMode);
        }

        function initAvatarFrameEditor() {
            const dragSurface = formRoot.querySelector('[data-avatar-drag-surface="true"]');
            const editorImage = formRoot.querySelector('[data-avatar-editor-image="true"]');
            if (!dragSurface) {
                return;
            }

            const applyWheelZoom = (deltaY) => {
                const editorState = getAvatarEditorState();
                const minZoom = avatarCropState ? getAvatarEditorMinZoom(editorState.imageMeta) : 1;
                const wheelStep = Math.abs(deltaY) > 80 ? 0.08 : 0.04;
                const nextZoom = clampNumber(
                    editorState.frame.zoom + (deltaY < 0 ? wheelStep : -wheelStep),
                    minZoom,
                    2.5,
                    editorState.frame.zoom
                );
                if (nextZoom === editorState.frame.zoom) {
                    return;
                }
                setAvatarEditorFrame({
                    ...editorState.frame,
                    zoom: Number(nextZoom.toFixed(2))
                });
            };

            const syncEditorImageMeta = () => {
                if (avatarCropState && editorImage?.naturalWidth && editorImage?.naturalHeight) {
                    avatarCropState.imageMeta = {
                        width: editorImage.naturalWidth,
                        height: editorImage.naturalHeight
                    };
                    avatarCropState.frame = normalizeAvatarFrame(avatarCropState.frame, avatarCropState.imageMeta, getAvatarEditorMinZoom(avatarCropState.imageMeta));
                    syncAvatarEditorUI();
                }
            };

            if (editorImage) {
                if (editorImage.complete) {
                    syncEditorImageMeta();
                } else {
                    editorImage.addEventListener("load", syncEditorImageMeta, { once: true });
                }
            }

            const stopDragging = (shouldPersist) => {
                if (!avatarDragState) {
                    return;
                }
                avatarDragState = null;
                dragSurface.classList.remove("cursor-grabbing");
                dragSurface.classList.add("cursor-grab");
                if (shouldPersist && !avatarCropState) {
                    saveDraft();
                }
            };

            dragSurface.addEventListener("pointerdown", (event) => {
                if (event.button !== undefined && event.button !== 0) {
                    return;
                }
                const rect = dragSurface.getBoundingClientRect();
                avatarDragState = {
                    pointerId: event.pointerId,
                    startX: event.clientX,
                    startY: event.clientY,
                    width: rect.width,
                    height: rect.height,
                    startFrame: normalizeAvatarFrame(getAvatarEditorState().frame, getAvatarEditorState().imageMeta, avatarCropState ? getAvatarEditorMinZoom(getAvatarEditorState().imageMeta) : 1),
                    imageMeta: getAvatarEditorState().imageMeta,
                    minZoom: avatarCropState ? getAvatarEditorMinZoom(getAvatarEditorState().imageMeta) : 1
                };
                if (typeof dragSurface.setPointerCapture === "function" && event.pointerId !== undefined) {
                    dragSurface.setPointerCapture(event.pointerId);
                }
                dragSurface.classList.remove("cursor-grab");
                dragSurface.classList.add("cursor-grabbing");
                event.preventDefault();
            });

            dragSurface.addEventListener("pointermove", (event) => {
                if (!avatarDragState || (event.pointerId !== undefined && avatarDragState.pointerId !== undefined && event.pointerId !== avatarDragState.pointerId)) {
                    return;
                }
                setAvatarEditorFrame(calculateAvatarFrameFromDrag(
                    avatarDragState.startFrame,
                    event.clientX - avatarDragState.startX,
                    event.clientY - avatarDragState.startY,
                    avatarDragState.width,
                    avatarDragState.height,
                    avatarDragState.imageMeta,
                    avatarDragState.minZoom
                ));
            });

            dragSurface.addEventListener("wheel", (event) => {
                event.preventDefault();
                applyWheelZoom(event.deltaY);
            }, { passive: false });

            const finishDrag = (event) => {
                if (!avatarDragState || (event.pointerId !== undefined && avatarDragState.pointerId !== undefined && event.pointerId !== avatarDragState.pointerId)) {
                    return;
                }
                if (typeof dragSurface.releasePointerCapture === "function" && event.pointerId !== undefined) {
                    try {
                        dragSurface.releasePointerCapture(event.pointerId);
                    } catch (_error) {
                        // ignore unsupported release cases
                    }
                }
                stopDragging(true);
            };

            dragSurface.addEventListener("pointerup", finishDrag);
            dragSurface.addEventListener("pointercancel", () => {
                stopDragging(false);
                syncAvatarEditorUI();
                if (!avatarCropState) {
                    renderResume(resumeData);
                }
            });
            syncAvatarEditorUI();
        }

        function initBasicInfoSortable() {
            if (basicInfoSortable) {
                basicInfoSortable.destroy();
                basicInfoSortable = null;
            }

            const list = document.getElementById("basic-info-list");
            if (!list || typeof Sortable === "undefined") {
                return;
            }

            basicInfoSortable = Sortable.create(list, {
                draggable: ".basic-info-item",
                handle: ".basic-info-drag-handle",
                animation: 150,
                delayOnTouchOnly: true,
                delay: 120,
                touchStartThreshold: 4,
                fallbackTolerance: 4,
                onEnd(event) {
                    if (event.oldIndex == null || event.newIndex == null || event.oldIndex === event.newIndex) {
                        return;
                    }
                    moveItem(resumeData.basicInfo, event.oldIndex, event.newIndex);
                    activeBasicInfoPickerIndex = -1;
                    renderAll();
                    saveDraft();
                    setStatus("已更新基本信息排序。", "success");
                }
            });
        }

        let repaginationTimer = null;
        let printRestoreTimer = null;

        function rerenderResumeSoon() {
            if (repaginationTimer !== null) {
                window.clearTimeout(repaginationTimer);
            }

            repaginationTimer = window.setTimeout(() => {
                repaginationTimer = null;
                renderResume(resumeData, activeRenderMode);
            }, 120);
        }

        function rerenderResumeNow(renderMode = activeRenderMode) {
            if (repaginationTimer !== null) {
                window.clearTimeout(repaginationTimer);
                repaginationTimer = null;
            }
            renderResume(resumeData, renderMode);
        }

        function scheduleScreenModeRestore() {
            if (printRestoreTimer !== null) {
                window.clearTimeout(printRestoreTimer);
            }

            printRestoreTimer = window.setTimeout(() => {
                printRestoreTimer = null;
                window.requestAnimationFrame(() => {
                    window.requestAnimationFrame(() => {
                        rerenderResumeNow(RENDER_MODE_SCREEN);
                    });
                });
            }, PRINT_RESTORE_DELAY_MS);
        }

        function loadImageElement(imageSrc) {
            return new Promise((resolve, reject) => {
                const image = new Image();
                image.onload = () => resolve(image);
                image.onerror = () => reject(new Error("读取图片失败"));
                image.src = imageSrc;
            });
        }

        function getAvatarStorageExportType(canvas) {
            try {
                const probe = canvas.toDataURL("image/webp", 0.9);
                if (probe.startsWith("data:image/webp")) {
                    return "image/webp";
                }
            } catch (_error) {
                // Ignore unsupported export types and fall back to JPEG.
            }
            return "image/jpeg";
        }

        async function prepareAvatarDataUrlForDraft(file) {
            if (typeof URL === "undefined" || typeof URL.createObjectURL !== "function") {
                throw new Error("当前浏览器不支持头像处理");
            }

            const objectUrl = URL.createObjectURL(file);

            try {
                const image = await loadImageElement(objectUrl);
                const sourceWidth = image.naturalWidth || image.width || 0;
                const sourceHeight = image.naturalHeight || image.height || 0;

                if (!sourceWidth || !sourceHeight) {
                    throw new Error("图片尺寸无效");
                }

                const canvas = document.createElement("canvas");
                const context = canvas.getContext("2d");
                if (!context) {
                    throw new Error("当前浏览器不支持头像处理");
                }

                const exportType = getAvatarStorageExportType(canvas);
                const maxDimension = Math.max(sourceWidth, sourceHeight);
                let scale = Math.min(1, MAX_AVATAR_STORAGE_EDGE / Math.max(maxDimension, 1));
                let bestResult = null;

                while (scale >= 0.1) {
                    const targetWidth = Math.max(1, Math.round(sourceWidth * scale));
                    const targetHeight = Math.max(1, Math.round(sourceHeight * scale));
                    canvas.width = targetWidth;
                    canvas.height = targetHeight;
                    context.clearRect(0, 0, targetWidth, targetHeight);
                    context.imageSmoothingEnabled = true;
                    context.imageSmoothingQuality = "high";
                    context.drawImage(image, 0, 0, targetWidth, targetHeight);

                    for (const quality of AVATAR_STORAGE_QUALITIES) {
                        const dataUrl = canvas.toDataURL(exportType, quality);
                        bestResult = {
                            dataUrl,
                            imageMeta: { width: targetWidth, height: targetHeight }
                        };

                        if (dataUrl.length <= MAX_AVATAR_DRAFT_DATA_URL_LENGTH) {
                            return bestResult;
                        }
                    }

                    scale = Number((scale * 0.8).toFixed(3));
                }

                if (bestResult && bestResult.dataUrl.length <= MAX_AVATAR_DRAFT_DATA_URL_LENGTH) {
                    return bestResult;
                }

                throw new Error("图片过大，无法保存到本地草稿，请压缩后再试");
            } finally {
                URL.revokeObjectURL(objectUrl);
            }
        }

        async function handleAvatarUpload(file) {
            if (!file) {
                return;
            }

            const fileName = pickText(file.name, "");
            const lowerName = fileName.toLowerCase();
            const hasAllowedExtension = ALLOWED_AVATAR_EXTENSIONS.some((extension) => lowerName.endsWith(extension));

            if (!hasAllowedExtension || (file.type && !ALLOWED_AVATAR_TYPES.has(file.type))) {
                setStatus("头像上传失败：仅支持 PNG、JPG、JPEG、WEBP 图片。", "error");
                return;
            }

            if (file.size > MAX_AVATAR_FILE_SIZE) {
                setStatus("头像上传失败：文件不能超过 10 MB。", "error");
                return;
            }

            const previousProfileImage = resumeData.profileImage;
            const previousAvatarFrame = cloneData(resumeData.avatarFrame);

            try {
                const { dataUrl, imageMeta } = await prepareAvatarDataUrlForDraft(file);
                if (!/^data:image\/(png|jpeg|webp);/i.test(dataUrl)) {
                    throw new Error("图片格式无效");
                }

                resumeData.profileImage = previousProfileImage;
                resumeData.avatarFrame = previousAvatarFrame;
                openAvatarCropper(dataUrl, createInitialAvatarCropFrame(imageMeta), file.name, imageMeta);
                setStatus(`已载入头像：${file.name}。请在裁切框中调整后确认。`, "info");
            } catch (error) {
                resumeData.profileImage = previousProfileImage;
                resumeData.avatarFrame = previousAvatarFrame;
                renderAll();
                setStatus(`头像上传失败：${error.message || "无法保存图片"}`, "error");
            }
        }

        function applyFieldUpdate(target) {
            const section = target.dataset.section;
            const field = target.dataset.field;
            if (!section || !field) {
                return;
            }

            let value;
            if (target.dataset.multiline === "true") {
                value = linesToArray(target.value);
            } else if (target.type === "checkbox") {
                value = target.checked;
            } else {
                value = target.value;
            }

            if (section === "basic") {
                resumeData[field] = value;
            } else if (section === "avatarFrame") {
                const minZoom = avatarCropState ? getAvatarEditorMinZoom(avatarCropState.imageMeta) : 1;
                const nextFrame = {
                    ...(avatarCropState ? avatarCropState.frame : resumeData.avatarFrame),
                    [field]: field === "zoom"
                        ? clampNumber(value, minZoom, 2.5, DEFAULT_AVATAR_FRAME.zoom)
                        : clampNumber(value, -AVATAR_OFFSET_LIMIT, AVATAR_OFFSET_LIMIT, 0)
                };
                setAvatarEditorFrame(nextFrame);
                return;
            } else {
                const index = Number(target.dataset.index);
                if (!Number.isInteger(index)) {
                    return;
                }
                const list = resumeData[section];
                if (!Array.isArray(list) || !list[index]) {
                    return;
                }
                list[index][field] = value;
            }

            renderResume(resumeData);
            if (section === "avatarFrame") {
                syncAvatarEditorUI();
            }
            saveDraft();
        }

        function handleAction(action, index, button) {
            if (action === "toggle-basic-info-picker") {
                activeBasicInfoPickerIndex = activeBasicInfoPickerIndex === index ? -1 : index;
                renderForm();
                return;
            }

            if (action === "choose-basic-info-icon") {
                const item = resumeData.basicInfo[index];
                if (!item) {
                    return;
                }
                const iconPreset = pickText(button?.dataset?.iconPreset, "");
                if (!iconPreset) {
                    return;
                }
                item.iconPreset = iconPreset;
                item.iconMode = "preset";
                activeBasicInfoPickerIndex = -1;
                renderAll();
                saveDraft();
                return;
            }
			
			// --- 🌟 响应：切换技能标签颜色 ---
            if (action === "set-skill-badge-color") {
                const colorKey = pickText(button?.dataset?.color, "theme");
                if (resumeData.skillBadgeColor !== colorKey) {
                    resumeData.skillBadgeColor = colorKey;
                    renderAll();
                    saveDraft();
                }
                return;
            }
			
			// --- 🌟 响应：切换扁平/立体图标 ---
            if (action === "toggle-flat-icons") {
                resumeData.useFlatIcons = !resumeData.useFlatIcons;
                renderAll();
                saveDraft();
                return;
            }
			
			// --- 🌟 响应时间轴开关点击 ---
            if (action === "toggle-theme-timeline") {
                // 如果是 true 就变 false，反之变 true
                resumeData.useThemeTimeline = !resumeData.useThemeTimeline;
                renderAll();
                saveDraft();
                return;
            }
			
			// --- 🌟 新增：响应开关点击 ---
            if (action === "toggle-multicolor-icons") {
                // 如果未定义，默认是 true，点一下变 false；反之亦然。
                resumeData.useMulticolorIcons = resumeData.useMulticolorIcons === false ? true : false;
                renderAll();
                saveDraft();
                return;
            }
			
			// --- 🌟 新增：切换图标色彩风格 ---
            if (action === "set-icon-palette") {
                const paletteKey = pickText(button?.dataset?.palette, "macaron");
                if (resumeData.iconPalette !== paletteKey) {
                    resumeData.iconPalette = paletteKey;
                    renderAll();
                    saveDraft();
                }
                return;
            }
			
			// --- 新增：切换面板折叠状态 ---
            if (action === "toggle-section") {
                const sectionId = button.dataset.sectionId;
                if (sectionId) {
                    panelState[sectionId] = !panelState[sectionId];
                    renderForm();
                }
                return;
            }
			
			if (action === "set-basic-info-color") {
                const item = resumeData.basicInfo[index];
                if (!item) return;
                item.iconColor = pickText(button?.dataset?.color, "theme");
                renderAll();
                saveDraft();
                return;
            }

            if (action === "set-basic-info-mode") {
                const item = resumeData.basicInfo[index];
                if (!item) {
                    return;
                }
                const mode = pickText(button?.dataset?.mode, "preset");
                item.iconMode = mode === "custom" ? "custom" : "preset";
                renderAll();
                saveDraft();
                return;
            }

            if (action === "move-basic-info-up") {
                moveItem(resumeData.basicInfo, index, index - 1);
                activeBasicInfoPickerIndex = -1;
                renderAll();
                saveDraft();
                return;
            }

            if (action === "move-basic-info-down") {
                moveItem(resumeData.basicInfo, index, index + 1);
                activeBasicInfoPickerIndex = -1;
                renderAll();
                saveDraft();
                return;
            }

            if (action === "open-avatar-cropper") {
                if (!hasCustomAvatarImage(resumeData.profileImage)) {
                    setStatus("请先上传头像。", "info");
                    return;
                }
                openAvatarCropper(resumeData.profileImage, resumeData.avatarFrame, "当前头像", resumeData.avatarImageMeta || getCachedAvatarImageMeta(resumeData.profileImage));
                setStatus("已打开头像裁切框。确认后才会保存本次调整。", "info");
                return;
            }

            if (action === "avatar-crop-center") {
                applyAvatarCropQuickAction("center");
                return;
            }

            if (action === "avatar-crop-show-full") {
                applyAvatarCropQuickAction("show-full");
                return;
            }

            if (action === "avatar-crop-fill-frame") {
                applyAvatarCropQuickAction("fill-frame");
                return;
            }

            if (action === "cancel-avatar-crop") {
                closeAvatarCropper();
                setStatus("已取消本次头像裁切。", "info");
                return;
            }

            if (action === "confirm-avatar-crop") {
                confirmAvatarCrop();
                return;
            }

            if (action === "set-avatar-shape") {
                const shape = normalizeAvatarShape(pickText(button?.dataset?.shape, AVATAR_SHAPE_CIRCLE));
                if (resumeData.avatarShape === shape) {
                    return;
                }
                const previousShape = resumeData.avatarShape;
                resumeData.avatarShape = shape;
                renderAll();
                if (!saveDraft()) {
                    resumeData.avatarShape = previousShape;
                    renderAll();
                    setStatus("头像形状保存失败：无法写入本地草稿。", "error");
                    return;
                }
                setStatus(`头像展示已切换为${shape === AVATAR_SHAPE_RECTANGLE ? "矩形" : "圆形"}。`, "success");
                return;
            }

            if (action === "set-resume-layout") {
                const nextLayout = normalizeResumeLayout(pickText(button?.dataset?.layout, RESUME_LAYOUT_CLASSIC));
                if (resumeData.resumeLayout === nextLayout) {
                    return;
                }
                const previousLayout = resumeData.resumeLayout;
                resumeData.resumeLayout = nextLayout;
                renderAll();
                if (!saveDraft()) {
                    resumeData.resumeLayout = previousLayout;
                    renderAll();
                    setStatus("版式保存失败：无法写入本地草稿。", "error");
                    return;
                }
                setStatus(`简历预览已切换为${getResumeLayoutLabel(nextLayout)}。`, "success");
                return;
            }

            if (action === "set-resume-theme") {
                const nextTheme = normalizeResumeTheme(pickText(button?.dataset?.theme, ""));
                if (resumeData.resumeTheme === nextTheme) {
                    return;
                }
                const previousTheme = resumeData.resumeTheme;
                resumeData.resumeTheme = nextTheme;
                renderAll();
                if (!saveDraft()) {
                    resumeData.resumeTheme = previousTheme;
                    renderAll();
                    setStatus("主题保存失败：无法写入本地草稿。", "error");
                    return;
                }
                setStatus(`简历主题已切换为${getResumeThemeOption(nextTheme).label}。`, "success");
                return;
            }

            // --- 替换原来的新增逻辑：增加自动展开功能 ---
            if (action === "add-education") { resumeData.education.push(createEducation()); panelState.education = false; }
            if (action === "remove-education") removeItem(resumeData.education, index);

            if (action === "add-skill") { resumeData.skills.push(createSkillGroup()); panelState.skills = false; }
            if (action === "remove-skill") removeItem(resumeData.skills, index);

            if (action === "add-experience") { resumeData.experiences.push(createExperience()); panelState.experiences = false; }
            if (action === "remove-experience") removeItem(resumeData.experiences, index);

            if (action === "add-project") { resumeData.projects.push(createProject()); panelState.projects = false; }
            if (action === "remove-project") removeItem(resumeData.projects, index);

            renderAll();
            saveDraft();
        }

        formRoot.addEventListener("input", (event) => {
            const target = event.target;
            if (!target || !target.dataset) {
                return;
            }
            applyFieldUpdate(target);
        });

        formRoot.addEventListener("change", (event) => {
            const target = event.target;
            if (!target || !target.dataset) {
                return;
            }
            if (target.getAttribute("data-testid") === "avatar-upload-input") {
                handleAvatarUpload(target.files?.[0]);
                target.value = "";
                return;
            }
            applyFieldUpdate(target);
        });

        formRoot.addEventListener("click", (event) => {
            const target = event.target;
            if (!target) {
                return;
            }
            const button = target.closest("button[data-action]");
            if (!button) {
                return;
            }
            const action = button.dataset.action;
            const index = Number(button.dataset.index);
            handleAction(action, Number.isFinite(index) ? index : -1, button);
        });

resetButton.addEventListener("click", () => {
            resumeData = normalizeResumeData(cloneData(sampleResumeData));
            renderAll();
            const didPersist = saveDraft({ showAvatarWarning: true });
            setStatus(
                didPersist
                    ? "已重置为默认示例。"
                    : "已重置当前预览，但未能保存到本地草稿；刷新后可能恢复旧内容。",
                didPersist ? "success" : "error"
            );
        });

        exportButton.addEventListener("click", () => {
            const content = JSON.stringify(resumeData, null, 2);
            lastExportedJson = content;
            const blob = new Blob([content], { type: "application/json;charset=utf-8" });
            const blobUrl = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = blobUrl;
            anchor.download = "resume-data.json";
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
            URL.revokeObjectURL(blobUrl);
            setStatus("已导出 JSON。", "success");
        });

        importButton.addEventListener("click", () => {
            importFileInput.click();
        });

importFileInput.addEventListener("change", async () => {
            const file = importFileInput.files?.[0];
            if (!file) {
                return;
            }
            try {
                const text = await file.text();
                const parsed = JSON.parse(text);
                resumeData = normalizeResumeData(parsed);
                await hydrateAvatarStateIfNeeded(resumeData);
                renderAll();
                const didPersist = saveDraft({
                    showAvatarWarning: true,
                    avatarWarningMessage: `已导入 ${file.name}，但头像图片未能持久化到浏览器缓存；刷新后可能丢失，请及时导出 JSON 备份。`
                });
                setStatus(
                    didPersist
                        ? `已导入 ${file.name}。`
                        : `已导入 ${file.name}，但未能保存到本地草稿；刷新后可能回退，请及时导出 JSON。`,
                    didPersist ? "success" : "error"
                );
            } catch (error) {
                setStatus(`导入失败：${error.message}`, "error");
            }
            importFileInput.value = "";
        });

        printButton.addEventListener("click", () => {
            rerenderResumeNow(RENDER_MODE_PRINT);
            window.requestAnimationFrame(() => {
                window.requestAnimationFrame(() => {
                    window.print();
                });
            });
        });

        if (document.fonts?.ready) {
            document.fonts.ready.then(() => {
                rerenderResumeNow();
            });
        }

        window.addEventListener("resize", rerenderResumeSoon);
        window.addEventListener("orientationchange", rerenderResumeSoon);
        window.addEventListener("load", rerenderResumeSoon);
        window.addEventListener("beforeprint", () => {
            if (printRestoreTimer !== null) {
                window.clearTimeout(printRestoreTimer);
                printRestoreTimer = null;
            }
            if (activeRenderMode !== RENDER_MODE_PRINT) {
                rerenderResumeNow(RENDER_MODE_PRINT);
            }
        });
        window.addEventListener("afterprint", () => {
            scheduleScreenModeRestore();
        });

        window.__resumeApp__ = {
            getResumeData: () => cloneData(resumeData),
            getLastExportedJson: () => lastExportedJson,
            getStatusText: () => statusText.textContent,
            getAvatarCropState: () => avatarCropState ? createAvatarCropState(avatarCropState.imageSrc, avatarCropState.frame, avatarCropState.fileName) : null,
            rerender: () => renderAll(),
            openAvatarCropper(fileName = "当前头像") {
                openAvatarCropper(resumeData.profileImage, resumeData.avatarFrame, fileName, resumeData.avatarImageMeta || getCachedAvatarImageMeta(resumeData.profileImage));
            },
            confirmAvatarCrop,
            cancelAvatarCrop: closeAvatarCropper,
            setAvatarCropFrame(frame) {
                if (!avatarCropState) {
                    return;
                }
                avatarCropState.frame = normalizeAvatarFrame({ ...avatarCropState.frame, ...frame }, avatarCropState.imageMeta, getAvatarEditorMinZoom(avatarCropState.imageMeta));
                syncAvatarEditorUI();
            },
            dragAvatarCropFrame(deltaX, deltaY, width = 420, height = 420) {
                if (!avatarCropState) {
                    return;
                }
                avatarCropState.frame = calculateAvatarFrameFromDrag(avatarCropState.frame, deltaX, deltaY, width, height, avatarCropState.imageMeta, getAvatarEditorMinZoom(avatarCropState.imageMeta));
                syncAvatarEditorUI();
            },
            setAvatarFrame(frame) {
                resumeData.avatarFrame = normalizeAvatarFrame({ ...resumeData.avatarFrame, ...frame }, resumeData.avatarImageMeta || getCachedAvatarImageMeta(resumeData.profileImage));
                syncAvatarEditorUI();
                renderResume(resumeData, activeRenderMode);
                saveDraft();
            },
            dragAvatarFrame(deltaX, deltaY, width = 136, height = 136) {
                resumeData.avatarFrame = calculateAvatarFrameFromDrag(resumeData.avatarFrame, deltaX, deltaY, width, height, resumeData.avatarImageMeta || getCachedAvatarImageMeta(resumeData.profileImage));
                syncAvatarEditorUI();
                renderResume(resumeData, activeRenderMode);
                saveDraft();
            }
        };

        async function initializeApp() {
            const draftState = await loadDraft();

            if (draftState?.data) {
                resumeData = draftState.data;
                primeAvatarSidecarState(draftState.avatarRestored ? resumeData.profileImage : "", resumeData.profileImage);
                setStatus(draftState.avatarRestoreWarning || "已恢复上次草稿。", draftState.avatarRestoreWarning ? "error" : "success");
            } else {
                primeAvatarSidecarState("", resumeData.profileImage);
                setStatus("正在使用默认示例数据。", "info");
            }

            // Initialize clean snapshot for dirty-state tracking
            setCleanSnapshot(resumeData);
            renderAll();

            if (draftState?.needsUpgrade && hasCustomAvatarImage(resumeData.profileImage)) {
                const upgradeSynced = await syncAvatarSidecar({ showAvatarWarning: false });
                if (upgradeSynced) {
                    saveDraft({ showAvatarWarning: false, syncAvatarSidecar: false });
                } else {
                    setStatus("已恢复旧版草稿，但头像缓存升级失败；刷新后可能回退，请及时导出 JSON 备份。", "error");
                }
            }
        }

        initializeApp();
