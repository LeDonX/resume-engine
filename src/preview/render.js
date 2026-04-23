import {
    DEFAULT_EXPERIENCE_WORK_BADGE_LABEL,
    FALLBACK_AVATAR,
    PAGE_BREAK_BUFFER_PX,
    PROFESSIONAL_SKILLS_MODE_TEXT,
    RESUME_LAYOUT_CARDS,
    RESUME_LAYOUT_CLASSIC,
    RESUME_LAYOUT_MY_RESUME,
    RESUME_LAYOUT_MY_RESUME3
} from "../core/config.js";
import { escapeHtml, normalizeStringArray, pickArray, pickText } from "../core/utils.js";
import {
    buildProjectRenderModel,
    buildResumeThemeInlineStyle,
    buildResumeThemeVars,
    getRenderableProjects,
    getResumeLayoutClass,
    getResumeThemeOption,
    normalizeProfessionalSkillsMode,
    normalizeRenderMode,
    normalizeResumeLayout,
    normalizeSectionOrder,
    renderDynamicIcon,
    renderIconToken,
    resolveExperienceWorkBadgeEnabled,
    resolveExperienceWorkBadgeLabel,
    resolveBasicInfoIcon,
    resolveBasicInfoIconSlot,
    resolveIconColorToneForTheme,
    resolveSectionTitleIcon
} from "../core/resume-model.js";
import {
    getAvatarFrameContainerClass,
    getAvatarImageSource,
    getAvatarImageStyle,
    getCachedAvatarImageMeta,
    hasCustomAvatarImage,
    normalizeAvatarFrame
} from "../avatar/avatar-utils.js";

function renderClassicBasicInfo(basicInfo, renderOptions) {
    const list = pickArray(basicInfo).filter((item) => pickText(item?.value, "").trim() !== "");
    if (!list.length) {
        return "";
    }

    const shadowClass = renderOptions.useFlatIcons ? "" : "shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]";

    const items = list.map((info, index) => {
        const icon = resolveBasicInfoIcon(info, {
            iconSet: renderOptions.basicInfoIconSet,
            resumeLayout: renderOptions.resumeLayout
        });
        const text = escapeHtml(pickText(info.value, ""));
        const currentColorOverride = info.iconColor || "theme";
        const globalPaletteKey = renderOptions.iconPalette || "theme";
        const finalColorKey = resolveIconColorToneForTheme(index, currentColorOverride, globalPaletteKey, renderOptions.resumeTheme);
        const iconHtml = renderDynamicIcon(icon, finalColorKey, "resume-classic-basic-info-icon rounded-full text-[13px]", shadowClass);

        return `
            <li class="resume-classic-basic-info-item">
                <div class="resume-classic-basic-info-copy">
                    ${iconHtml}
                    <span class="resume-classic-basic-info-text min-w-0 flex-1 break-words text-gray-700">${text}</span>
                </div>
            </li>
        `;
    }).join("");

    return `<ul class="resume-classic-basic-info-list">${items}</ul>`;
}

function renderClassicSectionHeading(title, iconToken) {
    return `
        <div class="resume-classic-section-heading flex items-center">
            <div class="resume-section-icon resume-classic-section-icon flex items-center justify-center rounded-full">${renderIconToken(iconToken, "text-lg")}</div>
            <h3 class="resume-classic-section-heading-title font-bold text-gray-800">${escapeHtml(title)}</h3>
        </div>
    `;
}

function renderClassicSectionTitle(title, data, sectionKey, defaultVariant = "icon") {
    return renderResolvedSectionTitle(title, sectionKey, data);
}

function renderClassicEducation(education) {
    const list = pickArray(education);
    if (!list.length) {
        return '<p class="resume-classic-empty-state text-gray-500">可在左侧表单中填写教育背景</p>';
    }

    return list.map((item, index) => {
        const blockClass = index === list.length - 1 ? "resume-classic-stack-item" : "resume-classic-stack-item resume-classic-stack-item-spaced";
        return `
            <div class="${blockClass}">
                <p class="resume-classic-item-title font-bold text-gray-800">${escapeHtml(pickText(item.degree, ""))}</p>
                <p class="resume-classic-item-subtitle resume-accent-company font-medium">${escapeHtml(pickText(item.school, ""))}</p>
                <p class="resume-classic-item-period text-gray-500"><i class="far fa-calendar-alt mr-1"></i> ${escapeHtml(pickText(item.period, ""))}</p>
            </div>
        `;
    }).join("");
}

function renderClassicSkills(skills) {
    const groups = pickArray(skills);
    if (!groups.length) {
        return '<p class="resume-classic-empty-state text-gray-500">可在左侧表单中填写专业技能</p>';
    }

    return groups.map((group, index) => {
        const groupClass = index === groups.length - 1 ? "resume-classic-stack-item" : "resume-classic-stack-item resume-classic-stack-item-spaced";
        const tags = normalizeStringArray(group.items).map((item) => (
            `<span class="resume-classic-skill-tag rounded-full bg-gray-200 font-medium text-gray-700">${escapeHtml(item)}</span>`
        )).join("");

        return `
            <div class="${groupClass}">
                <p class="resume-classic-group-title font-semibold text-gray-700">${escapeHtml(pickText(group.name, ""))}</p>
                <div class="resume-classic-skill-tag-list flex flex-wrap">${tags}</div>
            </div>
        `;
    }).join("");
}

function renderClassicSkillsText(skillsText) {
    const text = pickText(skillsText, "").trim();
    return text
        ? `<p class="resume-classic-summary-text text-justify text-gray-600">${escapeHtml(text)}</p>`
        : '<p class="resume-classic-empty-state text-gray-500">可在左侧表单中填写专业技能</p>';
}

function getOrderedSectionIds(data) {
    return normalizeSectionOrder(data?.sectionOrder);
}

function appendOrderedBlocks(blocks, orderedSectionIds, sectionBlockMap) {
    for (const sectionId of orderedSectionIds) {
        const nextBlocks = sectionBlockMap[sectionId];
        if (!nextBlocks) {
            continue;
        }
        if (Array.isArray(nextBlocks)) {
            blocks.push(...nextBlocks);
            continue;
        }
        blocks.push(nextBlocks);
    }

    return blocks;
}

function isProfessionalSkillsTextMode(data) {
    return normalizeProfessionalSkillsMode(data?.professionalSkillsMode) === PROFESSIONAL_SKILLS_MODE_TEXT;
}

function renderExperienceRichText(text, enabled, emphasisClass = "") {
    const source = String(text ?? "").trim();
    if (!source) {
        return "";
    }
    if (!enabled) {
        return escapeHtml(source);
    }

    return source
        .split(/(\*\*.*?\*\*)/g)
        .filter(Boolean)
        .map((part) => {
            const match = part.match(/^\*\*(.*?)\*\*$/);
            if (!match) {
                return escapeHtml(part);
            }
            const classAttr = emphasisClass ? ` class="${emphasisClass}"` : "";
            return `<strong${classAttr}>${escapeHtml(match[1])}</strong>`;
        })
        .join("");
}

function renderExperienceWorkBadge(item, badgeClass, resumeLayout) {
    if (!resolveExperienceWorkBadgeEnabled(item, resumeLayout)) {
        return "";
    }

    const classes = ["resume-work-badge", badgeClass].filter(Boolean).join(" ");
    return `<span class="${classes}">${renderMyResumeIcon("award", "my-resume-badge-icon")}<span>${escapeHtml(resolveExperienceWorkBadgeLabel(item, resumeLayout))}</span></span>`;
}

function renderProjectIconBadge(project, badgeClass = "") {
    const label = pickText(project?.iconBadgeLabel, "").trim();
    if (!label) {
        return "";
    }

    const classes = ["resume-project-icon-badge", badgeClass].filter(Boolean).join(" ");
    return `<span class="${classes}">${renderMyResumeIcon("award", "my-resume-badge-icon")}<span>${escapeHtml(label)}</span></span>`;
}

