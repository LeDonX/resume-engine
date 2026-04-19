import {
    AVATAR_CROP_FRAME_RATIO,
    AVATAR_CROP_MASK_INSET,
    AVATAR_SHAPE_CIRCLE,
    AVATAR_SHAPE_RECTANGLE,
    BASIC_INFO_COLORS,
    BASIC_INFO_ICON_OPTIONS,
    DEFAULT_EXPERIENCE_WORK_BADGE_LABEL,
    ICON_PALETTE_OPTIONS,
    PROFESSIONAL_SKILLS_MODE_OPTIONS,
    PROFESSIONAL_SKILLS_MODE_SKILLS,
    PROFESSIONAL_SKILLS_MODE_TEXT,
    RESUME_LAYOUT_CLASSIC,
    RESUME_LAYOUT_CARDS,
    RESUME_LAYOUT_CONTROL_FIELDS,
    RESUME_LAYOUT_SPACING_CONTROL_FIELDS,
    RESUME_LAYOUT_MY_RESUME,
    RESUME_LAYOUT_OPTIONS,
    RESUME_THEME_OPTIONS,
    FALLBACK_AVATAR
} from "../core/config.js";
import { arrayToLines, escapeHtml, pickText } from "../core/utils.js";
import {
    normalizeResumeLayout,
    normalizeResumeTheme,
    normalizeBasicInfoColor,
    normalizeSectionOrder,
    normalizeProfessionalSkillsMode,
    renderDynamicIcon,
    resolveBasicInfoIcon,
    resolveIconColorToneForTheme
} from "../core/resume-model.js";
import {
    getAvatarCropMaskRadius,
    getAvatarEditorMinZoom,
    getAvatarFrameLabel,
    getAvatarImageSource,
    getAvatarImageStyle,
    hasCustomAvatarImage,
    normalizeAvatarFrame,
    normalizeAvatarShape
} from "../avatar/avatar-utils.js";
import {
    RESUME_LAYOUT_CONTROL_SETTINGS,
    clampResumeLayoutControl,
    formatResumeLayoutControlValue
} from "../resume-layout-controls.js";

const inputClass = "mt-1.5 w-full rounded-xl border-2 border-transparent bg-slate-100 px-4 py-2.5 text-sm text-slate-800 transition-all placeholder:text-slate-400 hover:bg-slate-200/60 focus:bg-white focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10";
const textareaClass = "mt-1.5 w-full rounded-xl border-2 border-transparent bg-slate-100 px-4 py-2.5 text-sm text-slate-800 min-h-[100px] transition-all placeholder:text-slate-400 hover:bg-slate-200/60 focus:bg-white focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10";

function renderBasicInfoPicker(index, selectedPreset, selectedMode) {
    return BASIC_INFO_ICON_OPTIONS.map((option) => {
        const isActive = selectedMode === "preset" && option.key === selectedPreset;
        return `
            <button
                type="button"
                data-action="choose-basic-info-icon"
                data-index="${index}"
                data-icon-preset="${option.key}"
                class="group flex flex-col items-center justify-center gap-1.5 rounded-xl p-2 transition-all ${isActive ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] ring-1 ring-blue-400' : 'hover:bg-slate-200/50'}"
                title="${option.label}"
            >
                <span class="flex h-8 w-8 items-center justify-center rounded-full shadow-sm transition-transform group-hover:scale-110 ${option.chipClass}">
                    <i class="${option.icon} text-sm"></i>
                </span>
                <span class="text-[10px] font-bold ${isActive ? 'text-blue-700' : 'text-slate-500'}">${option.label}</span>
            </button>
        `;
    }).join("");
}