function renderClassicExperienceItem(item, index, total, renderOptions) {
    const showTimeline = Boolean(renderOptions.showExperienceTimeline);
    const lineClass = renderOptions.useThemeTimeline ? "resume-soft-divider" : "resume-timeline-soft-divider";
    const spacingClass = index === total - 1 ? "" : "resume-classic-entry-spaced";
    const wrapperClass = showTimeline
        ? `${spacingClass} resume-classic-entry relative pl-6 border-l-2 ${lineClass} resume-avoid-break`.trim()
        : `${spacingClass} resume-classic-entry relative resume-avoid-break`.trim();
    const highlightEnabled = Boolean(item?.highlight);
    const workBadge = renderExperienceWorkBadge(item, "resume-primary-badge resume-entry-flag", renderOptions.resumeLayout);
    const bullets = normalizeStringArray(item.bullets)
        .map((bullet) => (`<li>${renderExperienceRichText(bullet, highlightEnabled)}</li>`))
        .join("");

    return `
        <div class="${wrapperClass}">
            ${showTimeline ? '<div class="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full bg-gray-300 ring-4 ring-white"></div>' : ""}
            <div class="resume-classic-entry-head flex flex-col md:flex-row md:items-start md:justify-between">
                <div>
                    <h4 class="resume-classic-entry-title flex flex-wrap items-center gap-2 font-bold text-gray-800"><span class="min-w-0">${escapeHtml(pickText(item.title, ""))}</span>${workBadge}</h4>
                    <p class="resume-classic-entry-company font-medium text-gray-600">${escapeHtml(pickText(item.company, ""))}</p>
                </div>
                <div class="resume-classic-entry-period whitespace-nowrap font-medium text-gray-500">
                    ${escapeHtml(pickText(item.period, ""))}
                </div>
            </div>
            <ul class="resume-classic-bullet-list list-inside list-disc text-gray-600">${bullets}</ul>
        </div>
    `;
}

function renderClassicProjectCard(project) {
    const projectInfo = buildProjectRenderModel(project);
    const badgeClass = projectInfo.badgeStyle === "primary"
        ? "resume-primary-badge resume-classic-project-badge rounded font-semibold"
        : "resume-project-secondary-badge resume-classic-project-badge rounded font-semibold";
    const techTags = projectInfo.techs.map((tech) => (
        `<span class="resume-classic-tech-tag rounded border border-gray-200 bg-white text-gray-500">${escapeHtml(tech)}</span>`
    )).join("");
    const badgeText = projectInfo.badge;
    const badgeHtml = badgeText ? `<span class="${badgeClass}">${escapeHtml(badgeText)}</span>` : "";
    const iconBadgeHtml = renderProjectIconBadge(projectInfo);
    const periodHtml = projectInfo.period ? `<span class="resume-period-pill">${escapeHtml(projectInfo.period)}</span>` : "";
    const metaHtml = (badgeHtml || iconBadgeHtml || periodHtml)
        ? `<div class="flex flex-wrap items-center justify-end gap-2">${badgeHtml}${iconBadgeHtml}${periodHtml}</div>`
        : "";
    const highlightsHtml = projectInfo.highlights.length
        ? `<ul class="resume-bullet-list">${projectInfo.highlights.map((highlight) => (`<li>${escapeHtml(highlight)}</li>`)).join("")}</ul>`
        : "";
    const detailsHtml = projectInfo.description || highlightsHtml
        ? `
            <div class="resume-project-details">
                ${projectInfo.description ? `<p class="resume-classic-project-description text-justify text-gray-600">${escapeHtml(projectInfo.description)}</p>` : ""}
                ${highlightsHtml}
            </div>
        `
        : "";

    return `
        <div class="resume-classic-project-card resume-avoid-break rounded-lg border border-gray-100 bg-gray-50 transition-shadow hover:shadow-md">
            <div class="resume-classic-project-head flex items-center justify-between gap-4">
                <h4 class="resume-classic-project-title flex flex-wrap items-center gap-2 font-bold text-gray-800"><span class="min-w-0">${escapeHtml(projectInfo.name || "未填写项目名称")}</span></h4>
                ${metaHtml}
            </div>
            ${detailsHtml}
            ${techTags ? `<div class="resume-classic-tech-list flex flex-wrap${(projectInfo.description || projectInfo.highlights.length) ? " mt-3" : ""}">${techTags}</div>` : ""}
        </div>
    `;
}

function buildClassicEducationSectionBlocks(data) {
    return [
        `
            <div class="resume-classic-section resume-avoid-break">
                ${renderClassicSectionTitle("教育背景", data, "education", "plain")}
                ${renderClassicEducation(data.education)}
            </div>
        `
    ];
}

function buildClassicGroupedSkillsSectionBlocks(data) {
    if (isProfessionalSkillsTextMode(data)) {
        return [];
    }

    return [
        `
            <div class="resume-classic-section resume-avoid-break">
                ${renderClassicSectionTitle("专业技能", data, "skills", "plain")}
                ${renderClassicSkills(data.skills)}
            </div>
        `
    ];
}

function buildClassicSkillsTextSectionBlocks(data) {
    if (!isProfessionalSkillsTextMode(data)) {
        return [];
    }

    return [
        `
            <div class="resume-classic-section resume-avoid-break">
                ${renderResolvedSectionTitle("专业技能", "skills", data)}
                ${renderClassicSkillsText(data.professionalSkillsText)}
            </div>
        `
    ];
}

function buildClassicExperienceSectionBlocks(data) {
    const blocks = [];
    const experienceList = pickArray(data.experiences);

    if (experienceList.length) {
        const experienceItems = experienceList.map((item, index) => renderClassicExperienceItem(item, index, experienceList.length, data));
        blocks.push(`
            <div class="resume-classic-section resume-avoid-break">
                ${renderResolvedSectionTitle("工作经历", "experiences", data)}
                ${experienceItems[0]}
            </div>
        `);

        for (let index = 1; index < experienceItems.length; index += 1) {
            blocks.push(experienceItems[index]);
        }

        return blocks;
    }

    blocks.push(`
        <div class="resume-classic-section resume-avoid-break">
            ${renderResolvedSectionTitle("工作经历", "experiences", data)}
            <p class="resume-classic-empty-state text-gray-500">可在左侧表单中填写工作经历</p>
        </div>
    `);
    return blocks;
}

function buildClassicProjectSectionBlocks(data) {
    const blocks = [];
    const projectList = getRenderableProjects(data.projects, data.resumeLayout);

    if (projectList.length) {
        const projectCards = projectList.map((project) => renderClassicProjectCard(project));
        blocks.push(`
            <div class="resume-classic-section-tight resume-avoid-break">
                ${renderResolvedSectionTitle("项目经验", "projects", data)}
                ${projectCards[0]}
            </div>
        `);

        for (let index = 1; index < projectCards.length; index += 1) {
            const wrapperClass = index === projectCards.length - 1 ? "resume-avoid-break" : "resume-avoid-break resume-classic-project-wrapper-spaced";
            blocks.push(`<div class="${wrapperClass}">${projectCards[index]}</div>`);
        }

        return blocks;
    }

    blocks.push(`
        <div class="resume-avoid-break">
            ${renderResolvedSectionTitle("项目经验", "projects", data)}
            <p class="resume-classic-empty-state text-gray-500">可在左侧表单中填写项目经验</p>
        </div>
    `);
    return blocks;
}

function buildClassicLeftColumnBlocks(data, profileImage) {
    const basicInfoContent = renderClassicBasicInfo(data.basicInfo, data);
    const avatarMeta = data.avatarImageMeta || getCachedAvatarImageMeta(data.profileImage);
    const avatarFrame = normalizeAvatarFrame(data.avatarFrame, avatarMeta);
    const avatarStyle = getAvatarImageStyle(avatarFrame, avatarMeta);
    const avatarFrameClass = getAvatarFrameContainerClass(data.avatarShape);
    const blocks = [
        `
            <div class="resume-classic-avatar-section resume-avoid-break flex justify-center">
                <div class="resume-classic-avatar-shell relative overflow-hidden border-4 border-white shadow-md ${avatarFrameClass}">
                    <img src="${escapeHtml(profileImage)}" alt="Profile Picture" class="pointer-events-none select-none" style="${avatarStyle}" data-testid="avatar-preview-image" data-avatar-zoom="${escapeHtml(String(avatarFrame.zoom))}" data-avatar-offset-x="${escapeHtml(String(avatarFrame.offsetX))}" data-avatar-offset-y="${escapeHtml(String(avatarFrame.offsetY))}" onerror="this.onerror=null;this.src='${FALLBACK_AVATAR}'">
                </div>
            </div>
        `
    ];

    if (basicInfoContent) {
        blocks.push(`
            <div class="resume-classic-section resume-avoid-break">
                ${renderClassicSectionTitle("基本信息", data, "basicInfo", "plain")}
                ${basicInfoContent}
            </div>
        `);
    }

    appendOrderedBlocks(blocks, getOrderedSectionIds(data), {
        education: buildClassicEducationSectionBlocks(data),
        skills: buildClassicGroupedSkillsSectionBlocks(data)
    });
    return blocks;
}

function buildClassicRightColumnBlocks(data) {
    const summaryText = pickText(data.summary, "").trim() || "可在左侧表单中填写个人简介";
    const blocks = [
        `
            <div class="resume-soft-divider resume-classic-hero resume-avoid-break border-b">
                <h1 class="resume-classic-name font-black tracking-tight text-gray-900">${escapeHtml(pickText(data.name, ""))}</h1>
                <h2 class="resume-role-text resume-classic-role font-medium tracking-wide">${escapeHtml(pickText(data.role, ""))}</h2>
            </div>
        `,
        `
            <div class="resume-classic-section resume-avoid-break">
                ${renderResolvedSectionTitle("个人简介", "summary", data)}
                <p class="resume-classic-summary-text text-justify text-gray-600">${escapeHtml(summaryText)}</p>
            </div>
        `
    ];

    appendOrderedBlocks(blocks, getOrderedSectionIds(data), {
        skills: buildClassicSkillsTextSectionBlocks(data),
        experiences: buildClassicExperienceSectionBlocks(data),
        projects: buildClassicProjectSectionBlocks(data)
    });
    return blocks;
}

function renderCardSectionHeader(title, iconToken, iconToneClass = "", iconShadowClass = "", large = false) {
    return `
        <div class="resume-card-title-row${large ? " resume-card-title-row-lg" : ""}">
            <div class="resume-section-icon resume-card-title-icon ${iconToneClass} ${iconShadowClass}">${renderIconToken(iconToken, large ? "text-base" : "text-sm")}</div>
            <div class="min-w-0 flex-1">
                <h3 class="resume-card-title${large ? " resume-card-title-lg" : ""}">${escapeHtml(title)}</h3>
            </div>
        </div>
    `;
}

function renderCardBasicInfo(basicInfo, renderOptions) {
    const list = pickArray(basicInfo).filter((item) => pickText(item?.value, "").trim() !== "");
    if (!list.length) return "";

    const shadowClass = renderOptions.useFlatIcons ? "" : "shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]";

    const items = list.map((info, index) => {
        const icon = resolveBasicInfoIcon(info, {
            iconSet: renderOptions.basicInfoIconSet,
            resumeLayout: renderOptions.resumeLayout
        });
        const text = escapeHtml(pickText(info.value, ""));
        const currentColorOverride = info.iconColor || "theme";
        const globalPaletteKey = renderOptions.iconPalette || "theme";
        const finalColorKey = resolveIconColorToneForTheme(index, currentColorOverride, globalPaletteKey, renderOptions.resumeTheme);
        const iconHtml = renderDynamicIcon(icon, finalColorKey, "resume-info-icon h-8 w-8 rounded-full text-[12px]", shadowClass);

        return `
            <li class="resume-info-item resume-contact-row">
                <div class="shrink-0">${iconHtml}</div>
                <div class="min-w-0 flex-1">
                    <p class="resume-info-value">${text}</p>
                </div>
            </li>
        `;
    }).join("");

    return `<ul class="resume-info-list resume-contact-list">${items}</ul>`;
}

function renderCardEducationEntry(item) {
    const school = pickText(item?.school, "").trim();
    const degree = pickText(item?.degree, "").trim();
    const period = pickText(item?.period, "").trim();

    return `
        <div class="resume-education-item">
            <div class="resume-education-main min-w-0 flex-1">
                ${school ? `<h4 class="resume-meta-title">${escapeHtml(school)}</h4>` : ""}
                ${degree ? `<p class="resume-meta-subtitle">${escapeHtml(degree)}</p>` : ""}
            </div>
            ${period ? `<span class="resume-period-pill">${escapeHtml(period)}</span>` : ""}
        </div>
    `;
}

function buildCardEducationBlocks(data, iconShadowClass) {
    const education = data.education;
    const list = pickArray(education).filter((item) => (
        pickText(item?.school, "").trim()
        || pickText(item?.degree, "").trim()
        || pickText(item?.period, "").trim()
    ));

    const body = list.length
        ? `<div class="resume-education-list">${list.map((item) => renderCardEducationEntry(item)).join("")}</div>`
        : '<p class="resume-empty-state">可在左侧表单中填写教育背景</p>';

    return [
        `
            <article class="resume-card resume-side-section-card resume-card-widget resume-avoid-break">
            ${renderResolvedSectionTitle("教育背景", "education", data, { iconShadowClass })}
                ${body}
            </article>
        `
    ];
}

function renderSkillTags(items, badgeColorPref) {
    return normalizeStringArray(items).map((item) => {
        let badgeClass = "";

        if (badgeColorPref === "theme-soft" || badgeColorPref === "theme") {
            badgeClass = "resume-primary-badge resume-skill-tag-theme";
        } else if (badgeColorPref === "theme-outline") {
            badgeClass = "resume-skill-tag-outline";
        } else if (badgeColorPref === "gray") {
            badgeClass = "bg-gray-100 text-gray-700 border border-gray-200/80";
        } else if (badgeColorPref === "slate") {
            badgeClass = "bg-slate-100 text-slate-700 border border-slate-200/80";
        } else if (badgeColorPref === "zinc") {
            badgeClass = "bg-zinc-100 text-zinc-700 border border-zinc-200/80";
        } else {
            badgeClass = "resume-primary-badge resume-skill-tag-theme";
        }

        return `<span class="${badgeClass} resume-skill-tag">${escapeHtml(item)}</span>`;
    }).join("");
}

function renderCardSkillGroup(group, badgeColorPref) {
    const groupName = pickText(group?.name, "").trim();
    const tags = renderSkillTags(group?.items, badgeColorPref);

    return `
        <div class="resume-skill-group">
            ${groupName ? `<p class="resume-skill-group-name">${escapeHtml(groupName)}</p>` : ""}
            ${tags ? `<div class="resume-skill-tag-list">${tags}</div>` : '<p class="resume-empty-state">可补充技能标签</p>'}
        </div>
    `;
}

function renderCardSkillsBody(skills, badgeColorPref) {
    const groups = pickArray(skills).filter((group) => (
        pickText(group?.name, "").trim() || normalizeStringArray(group?.items).length
    ));

    return groups.length
        ? `<div class="resume-skill-widget-list">${groups.map((group) => renderCardSkillGroup(group, badgeColorPref)).join("")}</div>`
        : '<p class="resume-empty-state">可在左侧表单中填写专业技能</p>';
}

function renderCardSkillsText(skillsText) {
    const text = pickText(skillsText, "").trim();
    return text
        ? `<p class="resume-summary-text">${escapeHtml(text)}</p>`
        : '<p class="resume-empty-state">可在左侧表单中填写专业技能</p>';
}

function buildCardSkillBlocks(data, iconShadowClass, badgeColorPref) {
    const body = renderCardSkillsBody(data.skills, badgeColorPref);

    return [
        `
            <article class="resume-card resume-side-section-card resume-card-widget resume-avoid-break">
            ${renderResolvedSectionTitle("专业技能", "skills", data, { iconShadowClass })}
                ${body}
            </article>
        `
    ];
}

function buildCardSkillsTextSectionBlocks(data, iconShadowClass) {
    if (!isProfessionalSkillsTextMode(data)) {
        return [];
    }

    return [
        `
            <article class="resume-card resume-card-lg resume-card-widget resume-section-card resume-avoid-break">
                ${renderResolvedSectionTitle("专业技能", "skills", data, { iconShadowClass, large: true })}
                <div class="resume-section-card-body">
                    ${renderCardSkillsText(data.professionalSkillsText)}
                </div>
            </article>
        `
    ];
}

function buildCardExperienceSectionBlocks(data, iconShadowClass) {
    const experienceList = pickArray(data.experiences).filter((item) => (
        pickText(item?.company, "").trim()
        || pickText(item?.title, "").trim()
        || pickText(item?.period, "").trim()
        || normalizeStringArray(item?.bullets).length
    ));

    return [
        `
            <article class="resume-card resume-card-lg resume-card-widget resume-section-card resume-experience-section-card resume-avoid-break">
                ${renderResolvedSectionTitle("工作经历", "experiences", data, { iconShadowClass, large: true })}
                <div class="resume-section-card-body resume-card-timeline-list">
                    ${experienceList.length
                        ? experienceList.map((item, index) => renderCardExperienceItem(item, index, experienceList.length, data.useThemeTimeline, data.showExperienceTimeline)).join("")
                        : '<p class="resume-empty-state">可在左侧表单中填写工作经历</p>'}
                </div>
            </article>
        `
    ];
}