function renderAvatarCropModal({ resumeData, avatarCropState }) {
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
    const imgWidth = avatarCropState.imageMeta ? avatarCropState.imageMeta.width : "未知";
    const imgHeight = avatarCropState.imageMeta ? avatarCropState.imageMeta.height : "未知";
    const imgSizeStr = (imgWidth !== "未知" && imgHeight !== "未知") ? `${imgWidth} × ${imgHeight} px` : "正在读取...";

    return `
        <div class="avatar-crop-backdrop" data-testid="avatar-crop-modal" role="dialog" aria-modal="true" aria-label="头像裁切设置">
            <div class="avatar-crop-shell" style="--avatar-crop-mask-inset: ${AVATAR_CROP_MASK_INSET}; --avatar-crop-mask-radius: ${maskRadius};">
                <div class="avatar-crop-layout">
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
                                <div class="avatar-crop-stage cursor-grab active:cursor-grabbing touch-none select-none group/stage relative" data-testid="avatar-drag-surface" data-avatar-drag-surface="true" aria-label="拖拽调整头像位置">
                                    <img src="${escapeHtml(cropImage)}" alt="Avatar crop preview" class="pointer-events-none select-none transition-transform duration-75" data-testid="avatar-editor-image" data-avatar-editor-image="true" style="${getAvatarImageStyle(avatarFrame, avatarCropState.imageMeta, AVATAR_CROP_FRAME_RATIO, cropMinZoom)}" onerror="this.onerror=null;this.src='${FALLBACK_AVATAR}'">
                                    <div class="avatar-crop-mask transition-all"></div>
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
                    <div class="avatar-crop-panel-right avatar-crop-panel-pad">
                        <div class="avatar-crop-controls avatar-crop-controls-card flex flex-col h-full rounded-3xl border border-slate-100 bg-white/95 backdrop-blur-xl shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                            <div class="flex items-center justify-between mb-5">
                                <p class="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">参数调整</p>
                                <span class="flex h-5 items-center rounded-full bg-slate-100 px-2 text-[9px] font-bold text-slate-500 ring-1 ring-slate-200">
                                    ${avatarCropState.fileName ? `${escapeHtml(avatarCropState.fileName).substring(0, 15)}${avatarCropState.fileName.length > 15 ? "..." : ""}` : "当前图片"}
                                </span>
                            </div>
                            <div class="flex-1 flex flex-col gap-5">
                                <div class="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                                    <div class="flex items-center justify-between mb-3">
                                        <span class="text-[12px] font-extrabold text-slate-700">图像缩放</span>
                                        <span class="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md" data-testid="avatar-zoom-readout">${avatarFrame.zoom.toFixed(2)}x</span>
                                    </div>
                                    <div class="flex items-center gap-3">
                                        <i class="fas fa-search-minus text-[11px] text-slate-400 hover:text-blue-500 transition-colors cursor-pointer" onclick="document.querySelector('[data-testid=\'avatar-zoom-control\']').stepDown(); document.querySelector('[data-testid=\'avatar-zoom-control\']').dispatchEvent(new Event('input'))"></i>
                                        <input name="avatar-zoom" type="range" min="${escapeHtml(String(minZoom))}" max="2.5" step="0.01" value="${escapeHtml(String(avatarFrame.zoom))}" class="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 hover:accent-blue-500 transition-all" data-section="avatarFrame" data-field="zoom" data-testid="avatar-zoom-control">
                                        <i class="fas fa-search-plus text-[11px] text-slate-400 hover:text-blue-500 transition-colors cursor-pointer" onclick="document.querySelector('[data-testid=\'avatar-zoom-control\']').stepUp(); document.querySelector('[data-testid=\'avatar-zoom-control\']').dispatchEvent(new Event('input'))"></i>
                                    </div>
                                </div>
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
                                <div class="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                                    <div class="flex items-center gap-2">
                                        <div class="flex h-6 w-6 items-center justify-center rounded bg-slate-100 text-slate-500">
                                            <i class="far fa-image text-[10px]"></i>
                                        </div>
                                        <span class="text-[11px] font-bold text-slate-600">原图尺寸</span>
                                    </div>
                                    <span class="text-[11px] font-bold text-slate-800 tracking-tight">${imgSizeStr}</span>
                                </div>
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

function renderBasicForm({ resumeData, panelState, activeBasicInfoPickerIndex }) {
    const hasUploadedAvatar = hasCustomAvatarImage(resumeData.profileImage);
    const avatarShape = normalizeAvatarShape(resumeData.avatarShape);
    const activeLayout = normalizeResumeLayout(resumeData.resumeLayout);
    const activeTheme = normalizeResumeTheme(resumeData.resumeTheme);
    const isSkillsMode = normalizeProfessionalSkillsMode(resumeData.professionalSkillsMode) === PROFESSIONAL_SKILLS_MODE_SKILLS;
    const isProfileCollapsed = panelState.profile;
    const isThemeCollapsed = panelState.theme;
    const isFontCollapsed = panelState.font ?? false;
    const isSpacingCollapsed = panelState.spacing ?? true;
    const renderLayoutControl = (control) => {
        const settings = RESUME_LAYOUT_CONTROL_SETTINGS[control.key];
        const value = clampResumeLayoutControl(control.key, resumeData[control.key]);
        return `
            <label class="grid gap-2.5 px-3 py-3">
                <div class="flex min-w-0 items-center justify-between gap-3">
                    <p class="min-w-0 truncate text-[11px] font-bold leading-none text-slate-700">${control.label}</p>
                    <output class="shrink-0 rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold leading-none tabular-nums text-slate-600 shadow-[0_1px_2px_rgba(15,23,42,0.03)]" data-layout-control-value="${control.key}">${formatResumeLayoutControlValue(control.key, value, { layout: activeLayout })}</output>
                </div>
                <div class="grid min-w-0 grid-cols-[52px_minmax(0,1fr)_52px] items-center gap-2.5">
                    <span class="shrink-0 text-[9px] font-medium tabular-nums text-slate-400">${formatResumeLayoutControlValue(control.key, settings.min, { layout: activeLayout })}</span>
                    <input type="range" min="${settings.min}" max="${settings.max}" step="${settings.step}" value="${value}" class="h-1.5 min-w-0 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-blue-600" data-section="layoutControls" data-field="${control.key}">
                    <span class="shrink-0 justify-self-end text-[9px] font-medium tabular-nums text-slate-400">${formatResumeLayoutControlValue(control.key, settings.max, { layout: activeLayout })}</span>
                </div>
            </label>
        `;
    };
    const layoutControlSection = `
        <div class="overflow-hidden rounded-2xl border border-slate-200/70 bg-white/65 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] divide-y divide-slate-200/70">
            ${RESUME_LAYOUT_CONTROL_FIELDS.map(renderLayoutControl).join("")}
        </div>
    `;
    const spacingControlSection = `
        <div class="overflow-hidden rounded-2xl border border-slate-200/70 bg-white/65 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] divide-y divide-slate-200/70">
            ${RESUME_LAYOUT_SPACING_CONTROL_FIELDS.map(renderLayoutControl).join("")}
        </div>
    `;

    const contactBlocks = resumeData.basicInfo.map((item, index) => {
        const iconClass = resolveBasicInfoIcon(item);
        const showPicker = activeBasicInfoPickerIndex === index;
        const disableUp = index === 0;
        const disableDown = index === resumeData.basicInfo.length - 1;
        const currentColorOverride = item.iconColor || "theme";
        const globalPaletteKey = resumeData.iconPalette || "theme";
        const finalColorKey = resolveIconColorToneForTheme(index, currentColorOverride, globalPaletteKey, resumeData.resumeTheme);
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
                                ${BASIC_INFO_COLORS.map((color) => {
                                    const isActive = currentColorOverride === color.key;
                                    const ring = isActive ? "ring-2 ring-offset-1 ring-blue-400" : "hover:scale-110";
                                    if (color.key === "theme") {
                                        return `<button type="button" data-action="set-basic-info-color" data-index="${index}" data-color="theme" class="relative flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition-all ${ring}" title="${color.label}"><div class="h-4 w-4 rounded-full bg-theme opacity-80"></div></button>`;
                                    }
                                    return `<button type="button" data-action="set-basic-info-color" data-index="${index}" data-color="${color.key}" class="h-6 w-6 rounded-full ${color.bg} border border-white shadow-sm transition-all ${ring}" title="${color.label}"><div class="h-full w-full rounded-full ${color.bg}"></div></button>`;
                                }).join("")}
                            </div>
                        </div>
                        <p class="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">更换图标</p>
                        <div class="grid grid-cols-4 gap-1">${renderBasicInfoPicker(index, item.iconPreset, item.iconMode)}</div>
                        <div class="mt-3 flex items-center justify-between border-t border-slate-200/60 pt-3">
                            <div class="flex gap-1">
                                <button type="button" data-action="set-basic-info-mode" data-index="${index}" data-mode="preset" class="rounded-md border px-2.5 py-1 text-[10px] font-bold transition-colors ${item.iconMode === 'preset' ? 'border-blue-400 bg-white text-blue-700 shadow-sm' : 'border-slate-200 bg-transparent text-slate-500 hover:bg-white hover:text-slate-700'}">预设图标</button>
                                <button type="button" data-action="set-basic-info-mode" data-index="${index}" data-mode="custom" class="rounded-md border px-2.5 py-1 text-[10px] font-bold transition-colors ${item.iconMode === 'custom' ? 'border-blue-400 bg-white text-blue-700 shadow-sm' : 'border-slate-200 bg-transparent text-slate-500 hover:bg-white hover:text-slate-700'}">高级自定义</button>
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
        <section class="form-section !p-0 overflow-hidden">
            <button type="button" data-action="toggle-section" data-section-id="profile" class="flex w-full items-center justify-between p-4 transition-colors outline-none">
                <div class="flex items-center gap-2">
                    <i class="fas fa-chevron-down text-[12px] text-slate-400 transition-transform duration-200 ${isProfileCollapsed ? '-rotate-90' : ''}"></i>
                    <h2 class="text-sm font-extrabold text-slate-900">个人信息</h2>
                </div>
            </button>
            <div class="px-4 pb-6 transition-all ${isProfileCollapsed ? 'hidden' : 'block'}">
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
                <div class="grid gap-4">
                    <label class="block text-xs font-semibold text-gray-600">文档标题<input name="documentTitle" class="${inputClass}" data-section="basic" data-field="documentTitle" value="${escapeHtml(resumeData.documentTitle)}"></label>
                    <label class="block text-xs font-semibold text-gray-600">姓名<input name="name" class="${inputClass}" data-section="basic" data-field="name" value="${escapeHtml(resumeData.name)}"></label>
                    <label class="block text-xs font-semibold text-gray-600">目标岗位<input name="role" class="${inputClass}" data-section="basic" data-field="role" value="${escapeHtml(resumeData.role)}"></label>
                    <label class="block text-xs font-semibold text-gray-600">个人简介<textarea name="summary" class="${textareaClass}" data-section="basic" data-field="summary">${escapeHtml(resumeData.summary)}</textarea></label>
                </div>
                <div class="mt-6 border-t border-slate-200/80 pt-5">
                    <button type="button" data-action="toggle-section" data-section-id="contact" class="flex w-full items-center justify-between outline-none group/contact pb-2">
                        <div class="flex items-center gap-2">
                            <i class="fas fa-chevron-down text-[10px] text-slate-400 transition-transform duration-200 ${panelState.contact ? '-rotate-90' : ''} group-hover/contact:text-slate-600"></i>
                            <p class="text-[13px] font-bold text-slate-700 group-hover/contact:text-slate-900 transition-colors">联系方式</p>
                        </div>
                        <span class="rounded-full bg-slate-100/80 px-2.5 py-1 text-[9px] font-bold text-slate-400 border border-slate-200/50 transition-opacity duration-200 ${panelState.contact ? 'opacity-0' : 'opacity-100'}">支持拖拽排序</span>
                    </button>
                    <div class="transition-all duration-300 overflow-hidden ${panelState.contact ? 'h-0 opacity-0 pointer-events-none mt-0' : 'h-auto opacity-100 mt-3'}">
                        <div id="basic-info-list" class="grid gap-3 pb-2">${contactBlocks}</div>
                    </div>
                </div>
            </div>
        </section>
        <section class="form-section !p-0 overflow-hidden">
            <button type="button" data-action="toggle-section" data-section-id="theme" class="flex w-full items-center justify-between p-4 transition-colors outline-none">
                <div class="flex items-center gap-2">
                    <i class="fas fa-chevron-down text-[12px] text-slate-400 transition-transform duration-200 ${isThemeCollapsed ? '-rotate-90' : ''}"></i>
                    <h2 class="text-sm font-extrabold text-slate-900">简历排版与主题</h2>
                </div>
            </button>
            <div class="px-4 pb-6 transition-all ${isThemeCollapsed ? 'hidden' : 'block'}">
                <div class="rounded-xl bg-slate-50 p-4 border border-slate-100">
                    <div class="mb-5">
                        <div class="flex items-center justify-between mb-2.5">
                            <div>
                                <p class="text-[12px] font-bold text-slate-700">预览版式</p>
                                <p class="text-[9px] text-slate-400 font-medium mt-0.5">使用同一份简历数据切换不同排版</p>
                            </div>
                        </div>
                        <div class="flex flex-wrap gap-2">
                            ${RESUME_LAYOUT_OPTIONS.map((layout) => {
                                const isActive = activeLayout === layout.key;
                                const swatchClass = layout.key === RESUME_LAYOUT_CLASSIC
                                    ? 'bg-slate-400'
                                    : (layout.key === RESUME_LAYOUT_CARDS
                                        ? 'bg-blue-400'
                                        : (layout.key === RESUME_LAYOUT_MY_RESUME ? 'bg-cyan-500' : 'bg-sky-500'));
                                return `<button type="button" data-action="set-resume-layout" data-layout="${layout.key}" class="flex items-center gap-2 rounded-lg border px-3 py-2 text-[11px] font-bold transition-all ${isActive ? 'border-blue-400 bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-400' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300'}"><span class="inline-flex h-2.5 w-2.5 rounded-full ${swatchClass}"></span>${layout.label}</button>`;
                            }).join("")}
                        </div>
                    </div>
                    <div class="border-t border-slate-200/60 pt-4 mb-5">
                        <button type="button" data-action="toggle-section" data-section-id="font" class="flex w-full items-center justify-between outline-none group/font">
                            <div class="flex items-center gap-2">
                                <i class="fas fa-chevron-down text-[10px] text-slate-400 transition-transform duration-200 ${isFontCollapsed ? '-rotate-90' : ''} group-hover/font:text-slate-600"></i>
                                <p class="text-[13px] font-bold text-slate-700 transition-colors group-hover/font:text-slate-900">字体</p>
                            </div>
                            <span class="rounded-full border border-slate-200/50 bg-slate-100/80 px-2.5 py-1 text-[9px] font-bold text-slate-400">${RESUME_LAYOUT_CONTROL_FIELDS.length} 项</span>
                        </button>
                        <div class="transition-all duration-300 overflow-hidden ${isFontCollapsed ? 'h-0 opacity-0 pointer-events-none mt-0' : 'h-auto opacity-100 mt-3'}">
                            <div class="grid gap-3">${layoutControlSection}</div>
                        </div>
                    </div>
                    <div class="border-t border-slate-200/60 pt-4 mb-5">
                        <button type="button" data-action="toggle-section" data-section-id="spacing" class="flex w-full items-center justify-between outline-none group/spacing">
                            <div class="flex items-center gap-2">
                                <i class="fas fa-chevron-down text-[10px] text-slate-400 transition-transform duration-200 ${isSpacingCollapsed ? '-rotate-90' : ''} group-hover/spacing:text-slate-600"></i>
                                <p class="text-[13px] font-bold text-slate-700 transition-colors group-hover/spacing:text-slate-900">间距与版式</p>
                            </div>
                            <span class="rounded-full border border-slate-200/50 bg-slate-100/80 px-2.5 py-1 text-[9px] font-bold text-slate-400">${RESUME_LAYOUT_SPACING_CONTROL_FIELDS.length} 项</span>
                        </button>
                        <div class="transition-all duration-300 overflow-hidden ${isSpacingCollapsed ? 'h-0 opacity-0 pointer-events-none mt-0' : 'h-auto opacity-100 mt-3'}">
                            <div class="grid gap-3">${spacingControlSection}</div>
                        </div>
                    </div>
                    <div class="border-t border-slate-200/60 pt-4 mb-5">
                        <div class="flex items-center justify-between mb-3">
                            <p class="text-[13px] font-bold text-slate-700">简历主题主色</p>
                        </div>
                        <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">纯粹单色</p>
                        <div class="flex flex-wrap gap-2 mb-3.5">
                            ${RESUME_THEME_OPTIONS.filter((theme) => theme.type === "solid").map((theme) => {
                                const isActive = activeTheme === theme.key;
                                return `<button type="button" data-action="set-resume-theme" data-theme="${theme.key}" class="h-6 w-6 rounded-full shadow-sm border border-slate-200/50 transition-all ${isActive ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'hover:scale-110 hover:shadow-md'}" style="background: ${theme.swatch};" title="${theme.label}"></button>`;
                            }).join("")}
                        </div>
                        <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">设计感双拼</p>
                        <div class="flex flex-wrap gap-2">
                            ${RESUME_THEME_OPTIONS.filter((theme) => theme.type === "gradient").map((theme) => {
                                const isActive = activeTheme === theme.key;
                                return `<button type="button" data-action="set-resume-theme" data-theme="${theme.key}" class="h-6 w-6 rounded-full shadow-sm border border-slate-200/50 transition-all ${isActive ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'hover:scale-110 hover:shadow-md'}" style="background: ${theme.swatch};" title="${theme.label}"></button>`;
                            }).join("")}
                        </div>
                    </div>
                    <div class="border-t border-slate-200/60 pt-4">
                        <div class="flex items-center justify-between mb-2.5">
                            <div>
                                <p class="text-[12px] font-bold text-slate-700">基本信息图标配色</p>
                                <p class="text-[9px] text-slate-400 font-medium mt-0.5">智能无限循环取色</p>
                            </div>
                        </div>
                        <div class="flex flex-wrap gap-2">
                            ${ICON_PALETTE_OPTIONS.map((palette) => {
                                const isActive = (resumeData.iconPalette || "theme") === palette.key;
                                const previewDots = palette.preview.map((color) => `<span class="h-2.5 w-2.5 rounded-full border border-white/50" style="background-color: ${color};"></span>`).join('');
                                return `<button type="button" data-action="set-icon-palette" data-palette="${palette.key}" class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition-all ${isActive ? 'border-blue-400 bg-blue-50 text-blue-700 shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300'}"><div class="flex -space-x-1">${previewDots}</div>${palette.label}</button>`;
                            }).join("")}
                        </div>
                    </div>
                    ${isSkillsMode ? `
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
                                ].map((color) => {
                                    const isActive = (resumeData.skillBadgeColor || "theme-soft") === color.key || (resumeData.skillBadgeColor === "theme" && color.key === "theme-soft");
                                    return `<button type="button" data-action="set-skill-badge-color" data-color="${color.key}" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-all ${isActive ? 'border-blue-400 bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-400' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}"><span class="h-2.5 w-2.5 rounded-full border ${color.class}"></span>${color.label}</button>`;
                                }).join("")}
                            </div>
                        </div>
                    ` : `
                        <div class="border-t border-slate-200/60 pt-4 mt-4">
                            <div class="rounded-xl border border-slate-200/70 bg-slate-50/70 px-3.5 py-3">
                                <p class="text-[11px] font-bold text-slate-600">专业技能标签配色</p>
                                <p class="mt-1 text-[10px] font-medium text-slate-400">当前为文本摘要模式，已隐藏标签配色设置；切回“标签分组”后会继续沿用原配色。</p>
                            </div>
                        </div>
                    `}
                    <div class="border-t border-slate-200/60 pt-4 mt-4">
                        <div class="flex items-center justify-between mb-3">
                            <div>
                                <p class="text-[12px] font-bold text-slate-700">显示经历时间轴</p>
                                <p class="text-[9px] text-slate-400 font-medium mt-0.5">关闭后隐藏工作经历与项目经验左侧时间轴</p>
                            </div>
                            <button type="button" data-action="toggle-experience-timeline" class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors ${resumeData.showExperienceTimeline ? 'bg-blue-500' : 'bg-slate-300'}">
                                <span class="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${resumeData.showExperienceTimeline ? 'translate-x-4' : 'translate-x-0'}"></span>
                            </button>
                        </div>
                        <div class="flex items-center justify-between mb-3">
                            <div>
                                <p class="text-[12px] font-bold text-slate-700">彩色工作时间轴竖线</p>
                                <p class="text-[9px] text-slate-400 font-medium mt-0.5">仅控制工作经历时间轴竖线是否跟随后台主色</p>
                            </div>
                            <button type="button" data-action="toggle-theme-timeline" class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors ${resumeData.useThemeTimeline ? 'bg-blue-500' : 'bg-slate-300'}">
                                <span class="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${resumeData.useThemeTimeline ? 'translate-x-4' : 'translate-x-0'}"></span>
                            </button>
                        </div>
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

function renderBasicInfoForm() {
    return "";
}

function renderReorderableSectionShell({ sectionId, title, isCollapsed, collapsedActionHtml = "", contentHtml }) {
    return `
        <section class="form-section sortable-form-section !p-0 overflow-hidden" data-section-id="${sectionId}">
            <div class="flex w-full items-center justify-between">
                <button type="button" class="form-section-drag-handle ml-3 flex h-8 w-8 shrink-0 cursor-grab items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-slate-100 hover:text-slate-600 active:cursor-grabbing" title="拖拽排序" aria-label="拖拽排序">
                    <i class="fas fa-grip-vertical text-[11px]"></i>
                </button>
                <button type="button" data-action="toggle-section" data-section-id="${sectionId}" class="flex flex-1 items-center gap-2 p-4 pl-2 transition-colors outline-none text-left">
                    <i class="fas fa-chevron-down text-[12px] text-slate-400 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}"></i>
                    <h2 class="text-sm font-extrabold text-slate-900">${title}</h2>
                </button>
                ${collapsedActionHtml}
            </div>
            <div class="px-4 pb-6 ${isCollapsed ? 'hidden' : 'block'}">
                ${contentHtml}
            </div>
        </section>
    `;
}

function renderEducationForm({ resumeData, panelState }) {
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

    return renderReorderableSectionShell({
        sectionId: "education",
        title: "教育背景",
        isCollapsed,
        collapsedActionHtml: `
            <div class="pr-4 ${isCollapsed ? '' : 'hidden'}">
                <button type="button" data-action="add-education" class="text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors z-10 relative">+ 新增</button>
            </div>
        `,
        contentHtml: `
            <div class="grid gap-3">${blocks}</div>
            <button type="button" data-action="add-education" class="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-3 text-[12px] font-bold text-slate-500 transition-all hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600"><i class="fas fa-plus"></i> 新增教育经历</button>
        `
    });
}

function renderSkillsForm({ resumeData, panelState }) {
    const isCollapsed = panelState.skills;
    const professionalSkillsMode = normalizeProfessionalSkillsMode(resumeData.professionalSkillsMode);
    const isSkillsMode = professionalSkillsMode === PROFESSIONAL_SKILLS_MODE_SKILLS;
    const activeModeLabel = isSkillsMode ? "标签分组" : "文本摘要";
    const professionalSkillsModeButtons = PROFESSIONAL_SKILLS_MODE_OPTIONS.map((option) => {
        const isActive = professionalSkillsMode === option.key;
        const swatchClass = option.key === PROFESSIONAL_SKILLS_MODE_SKILLS ? "bg-emerald-400" : "bg-violet-400";
        return `
            <button type="button" data-action="set-professional-skills-mode" data-mode="${option.key}" class="rounded-xl border px-3 py-2.5 text-left transition-all ${isActive ? 'border-blue-400 bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-400' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300'}">
                <span class="flex items-center gap-2 text-[11px] font-bold">
                    <span class="inline-flex h-2.5 w-2.5 rounded-full ${swatchClass}"></span>
                    ${option.label}
                </span>
            </button>
        `;
    }).join("");
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
    const textEditor = `
        <div class="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.02)] transition-all hover:border-slate-200 hover:shadow-[0_4px_16px_rgba(15,23,42,0.04)]">
            <div class="mb-4 flex items-center justify-between gap-3 border-b border-slate-100/80 pb-3">
                <p class="text-[13px] font-bold text-slate-700">文本摘要</p>
                <span class="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[9px] font-bold text-slate-500">经典 / 卡片版</span>
            </div>
            <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500">技能摘要<textarea name="professionalSkillsText" class="${textareaClass}" data-section="basic" data-field="professionalSkillsText">${escapeHtml(resumeData.professionalSkillsText || "")}</textarea></label>
        </div>
    `;
    const skillsEditor = `
        <div class="mb-3 flex items-center justify-between gap-3 px-1">
            <p class="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">标签分组</p>
            <span class="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[9px] font-bold text-emerald-700">${resumeData.skills.length} 组</span>
        </div>
        <div class="grid gap-3">${blocks}</div>
        <button type="button" data-action="add-skill" class="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-3 text-[12px] font-bold text-slate-500 transition-all hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-600"><i class="fas fa-plus"></i> 新增技能分组</button>
    `;

    return renderReorderableSectionShell({
        sectionId: "skills",
        title: "专业技能",
        isCollapsed,
        collapsedActionHtml: isSkillsMode ? `
            <div class="pr-4 ${isCollapsed ? '' : 'hidden'}">
                <button type="button" data-action="add-skill" class="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors z-10 relative">+ 新增</button>
            </div>
        ` : "",
        contentHtml: `
            <div class="mb-3 rounded-xl border border-slate-200/80 bg-slate-50/70 p-4">
                <div class="flex items-center justify-between gap-3">
                    <div>
                        <p class="text-[12px] font-bold text-slate-700">经典 / 卡片版技能展示</p>
                    </div>
                    <span class="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[9px] font-bold ${isSkillsMode ? 'text-emerald-600' : 'text-violet-600'}">${activeModeLabel}</span>
                </div>
                <div class="mt-3 grid gap-2 sm:grid-cols-2">
                    ${professionalSkillsModeButtons}
                </div>
            </div>
            ${isSkillsMode ? skillsEditor : textEditor}
        `
    });
}

function renderExperiencesForm({ resumeData, panelState }) {
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
                <label class="mt-1 flex w-fit cursor-pointer items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 transition-colors hover:bg-slate-100"><input name="experience-highlight-${index}" type="checkbox" class="mt-0.5 h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500" data-section="experiences" data-index="${index}" data-field="highlight" ${item.highlight ? "checked" : ""}><span class="grid gap-0.5"><span class="text-[12px] font-bold text-slate-600">启用文本高亮</span><span class="text-[10px] text-slate-400">工作内容支持 **...** 强调重点</span></span></label>
                <label class="flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 transition-colors hover:bg-slate-100"><input name="experience-work-badge-enabled-${index}" type="checkbox" class="h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500" data-section="experiences" data-index="${index}" data-field="workBadgeEnabled" ${item.workBadgeEnabled ? "checked" : ""}><span class="text-[12px] font-bold text-slate-600">显示经历徽章</span></label>
                ${item.workBadgeEnabled ? `<label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500">经历徽章文案<input name="experience-work-badge-label-${index}" class="${inputClass}" data-section="experiences" data-index="${index}" data-field="workBadgeLabel" value="${escapeHtml(item.workBadgeLabel || DEFAULT_EXPERIENCE_WORK_BADGE_LABEL)}" placeholder="${escapeHtml(DEFAULT_EXPERIENCE_WORK_BADGE_LABEL)}"></label>` : ""}
                <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500">工作内容 <span class="text-[9px] font-medium text-slate-400 normal-case tracking-normal ml-1">（每行一段描述）</span><textarea name="experience-bullets-${index}" class="${textareaClass}" data-section="experiences" data-index="${index}" data-field="bullets" data-multiline="true">${escapeHtml(arrayToLines(item.bullets))}</textarea></label>
            </div>
        </div>
    `)).join("");

    return renderReorderableSectionShell({
        sectionId: "experiences",
        title: "工作经历",
        isCollapsed,
        collapsedActionHtml: `
            <div class="pr-4 ${isCollapsed ? '' : 'hidden'}">
                <button type="button" data-action="add-experience" class="text-[11px] font-bold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-lg transition-colors z-10 relative">+ 新增</button>
            </div>
        `,
        contentHtml: `
            <div class="grid gap-3">${blocks}</div>
            <button type="button" data-action="add-experience" class="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-3 text-[12px] font-bold text-slate-500 transition-all hover:border-amber-400 hover:bg-amber-50 hover:text-amber-600"><i class="fas fa-plus"></i> 新增工作经历</button>
        `
    });
}

function renderProjectsForm({ resumeData, panelState }) {
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
                    <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500">角色 / 徽章文案<input name="project-badge-${index}" class="${inputClass}" data-section="projects" data-index="${index}" data-field="badge" value="${escapeHtml(item.badge)}"></label>
                    <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500">项目时间<input name="project-period-${index}" class="${inputClass}" data-section="projects" data-index="${index}" data-field="period" value="${escapeHtml(item.period || "")}"></label>
                </div>
                <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500">徽章样式
                    <select name="project-badge-style-${index}" class="mt-1.5 w-full appearance-none rounded-xl border-2 border-transparent bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-800 transition-all hover:bg-slate-200/60 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10" data-section="projects" data-index="${index}" data-field="badgeStyle">
                        <option value="primary" ${item.badgeStyle === "primary" ? "selected" : ""}>🟢 主色（跟随主题）</option>
                        <option value="secondary" ${item.badgeStyle === "secondary" ? "selected" : ""}>⚪️ 次级（灰色）</option>
                    </select>
                </label>
                <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500">技术栈 <span class="text-[9px] font-medium text-slate-400 normal-case tracking-normal ml-1">（每行输入一个）</span><textarea name="project-techs-${index}" class="${textareaClass} !min-h-[80px]" data-section="projects" data-index="${index}" data-field="techs" data-multiline="true">${escapeHtml(arrayToLines(item.techs))}</textarea></label>
                <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500">项目亮点 <span class="text-[9px] font-medium text-slate-400 normal-case tracking-normal ml-1">（每行一条）</span><textarea name="project-highlights-${index}" class="${textareaClass}" data-section="projects" data-index="${index}" data-field="highlights" data-multiline="true">${escapeHtml(arrayToLines(item.highlights || []))}</textarea></label>
                <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500">项目描述<textarea name="project-description-${index}" class="${textareaClass}" data-section="projects" data-index="${index}" data-field="description">${escapeHtml(item.description)}</textarea></label>
            </div>
        </div>
    `)).join("");

    return renderReorderableSectionShell({
        sectionId: "projects",
        title: "项目经验",
        isCollapsed,
        collapsedActionHtml: `
            <div class="pr-4 ${isCollapsed ? '' : 'hidden'}">
                <button type="button" data-action="add-project" class="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg transition-colors z-10 relative">+ 新增</button>
            </div>
        `,
        contentHtml: `
            <div class="grid gap-3">${blocks}</div>
            <button type="button" data-action="add-project" class="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-3 text-[12px] font-bold text-slate-500 transition-all hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600"><i class="fas fa-plus"></i> 新增项目经验</button>
        `
    });
}

export function renderFormHtml(state) {
    const reorderableSectionRenderers = {
        education: renderEducationForm,
        skills: renderSkillsForm,
        experiences: renderExperiencesForm,
        projects: renderProjectsForm
    };
    const sortableSectionsHtml = normalizeSectionOrder(state.resumeData?.sectionOrder)
        .map((sectionId) => {
            const renderSection = reorderableSectionRenderers[sectionId];
            return renderSection ? renderSection(state) : "";
        })
        .join("");

    return [
        renderBasicForm(state),
        renderBasicInfoForm(state),
        `<div id="form-sections-sortable" class="grid gap-4">${sortableSectionsHtml}</div>`,
        renderAvatarCropModal(state)
    ].join("");
}