function buildCardProjectSectionBlocks(data, iconShadowClass) {
    const projectList = getRenderableProjects(data.projects, data.resumeLayout);

    return [
        `
            <article class="resume-card resume-card-lg resume-card-widget resume-section-card resume-project-section-card resume-avoid-break">
                ${renderResolvedSectionTitle("项目经验", "projects", data, { iconShadowClass, large: true })}
                <div class="resume-section-card-body resume-card-timeline-list">
                    ${projectList.length
                        ? projectList.map((item, index) => renderCardProjectCard(item, index, projectList.length, data.showExperienceTimeline)).join("")
                        : '<p class="resume-empty-state">可在左侧表单中填写项目经验</p>'}
                </div>
            </article>
        `
    ];
}

function renderCardExperienceItem(item, index, total, useThemeTimeline, showExperienceTimeline) {
    const showTimeline = true;
    const lineClass = "resume-timeline-rail-neutral";
    const dotClass = "resume-timeline-dot-accent";
    const companyText = pickText(item?.company, "").trim() || "未填写公司";
    const roleText = pickText(item?.title, "").trim();
    const periodText = pickText(item?.period, "").trim();
    const highlightEnabled = Boolean(item?.highlight);
    const workBadge = renderExperienceWorkBadge(item, "resume-primary-badge resume-entry-flag", RESUME_LAYOUT_CARDS);
    const bullets = normalizeStringArray(item?.bullets)
        .map((bullet) => (`<li>${renderExperienceRichText(bullet, highlightEnabled)}</li>`))
        .join("");
    const bulletList = bullets
        ? `<ul class="resume-bullet-list">${bullets}</ul>`
        : '<p class="resume-empty-state">可在左侧表单中补充工作经历要点</p>';

    return `
        <article class="resume-timeline-entry resume-experience-entry${showTimeline ? " resume-timeline-entry-has-rail" : ""}" data-resume-item-index="${index}" data-resume-item-total="${total}">
            ${showTimeline && index < total - 1 ? `<div class="resume-timeline-rail ${lineClass}" aria-hidden="true"></div>` : ""}
            ${showTimeline ? `<div class="resume-timeline-dot ${dotClass}" aria-hidden="true"></div>` : ""}
            <div class="resume-timeline-entry-content">
                <div class="resume-entry-head">
                    <div class="min-w-0 flex-1">
                        <h4 class="resume-entry-company flex flex-wrap items-center gap-2"><span class="min-w-0">${escapeHtml(companyText)}</span>${workBadge}</h4>
                    </div>
                    ${periodText ? `<span class="resume-period-pill resume-period-pill-tight">${escapeHtml(periodText)}</span>` : ""}
                </div>
                ${roleText ? `<p class="resume-entry-role">${escapeHtml(roleText)}</p>` : ""}
                ${bulletList}
            </div>
        </article>
    `;
}

function renderCardProjectCard(project, index, total, showExperienceTimeline) {
    const showTimeline = true;
    const projectInfo = buildProjectRenderModel(project);
    const badgeText = projectInfo.badge;
    const badgeStyle = projectInfo.badgeStyle;
    const badgeClass = badgeStyle === "primary"
        ? "resume-primary-badge resume-project-badge"
        : "resume-project-secondary-badge resume-project-badge";
    const iconBadgeHtml = renderProjectIconBadge(projectInfo);
    const periodHtml = projectInfo.period ? `<span class="resume-period-pill resume-period-pill-tight">${escapeHtml(projectInfo.period)}</span>` : "";
    const dotClass = "resume-project-timeline-dot";
    const highlightsHtml = projectInfo.highlights.length
        ? `<ul class="resume-bullet-list">${projectInfo.highlights.map((highlight) => (`<li>${escapeHtml(highlight)}</li>`)).join("")}</ul>`
        : "";
    const detailsHtml = projectInfo.description || highlightsHtml
        ? `
            <div class="resume-project-details">
                ${projectInfo.description ? `<p class="resume-project-description">${escapeHtml(projectInfo.description)}</p>` : ""}
                ${highlightsHtml}
            </div>
        `
        : "";
    const techTags = projectInfo.techs.length
        ? `<div class="resume-tech-tag-list${(projectInfo.description || projectInfo.highlights.length) ? " mt-3" : ""}">${projectInfo.techs.map((tech) => (`<span class="resume-tech-tag">${escapeHtml(tech)}</span>`)).join("")}</div>`
        : "";

    return `
        <article class="resume-timeline-entry resume-project-item${showTimeline ? " resume-timeline-entry-has-rail" : ""}">
            ${showTimeline && index < total - 1 ? '<div class="resume-timeline-rail resume-timeline-rail-neutral" aria-hidden="true"></div>' : ""}
            ${showTimeline ? `<div class="resume-timeline-dot ${dotClass}" aria-hidden="true"></div>` : ""}
            <div class="resume-timeline-entry-content">
                <div class="resume-entry-head">
                    <div class="resume-project-head">
                        <div class="resume-project-title-row">
                            <h4 class="resume-entry-title">${escapeHtml(projectInfo.name || "未填写项目名称")}</h4>
                            ${badgeText ? `<span class="${badgeClass}">${escapeHtml(badgeText)}</span>` : ""}
                            ${iconBadgeHtml}
                            ${periodHtml}
                        </div>
                        ${detailsHtml}
                        ${techTags}
                    </div>
                </div>
            </div>
        </article>
    `;
}

function buildCardLeftColumnBlocks(data, profileImage) {
    const basicInfoContent = renderCardBasicInfo(data.basicInfo, data);
    const avatarMeta = data.avatarImageMeta || getCachedAvatarImageMeta(data.profileImage);
    const avatarFrame = normalizeAvatarFrame(data.avatarFrame, avatarMeta);
    const avatarStyle = getAvatarImageStyle(avatarFrame, avatarMeta);
    const avatarFrameClass = getAvatarFrameContainerClass(data.avatarShape);
    const iconShadowClass = data.useFlatIcons ? "" : "shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_8px_18px_var(--resume-accent-glow)]";
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

    blocks.push(`
        <article class="resume-card resume-card-widget resume-contact-card resume-avoid-break">
            ${renderResolvedSectionTitle("联系方式", "contact", data, { iconShadowClass })}
            ${basicInfoContent || '<p class="resume-empty-state">可在左侧表单中填写联系方式</p>'}
        </article>
    `);

    appendOrderedBlocks(blocks, getOrderedSectionIds(data), {
        education: buildCardEducationBlocks(data, iconShadowClass),
        skills: isProfessionalSkillsTextMode(data)
            ? []
            : buildCardSkillBlocks(data, iconShadowClass, data.skillBadgeColor || "theme-soft")
    });
    return blocks;
}

function buildCardRightColumnBlocks(data) {
    const iconShadowClass = data.useFlatIcons ? "" : "shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_6px_14px_var(--resume-accent-glow)]";
    const summaryText = pickText(data.summary, "").trim() || "可在左侧表单中填写个人简介";
    const blocks = [
        `
            <article class="resume-card resume-card-lg resume-card-widget resume-summary-card resume-avoid-break">
                ${renderResolvedSectionTitle("关于我", "summary", data, { iconShadowClass, large: true })}
                <p class="resume-summary-text">${escapeHtml(summaryText)}</p>
            </article>
        `
    ];

    appendOrderedBlocks(blocks, getOrderedSectionIds(data), {
        skills: buildCardSkillsTextSectionBlocks(data, iconShadowClass),
        experiences: buildCardExperienceSectionBlocks(data, iconShadowClass),
        projects: buildCardProjectSectionBlocks(data, iconShadowClass)
    });

    return blocks;
}

function renderMyResumeIcon(name, className = "") {
    return renderIconToken(`my:${name}`, className);
}

function buildMyResumeInitials(name) {
    const rawName = pickText(name, "").trim();
    if (!rawName) return "CV";

    const latinParts = rawName.split(/\s+/).filter(Boolean);
    const latinInitials = latinParts
        .map((part) => part.charAt(0))
        .join("")
        .replace(/[^a-z0-9]/gi, "")
        .slice(0, 2)
        .toUpperCase();

    if (latinInitials) return latinInitials;

    const compact = rawName.replace(/\s+/g, "");
    return compact.slice(0, 2).toUpperCase();
}

function getRenderableProfessionalSkillGroups(skills) {
    return pickArray(skills)
        .map((group) => ({
            name: pickText(group?.name, "").trim(),
            items: normalizeStringArray(group?.items)
        }))
        .filter((group) => group.name || group.items.length);
}

function renderMyResumeSectionHeading(title, iconToken) {
    return `
        <div class="my-resume-section-heading-row">
            ${renderIconToken(iconToken, "my-resume-section-icon")}
            <h2 class="my-resume-section-heading">${escapeHtml(title)}</h2>
        </div>
    `;
}

function renderMyResumeHighlightedText(text) {
    const source = text.trim();
    if (!source) return "";

    return source
        .split(/(\*\*.*?\*\*)/g)
        .filter(Boolean)
        .map((part) => {
            const match = part.match(/^\*\*(.*?)\*\*$/);
            if (!match) {
                return escapeHtml(part);
            }
            return `<strong class="my-resume-skill-strong">${escapeHtml(match[1])}</strong>`;
        })
        .join("");
}

function renderMyResumeSkillsText(data) {
    const text = pickText(data.professionalSkillsText, "").trim();
    if (text) {
        return renderMyResumeHighlightedText(text);
    }

    const groups = pickArray(data.skills)
        .map((group) => {
            const name = pickText(group?.name, "").trim();
            const items = normalizeStringArray(group?.items);
            if (!name && !items.length) {
                return "";
            }
            const prefix = name ? `${escapeHtml(name)}：` : "";
            return `${prefix}${items.map((item) => escapeHtml(item)).join("、")}`;
        })
        .filter(Boolean);

    return groups.join("；");
}

function renderMyResumeSkillGroups(skills) {
    const groups = getRenderableProfessionalSkillGroups(skills);
    if (!groups.length) {
        return '<p class="my-resume-empty-state">可在左侧表单中填写专业技能</p>';
    }

    return `
        <div class="my-resume-skills-grid">
            ${groups.map((group) => (`
                <article class="my-resume-skill-group">
                    ${group.name ? `<h3 class="my-resume-skill-group-title">${escapeHtml(group.name)}</h3>` : ""}
                    ${group.items.length
                        ? `<div class="my-resume-skill-tag-list">${group.items.map((item) => (`<span class="my-resume-skill-tag">${escapeHtml(item)}</span>`)).join("")}</div>`
                        : '<p class="my-resume-empty-state">可补充技能标签</p>'}
                </article>
            `)).join("")}
        </div>
    `;
}

function renderMyResumeExperienceText(item) {
    const bullets = normalizeStringArray(item?.bullets);
    const highlightEnabled = Boolean(item?.highlight);
    if (!bullets.length) {
        return '<p class="my-resume-empty-state">可在左侧表单中补充工作经历内容</p>';
    }
    return `<p class="my-resume-experience-description">${bullets.map((bullet) => renderExperienceRichText(bullet, highlightEnabled, "my-resume-skill-strong")).join(" ")}</p>`;
}

function renderMyResumeExperienceEntry(item, index, total) {
    const company = pickText(item?.company, "").trim() || "未填写公司";
    const role = pickText(item?.title, "").trim();
    const period = pickText(item?.period, "").trim();
    const workBadge = renderExperienceWorkBadge(item, "my-resume-highlight-badge", RESUME_LAYOUT_MY_RESUME);
    const showTail = index < total - 1;
    const roleRow = role
        ? `
                <div class="my-resume-experience-role-row">
                    <p class="my-resume-experience-role">${escapeHtml(role)}</p>
                </div>
            `
        : "";

    return `
        <article class="my-resume-experience-entry${showTail ? " my-resume-experience-entry-tail" : ""}">
            <span class="my-resume-experience-rail" aria-hidden="true"></span>
            <span class="my-resume-experience-dot" aria-hidden="true"></span>
            <div class="my-resume-experience-body">
                <div class="my-resume-experience-top">
                    <div class="flex min-w-0 flex-wrap items-center gap-2">
                        <h3 class="my-resume-experience-company min-w-0">${escapeHtml(company)}</h3>
                        ${workBadge}
                    </div>
                    ${period ? `<span class="my-resume-period">${renderMyResumeIcon("calendar", "my-resume-period-icon")}<span>${escapeHtml(period)}</span></span>` : ""}
                </div>
                ${roleRow}
                ${renderMyResumeExperienceText(item)}
            </div>
        </article>
    `;
}

function renderMyResumeProjectCard(project) {
    const projectInfo = buildProjectRenderModel(project);
    const title = projectInfo.name || "未填写项目名称";
    const badge = projectInfo.badge;
    const period = projectInfo.period;
    const badgeClass = projectInfo.badgeStyle === "primary"
        ? "resume-primary-badge resume-project-badge"
        : "resume-project-secondary-badge resume-project-badge";
    const iconBadgeHtml = renderProjectIconBadge(projectInfo);
    const detailsHtml = projectInfo.description || projectInfo.highlights.length
        ? `
            <div class="my-resume-project-details">
                ${projectInfo.description ? `<p class="my-resume-project-description">${escapeHtml(projectInfo.description)}</p>` : ""}
                ${projectInfo.highlights.length
                    ? `<ul class="resume-bullet-list">${projectInfo.highlights.map((highlight) => (`<li>${renderMyResumeHighlightedText(highlight)}</li>`)).join("")}</ul>`
                    : ""}
            </div>
        `
        : "";

    return `
        <article class="my-resume-project-card">
            <div class="my-resume-project-head">
                <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-center gap-2">
                        <h3 class="my-resume-project-title">
                            ${renderMyResumeIcon("zap", "my-resume-project-title-icon")}
                            <span>${escapeHtml(title)}</span>
                        </h3>
                        ${badge ? `<span class="${badgeClass}">${escapeHtml(badge)}</span>` : ""}
                        ${iconBadgeHtml}
                    </div>
                    ${period
                        ? `<div class="mt-1"><span class="my-resume-period">${renderMyResumeIcon("calendar", "my-resume-period-icon")}<span>${escapeHtml(period)}</span></span></div>`
                        : ""}
                </div>
                ${projectInfo.techs.length
                    ? `<div class="my-resume-project-tags">${projectInfo.techs.map((tag) => (`<span class="my-resume-project-tag">${escapeHtml(tag)}</span>`)).join("")}</div>`
                    : ""}
            </div>
            ${detailsHtml}
        </article>
    `;
}

function renderMyResumeAvatar(data, profileImage) {
    if (hasCustomAvatarImage(data.profileImage)) {
        const avatarMeta = data.avatarImageMeta || getCachedAvatarImageMeta(data.profileImage);
        const avatarFrame = normalizeAvatarFrame(data.avatarFrame, avatarMeta);
        const avatarStyle = getAvatarImageStyle(avatarFrame, avatarMeta);
        return `
            <div class="my-resume-avatar-shell my-resume-avatar-image-shell">
                <img src="${escapeHtml(profileImage)}" alt="Profile Picture" class="pointer-events-none select-none" style="${avatarStyle}" data-testid="avatar-preview-image" data-avatar-zoom="${escapeHtml(String(avatarFrame.zoom))}" data-avatar-offset-x="${escapeHtml(String(avatarFrame.offsetX))}" data-avatar-offset-y="${escapeHtml(String(avatarFrame.offsetY))}" onerror="this.onerror=null;this.src='${FALLBACK_AVATAR}'">
            </div>
        `;
    }

    return `
        <div class="my-resume-avatar-shell my-resume-avatar-fallback-shell" aria-hidden="true">
            <div class="my-resume-avatar-fallback">${escapeHtml(buildMyResumeInitials(pickText(data.name, "")))}</div>
        </div>
    `;
}

function buildMyResumeLayoutBlocks(data, profileImage) {
    const contactItems = pickArray(data.basicInfo)
        .filter((item) => pickText(item?.value, "").trim() !== "")
        .slice(0, 6);
    const contactEntries = contactItems.map((item) => ({
        value: pickText(item?.value, "").trim(),
        iconSlot: resolveBasicInfoIconSlot(item),
        iconToken: resolveBasicInfoIcon(item, {
            iconSet: data.basicInfoIconSet,
            resumeLayout: data.resumeLayout
        })
    }));
    const contactLinkIndex = contactEntries.findIndex((entry) => entry.iconSlot === "website" || entry.iconSlot === "github");
    const contactRows = contactLinkIndex >= 2 && contactLinkIndex < contactEntries.length - 1
        ? [contactEntries.slice(0, contactLinkIndex), contactEntries.slice(contactLinkIndex)]
        : [contactEntries];
    const summaryText = pickText(data.summary, "").trim();
    const showSkillsText = isProfessionalSkillsTextMode(data);
    const skillsText = showSkillsText ? renderMyResumeSkillsText(data) : "";
    const orderedSectionIds = getOrderedSectionIds(data);
    const experienceList = pickArray(data.experiences).filter((item) => (
        pickText(item?.company, "").trim()
        || pickText(item?.title, "").trim()
        || pickText(item?.period, "").trim()
        || normalizeStringArray(item?.bullets).length
    ));
    const projectList = getRenderableProjects(data.projects, data.resumeLayout);
    const educationList = pickArray(data.education).filter((item) => (
        pickText(item?.school, "").trim()
        || pickText(item?.degree, "").trim()
        || pickText(item?.period, "").trim()
    ));

    const headerBlock = `
        <header class="my-resume-header resume-avoid-break">
            <div class="my-resume-header-main">
                <div class="my-resume-header-copy">
                    <div class="my-resume-name-row">
                        <h1 class="my-resume-name">${escapeHtml(pickText(data.name, ""))}</h1>
                        ${pickText(data.role, "").trim() ? `<span class="my-resume-role">${escapeHtml(pickText(data.role, ""))}</span>` : ""}
                    </div>
                    ${contactEntries.length
                        ? `<div class="my-resume-contact-grid${contactRows.length > 1 ? " my-resume-contact-grid-split" : ""}">${contactRows.map((row) => (`
                            <div class="my-resume-contact-row">
                                ${row.map((entry) => (`
                                <div class="my-resume-contact-item">
                                    <span class="my-resume-contact-icon" aria-hidden="true">${renderIconToken(entry.iconToken, "my-resume-contact-icon-svg")}</span>
                                    <span class="my-resume-contact-text" data-contact-icon="${escapeHtml(entry.iconSlot)}">${escapeHtml(entry.value)}</span>
                                </div>
                                `)).join("")}
                            </div>
                        `)).join("")}</div>`
                        : ""}
                </div>
                <div class="my-resume-header-avatar">
                    ${renderMyResumeAvatar(data, profileImage)}
                </div>
            </div>
        </header>
    `;

    const blocks = [headerBlock];

    blocks.push(`
        <section class="my-resume-section resume-avoid-break">
            ${renderResolvedSectionTitle("个人概况", "summary", data)}
            ${summaryText
                ? `<p class="my-resume-paragraph">${escapeHtml(summaryText)}</p>`
                : '<p class="my-resume-empty-state">可在左侧表单中填写个人简介</p>'}
        </section>
    `);

    appendOrderedBlocks(blocks, orderedSectionIds, {
        skills: [
            `
                <section class="my-resume-section resume-avoid-break">
                    ${renderResolvedSectionTitle("专业技能", "skills", data)}
                    ${showSkillsText
                        ? (skillsText
                            ? `<p class="my-resume-paragraph my-resume-skills-paragraph">${skillsText}</p>`
                            : '<p class="my-resume-empty-state">可在左侧表单中填写专业技能</p>')
                        : renderMyResumeSkillGroups(data.skills)}
                </section>
            `
        ],
        experiences: experienceList.length
            ? [
                `
                    <section class="my-resume-section resume-avoid-break">
                        ${renderResolvedSectionTitle("工作经历", "experiences", data)}
                        ${renderMyResumeExperienceEntry(experienceList[0], 0, experienceList.length)}
                    </section>
                `,
                ...experienceList.slice(1).map((item, index) => (`
                    <div class="my-resume-flow-block resume-avoid-break">
                        ${renderMyResumeExperienceEntry(item, index + 1, experienceList.length)}
                    </div>
                `))
            ]
            : [
                `
                    <section class="my-resume-section resume-avoid-break">
                        ${renderResolvedSectionTitle("工作经历", "experiences", data)}
                        <p class="my-resume-empty-state">可在左侧表单中填写工作经历</p>
                    </section>
                `
            ],
        projects: projectList.length
            ? [
                `
                    <section class="my-resume-section resume-avoid-break">
                        ${renderResolvedSectionTitle("核心项目", "projects", data)}
                        ${renderMyResumeProjectCard(projectList[0])}
                    </section>
                `,
                ...projectList.slice(1).map((project) => (`
                    <div class="my-resume-flow-block resume-avoid-break">
                        ${renderMyResumeProjectCard(project)}
                    </div>
                `))
            ]
            : [
                `
                    <section class="my-resume-section resume-avoid-break">
                        ${renderResolvedSectionTitle("核心项目", "projects", data)}
                        <p class="my-resume-empty-state">可在左侧表单中填写项目经验</p>
                    </section>
                `
            ],
        education: [
            `
                <section class="my-resume-section resume-avoid-break">
                    ${renderResolvedSectionTitle("教育背景", "education", data)}
                    ${educationList.length
                        ? `<div class="my-resume-education-list">${educationList.map((item) => {
                            const school = pickText(item?.school, "").trim();
                            const degree = pickText(item?.degree, "").trim();
                            const period = pickText(item?.period, "").trim();
                            return `
                                <div class="my-resume-education-row">
                                    <div class="my-resume-education-main">
                                        ${school ? `<span class="my-resume-education-school">${escapeHtml(school)}</span>` : ""}
                                        ${(school && degree) ? '<span class="my-resume-education-separator">|</span>' : ""}
                                        ${degree ? `<span class="my-resume-education-degree">${escapeHtml(degree)}</span>` : ""}
                                    </div>
                                    ${period ? `<span class="my-resume-education-period">${escapeHtml(period)}</span>` : ""}
                                </div>
                            `;
                        }).join("")}</div>`
                        : '<p class="my-resume-empty-state">可在左侧表单中填写教育背景</p>'}
                </section>
            `
        ]
    });

    return {
        leftBlocks: [],
        rightBlocks: blocks
    };
}

function renderMyResume3Icon(name, className = "") {
    return renderIconToken(`my3:${name}`, className);
}

function buildMyResume3Initials(name) {
    const rawName = pickText(name, "").trim();
    if (!rawName) return "CV";

    const latinInitials = rawName
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part.charAt(0))
        .join("")
        .replace(/[^a-z0-9]/gi, "")
        .slice(0, 2)
        .toUpperCase();

    if (latinInitials) return latinInitials;
    return rawName.replace(/\s+/g, "").slice(0, 2).toUpperCase();
}

function renderMyResume3RichText(text) {
    const source = String(text ?? "").trim();
    if (!source) return "";

    return source
        .split(/(\*\*.*?\*\*)/g)
        .filter(Boolean)
        .map((part) => {
            const match = part.match(/^\*\*(.*?)\*\*$/);
            if (!match) {
                return escapeHtml(part);
            }
            return `<strong class="my-resume3-emphasis">${escapeHtml(match[1])}</strong>`;
        })
        .join("");
}

function renderMyResume3BulletList(items, emptyText = "") {
    const list = normalizeStringArray(items);
    if (!list.length) {
        return emptyText ? `<p class="my-resume3-empty-state">${escapeHtml(emptyText)}</p>` : "";
    }

    return `
        <ul class="my-resume3-bullet-list">
            ${list.map((item) => (`<li class="my-resume3-bullet-item">${renderMyResume3RichText(item)}</li>`)).join("")}
        </ul>
    `;
}

function renderMyResume3SectionHeading(title, iconToken) {
    return `
        <div class="my-resume3-section-heading-row">
            <span class="my-resume3-section-icon-box" aria-hidden="true">${renderIconToken(iconToken, "my-resume3-section-icon")}</span>
            <h2 class="my-resume3-section-heading">${escapeHtml(title)}</h2>
        </div>
    `;
}

function getCardSectionTitleToneClass(sectionKey) {
    if (sectionKey === "education") {
        return "resume-card-icon-education";
    }
    if (sectionKey === "skills") {
        return "resume-card-icon-skills";
    }
    if (sectionKey === "experiences") {
        return "resume-card-icon-experience";
    }
    if (sectionKey === "projects") {
        return "resume-card-icon-project";
    }
    if (sectionKey === "contact" || sectionKey === "basicInfo") {
        return "resume-card-icon-contact";
    }
    return "resume-card-icon-about";
}

function renderResolvedSectionTitle(title, sectionKey, data, options = {}) {
    const resumeLayout = normalizeResumeLayout(data.resumeLayout);
    const iconToken = resolveSectionTitleIcon(sectionKey, resumeLayout, data.sectionTitleIconSet);

    if (resumeLayout === RESUME_LAYOUT_CARDS) {
        const iconShadowClass = options.iconShadowClass ?? (data.useFlatIcons ? "" : "shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_6px_14px_var(--resume-accent-glow)]");
        return renderCardSectionHeader(title, iconToken, getCardSectionTitleToneClass(sectionKey), iconShadowClass, Boolean(options.large));
    }

    if (resumeLayout === RESUME_LAYOUT_MY_RESUME) {
        return renderMyResumeSectionHeading(title, iconToken);
    }

    if (resumeLayout === RESUME_LAYOUT_MY_RESUME3) {
        return renderMyResume3SectionHeading(title, iconToken);
    }

    return renderClassicSectionHeading(title, iconToken);
}

function renderMyResume3SkillGroups(skills) {
    const groups = getRenderableProfessionalSkillGroups(skills);
    if (!groups.length) {
        return '<p class="my-resume3-empty-state">可在左侧表单中填写专业技能</p>';
    }

    return `
        <div class="my-resume3-skills-grid">
            ${groups.map((group) => (`
                <article class="my-resume3-skill-group">
                    ${group.name ? `<h3 class="my-resume3-skill-group-name">${escapeHtml(group.name)}</h3>` : ""}
                    ${group.items.length
                        ? `<div class="my-resume3-skill-item-list">${group.items.map((item) => (`<span class="my-resume3-skill-item">${escapeHtml(item)}</span>`)).join("")}</div>`
                        : '<p class="my-resume3-empty-state">可补充技能标签</p>'}
                </article>
            `)).join("")}
        </div>
    `;
}

function getMyResume3ExternalHref(value) {
    const source = String(value ?? "").trim();
    if (!source) return "";
    if (/^https?:\/\//i.test(source) || /^mailto:/i.test(source)) {
        return source;
    }
    if (source.includes("github.com") || source.includes("www.") || /^[\w.-]+\.[a-z]{2,}/i.test(source)) {
        return `https://${source.replace(/^https?:\/\//i, "")}`;
    }
    return "";
}

function shouldMyResume3MetaItemSpanWide(value, iconSlot, href) {
    const compactValue = String(value ?? "")
        .trim()
        .replace(/^https?:\/\//i, "")
        .replace(/^mailto:/i, "");

    if (!compactValue) return false;
    if (!href) {
        return compactValue.length > 24;
    }
    const pathSegments = compactValue.split("/").filter(Boolean);
    const hasComplexPath = /[?#]/.test(compactValue) || pathSegments.length > 2;
    const wideThreshold = iconSlot === "website" ? 34 : 30;
    return compactValue.length > wideThreshold || (compactValue.length > 24 && hasComplexPath);
}

function renderMyResume3MetaItem(item, data) {
    const value = pickText(item?.value, "").trim();
    if (!value) return "";

    const iconSlot = resolveBasicInfoIconSlot(item);
    const iconToken = resolveBasicInfoIcon(item, {
        iconSet: data.basicInfoIconSet,
        resumeLayout: data.resumeLayout
    });
    const href = getMyResume3ExternalHref(value);
    const isWide = shouldMyResume3MetaItemSpanWide(value, iconSlot, href);
    const textHtml = href
        ? `<a class="my-resume3-meta-text my-resume3-meta-link" href="${escapeHtml(href)}" target="_blank" rel="noreferrer">${escapeHtml(value)}</a>`
        : `<span class="my-resume3-meta-text">${escapeHtml(value)}</span>`;

    return `
        <div class="my-resume3-meta-item${isWide ? " my-resume3-meta-item-wide" : ""}">
            <span class="my-resume3-meta-icon" aria-hidden="true">${renderIconToken(iconToken, "my-resume3-meta-icon-svg")}</span>
            ${textHtml}
        </div>
    `;
}

function renderMyResume3Avatar(data, profileImage) {
    const avatarContent = hasCustomAvatarImage(data.profileImage)
        ? (() => {
            const avatarMeta = data.avatarImageMeta || getCachedAvatarImageMeta(data.profileImage);
            const avatarFrame = normalizeAvatarFrame(data.avatarFrame, avatarMeta);
            const avatarStyle = getAvatarImageStyle(avatarFrame, avatarMeta);
            return `<img src="${escapeHtml(profileImage)}" alt="Profile Picture" class="my-resume3-avatar-image pointer-events-none select-none" style="${avatarStyle}" data-testid="avatar-preview-image" data-avatar-zoom="${escapeHtml(String(avatarFrame.zoom))}" data-avatar-offset-x="${escapeHtml(String(avatarFrame.offsetX))}" data-avatar-offset-y="${escapeHtml(String(avatarFrame.offsetY))}" onerror="this.onerror=null;this.src='${FALLBACK_AVATAR}'">`;
        })()
        : `<div class="my-resume3-avatar-fallback">${escapeHtml(buildMyResume3Initials(pickText(data.name, "")))}</div>`;

    return `
        <div class="my-resume3-avatar-card">
            <div class="my-resume3-avatar-media">
                ${avatarContent}
            </div>
        </div>
    `;
}

function getMyResume3SkillItems(data) {
    const directTextItems = normalizeStringArray(pickText(data.professionalSkillsText, ""));
    if (directTextItems.length) {
        return directTextItems;
    }

    return pickArray(data.skills)
        .map((group) => {
            const name = pickText(group?.name, "").trim();
            const items = normalizeStringArray(group?.items);
            if (!name && !items.length) {
                return "";
            }
            if (!name) {
                return items.join("、");
            }
            return `**${name}：**${items.join("、")}`;
        })
        .filter(Boolean);
}

function renderMyResume3ExperienceEntry(item, index, total) {
    const company = pickText(item?.company, "").trim() || "未填写公司";
    const role = pickText(item?.title, "").trim();
    const period = pickText(item?.period, "").trim();
    const highlightEnabled = Boolean(item?.highlight);
    const workBadge = renderExperienceWorkBadge(item, "my-resume3-experience-badge", RESUME_LAYOUT_MY_RESUME3);
    const details = normalizeStringArray(item?.bullets);
    const showTail = index < total - 1;

    return `
        <article class="my-resume3-timeline-entry my-resume3-work-entry${showTail ? " my-resume3-timeline-entry-tail" : ""}">
            <span class="my-resume3-timeline-rail" aria-hidden="true"></span>
            <span class="my-resume3-timeline-dot" aria-hidden="true"></span>
            <div class="my-resume3-timeline-body">
                <div class="my-resume3-timeline-head">
                    <div class="my-resume3-work-heading">
                        <h3 class="my-resume3-timeline-title">
                            <span class="my-resume3-timeline-title-main">${escapeHtml(company)}</span>
                            ${role ? `<span class="my-resume3-timeline-separator">/</span><span class="my-resume3-work-role">${escapeHtml(role)}</span>` : ""}
                        </h3>
                        ${workBadge}
                    </div>
                    ${period ? `<span class="my-resume3-date">${escapeHtml(period)}</span>` : ""}
                </div>
                ${details.length
                    ? `<ul class="my-resume3-bullet-list">${details.map((detail) => (`<li class="my-resume3-bullet-item">${renderExperienceRichText(detail, highlightEnabled, "my-resume3-emphasis")}</li>`)).join("")}</ul>`
                    : '<p class="my-resume3-empty-state">可在左侧表单中补充工作经历要点</p>'}
            </div>
        </article>
    `;
}

function renderMyResume3EducationEntry(item, index, total) {
    const school = pickText(item?.school, "").trim() || "未填写学校";
    const degree = pickText(item?.degree, "").trim();
    const period = pickText(item?.period, "").trim();
    const showTail = index < total - 1;

    return `
        <article class="my-resume3-timeline-entry my-resume3-education-entry${showTail ? " my-resume3-timeline-entry-tail" : ""}">
            <span class="my-resume3-timeline-rail" aria-hidden="true"></span>
            <span class="my-resume3-timeline-dot my-resume3-education-dot" aria-hidden="true"></span>
            <div class="my-resume3-timeline-body">
                <div class="my-resume3-timeline-head">
                    <h3 class="my-resume3-timeline-title">
                        <span class="my-resume3-timeline-title-main">${escapeHtml(school)}</span>
                        ${degree ? `<span class="my-resume3-timeline-separator">/</span><span class="my-resume3-education-role">${escapeHtml(degree)}</span>` : ""}
                    </h3>
                    ${period ? `<span class="my-resume3-date">${escapeHtml(period)}</span>` : ""}
                </div>
            </div>
        </article>
    `;
}

function renderMyResume3ProjectCard(project) {
    const projectInfo = buildProjectRenderModel(project);
    const title = projectInfo.name || "未填写项目名称";
    const badge = projectInfo.badge;
    const period = projectInfo.period;
    const iconBadgeHtml = renderProjectIconBadge(projectInfo, "my-resume3-project-icon-badge");
    const detailsHtml = projectInfo.description || projectInfo.highlights.length
        ? `
            <div class="my-resume3-project-details">
                ${projectInfo.description ? `<p class="my-resume3-project-description">${renderMyResume3RichText(projectInfo.description)}</p>` : ""}
                ${projectInfo.highlights.length ? renderMyResume3BulletList(projectInfo.highlights) : ""}
            </div>
        `
        : "";

    return `
        <article class="my-resume3-project-card">
            <div class="my-resume3-project-head">
                <div class="my-resume3-project-copy">
                    <div class="my-resume3-project-title-row">
                        <h3 class="my-resume3-project-title">${escapeHtml(title)}</h3>
                        ${badge ? `<span class="my-resume3-project-badge my-resume3-project-badge-${projectInfo.badgeStyle}">${escapeHtml(badge)}</span>` : ""}
                        ${iconBadgeHtml}
                    </div>
                    ${projectInfo.techs.length
                        ? `<div class="my-resume3-project-tags">${projectInfo.techs.map((tag) => (`<span class="my-resume3-project-tag">${escapeHtml(tag)}</span>`)).join("")}</div>`
                        : ""}
                </div>
                ${period ? `<span class="my-resume3-date my-resume3-project-date">${escapeHtml(period)}</span>` : ""}
            </div>
            ${detailsHtml}
        </article>
    `;
}

function buildMyResume3LayoutBlocks(data, profileImage) {
    const contactItems = pickArray(data.basicInfo).filter((item) => pickText(item?.value, "").trim());
    const summaryItems = normalizeStringArray(pickText(data.summary, ""));
    const showSkillsText = isProfessionalSkillsTextMode(data);
    const skillItems = showSkillsText ? getMyResume3SkillItems(data) : [];
    const orderedSectionIds = getOrderedSectionIds(data);
    const experienceList = pickArray(data.experiences).filter((item) => (
        pickText(item?.company, "").trim()
        || pickText(item?.title, "").trim()
        || pickText(item?.period, "").trim()
        || normalizeStringArray(item?.bullets).length
    ));
    const projectList = getRenderableProjects(data.projects, data.resumeLayout);
    const educationList = pickArray(data.education).filter((item) => (
        pickText(item?.school, "").trim()
        || pickText(item?.degree, "").trim()
        || pickText(item?.period, "").trim()
    ));
    const blocks = [
        `
            <header class="my-resume3-header resume-avoid-break">
                <div class="my-resume3-header-main">
                    <div class="my-resume3-header-copy">
                        <div class="my-resume3-name-row">
                            <h1 class="my-resume3-name">${escapeHtml(pickText(data.name, ""))}</h1>
                            ${pickText(data.role, "").trim() ? `<span class="my-resume3-role-badge">${escapeHtml(pickText(data.role, ""))}</span>` : ""}
                        </div>
                        ${contactItems.length
                            ? `<div class="my-resume3-meta-grid">${contactItems.map((item) => renderMyResume3MetaItem(item, data)).join("")}</div>`
                            : ""}
                    </div>
                    <div class="my-resume3-avatar-wrap">
                        ${renderMyResume3Avatar(data, profileImage)}
                    </div>
                </div>
            </header>
        `,
        `
            <section class="my-resume3-section resume-avoid-break">
                ${renderResolvedSectionTitle("个人概况", "summary", data)}
                ${summaryItems.length
                    ? renderMyResume3BulletList(summaryItems)
                    : '<p class="my-resume3-empty-state">可在左侧表单中填写个人概况</p>'}
            </section>
        `
    ];

    appendOrderedBlocks(blocks, orderedSectionIds, {
        skills: [
            `
                <section class="my-resume3-section resume-avoid-break">
                    ${renderResolvedSectionTitle("专业技能", "skills", data)}
                    ${showSkillsText
                        ? (skillItems.length
                            ? renderMyResume3BulletList(skillItems)
                            : '<p class="my-resume3-empty-state">可在左侧表单中填写专业技能</p>')
                        : renderMyResume3SkillGroups(data.skills)}
                </section>
            `
        ],
        experiences: experienceList.length
            ? [
                `
                    <section class="my-resume3-section resume-avoid-break">
                        ${renderResolvedSectionTitle("工作经历", "experiences", data)}
                        ${renderMyResume3ExperienceEntry(experienceList[0], 0, experienceList.length)}
                    </section>
                `,
                ...experienceList.slice(1).map((item, index) => (`
                    <div class="my-resume3-flow-block resume-avoid-break">
                        ${renderMyResume3ExperienceEntry(item, index + 1, experienceList.length)}
                    </div>
                `))
            ]
            : [
                `
                    <section class="my-resume3-section resume-avoid-break">
                        ${renderResolvedSectionTitle("工作经历", "experiences", data)}
                        <p class="my-resume3-empty-state">可在左侧表单中填写工作经历</p>
                    </section>
                `
            ],
        projects: projectList.length
            ? [
                `
                    <section class="my-resume3-section resume-avoid-break">
                        ${renderResolvedSectionTitle("项目经历", "projects", data)}
                        ${renderMyResume3ProjectCard(projectList[0])}
                    </section>
                `,
                ...projectList.slice(1).map((project) => (`
                    <div class="my-resume3-flow-block resume-avoid-break">
                        ${renderMyResume3ProjectCard(project)}
                    </div>
                `))
            ]
            : [
                `
                    <section class="my-resume3-section resume-avoid-break">
                        ${renderResolvedSectionTitle("项目经历", "projects", data)}
                        <p class="my-resume3-empty-state">可在左侧表单中填写项目经验</p>
                    </section>
                `
            ],
        education: educationList.length
            ? [
                `
                    <section class="my-resume3-section resume-avoid-break">
                        ${renderResolvedSectionTitle("教育经历", "education", data)}
                        <div class="my-resume3-flow-block">
                            ${renderMyResume3EducationEntry(educationList[0], 0, educationList.length)}
                        </div>
                    </section>
                `,
                ...educationList.slice(1).map((item, index) => (`
                    <div class="my-resume3-flow-block resume-avoid-break">
                        ${renderMyResume3EducationEntry(item, index + 1, educationList.length)}
                    </div>
                `))
            ]
            : [
                `
                    <section class="my-resume3-section resume-avoid-break">
                        ${renderResolvedSectionTitle("教育经历", "education", data)}
                        <p class="my-resume3-empty-state">可在左侧表单中填写教育背景</p>
                    </section>
                `
            ]
    });

    return {
        leftBlocks: [],
        rightBlocks: blocks
    };
}

export function buildLayoutColumnBlocks(layout, data, profileImage) {
    const normalizedLayout = normalizeResumeLayout(layout);

    if (normalizedLayout === RESUME_LAYOUT_CLASSIC) {
        return {
            leftBlocks: buildClassicLeftColumnBlocks(data, profileImage),
            rightBlocks: buildClassicRightColumnBlocks(data)
        };
    }

    if (normalizedLayout === RESUME_LAYOUT_CARDS) {
        return {
            leftBlocks: buildCardLeftColumnBlocks(data, profileImage),
            rightBlocks: buildCardRightColumnBlocks(data)
        };
    }

    if (normalizedLayout === RESUME_LAYOUT_MY_RESUME) {
        return buildMyResumeLayoutBlocks(data, profileImage);
    }

    if (normalizedLayout === RESUME_LAYOUT_MY_RESUME3) {
        return buildMyResume3LayoutBlocks(data, profileImage);
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
                || getOuterBottom(column, lastBlock) <= (column.clientHeight - PAGE_BREAK_BUFFER_PX);

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
    const sheetOverflowClass = isOverflowPage ? "resume-sheet-overflow" : "";
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

export function renderResume({ resumeRoot, data, renderMode }) {
    const documentTitle = pickText(data.documentTitle, "简历") || "简历";
    const layout = normalizeResumeLayout(data.resumeLayout);
    const profileImage = getAvatarImageSource(data.profileImage);
    const theme = getResumeThemeOption(data.resumeTheme);
    const themeInlineStyle = buildResumeThemeInlineStyle(theme, data);
    const normalizedRenderMode = normalizeRenderMode(renderMode);

    document.title = documentTitle;

    const rootStyle = document.documentElement.style;
    const themeVars = buildResumeThemeVars(theme, data);
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
        const isOverflowPage = leftResult.oversizePages.has(pageIndex) || rightResult.oversizePages.has(pageIndex);
        pages.push(renderResumePage(layout, leftHtml, rightHtml, pageIndex + 1, totalPages, isOverflowPage, normalizedRenderMode));
    }

    resumeRoot.innerHTML = `<div class="preview-stack resume-theme-shell ${getResumeLayoutClass(layout)}" data-resume-theme="${escapeHtml(theme.key)}" data-resume-layout="${escapeHtml(layout)}" data-render-mode="${escapeHtml(normalizedRenderMode)}" data-flat-icons="${data.useFlatIcons ? "true" : "false"}" style="${escapeHtml(themeInlineStyle)}">${pages.join("")}</div>`;
    return normalizedRenderMode;
}
