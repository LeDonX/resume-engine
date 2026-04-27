function renderMyResumeIcon(name, className = "") {
    const iconClass = className ? ` class="${className}"` : "";
    const baseAttrs = `viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"${iconClass}`;

    const icons = {
        phone: `<svg ${baseAttrs}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.77.62 2.62a2 2 0 0 1-.45 2.11L8 9.91a16 16 0 0 0 6.09 6.09l1.46-1.28a2 2 0 0 1 2.11-.45c.85.29 1.72.5 2.62.62A2 2 0 0 1 22 16.92Z"/></svg>`,
        mail: `<svg ${baseAttrs}><path d="M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"/><path d="m22 7-10 7L2 7"/></svg>`,
        userCircle: `<svg ${baseAttrs}><circle cx="12" cy="8" r="4"/><path d="M6 20a6 6 0 0 1 12 0"/><circle cx="12" cy="12" r="10"/></svg>`,
        link: `<svg ${baseAttrs}><path d="M10 13a5 5 0 0 0 7.07 0l1.41-1.41a5 5 0 0 0-7.07-7.07L10.6 5.32"/><path d="M14 11a5 5 0 0 0-7.07 0l-1.41 1.41a5 5 0 0 0 7.07 7.07l.79-.79"/></svg>`,
        clock: `<svg ${baseAttrs}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`,
        mapPin: `<svg ${baseAttrs}><path d="M12 21s-6-4.35-6-10a6 6 0 0 1 12 0c0 5.65-6 10-6 10Z"/><circle cx="12" cy="11" r="2.5"/></svg>`,
        user: `<svg ${baseAttrs}><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/></svg>`,
        layers: `<svg ${baseAttrs}><path d="m12 3 9 4.5-9 4.5L3 7.5 12 3Z"/><path d="m3 12 9 4.5 9-4.5"/><path d="m3 16.5 9 4.5 9-4.5"/></svg>`,
        briefcase: `<svg ${baseAttrs}><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 12h18"/></svg>`,
        calendar: `<svg ${baseAttrs}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4"/><path d="M8 3v4"/><path d="M3 10h18"/></svg>`,
        award: `<svg ${baseAttrs}><circle cx="12" cy="8" r="4"/><path d="m8.5 12.5-1 8L12 18l4.5 2.5-1-8"/></svg>`,
        zap: `<svg ${baseAttrs}><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/></svg>`,
        graduation: `<svg ${baseAttrs}><path d="m3 8 9-4 9 4-9 4-9-4Z"/><path d="M7 10.5v4.25c0 .48.24.93.65 1.19C8.96 16.79 10.43 17.5 12 17.5s3.04-.71 4.35-1.56c.41-.26.65-.71.65-1.19V10.5"/><path d="M21 9v6"/></svg>`
    };

    return icons[name] || icons.user;
}

function pickMyResumeInfoIcon(item, pickText) {
    const lookup = [item?.id, item?.iconPreset, item?.label]
        .map((value) => pickText(value, "").trim().toLowerCase())
        .filter(Boolean)
        .join(" ");

    if (lookup.includes("phone") || lookup.includes("手机")) return "phone";
    if (lookup.includes("email") || lookup.includes("邮箱")) return "mail";
    if (lookup.includes("birth") || lookup.includes("年龄") || lookup.includes("出生")) return "userCircle";
    if (lookup.includes("website") || lookup.includes("github") || lookup.includes("网站") || lookup.includes("link")) return "link";
    if (lookup.includes("location") || lookup.includes("城市") || lookup.includes("地址")) return "mapPin";
    if (lookup.includes("calendar") || lookup.includes("time") || lookup.includes("经验") || lookup.includes("工龄")) return "clock";
    if (lookup.includes("education") || lookup.includes("学历")) return "graduation";
    if (lookup.includes("company") || lookup.includes("公司") || lookup.includes("role") || lookup.includes("岗位")) return "briefcase";
    if (lookup.includes("profile") || lookup.includes("身份") || lookup.includes("user")) return "user";
    return "user";
}

function buildMyResumeInitials(name, pickText) {
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

function renderMyResumeSectionHeading(title, iconName, escapeHtml) {
    return `
        <div class="my-resume-section-heading-row">
            ${renderMyResumeIcon(iconName, "my-resume-section-icon")}
            <h2 class="my-resume-section-heading">${escapeHtml(title)}</h2>
        </div>
    `;
}

function renderMyResumeHighlightedText(text, escapeHtml) {
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

function buildMyResumeSkillsText(data, helpers) {
    const { pickText, pickArray, normalizeStringArray, escapeHtml } = helpers;
    const text = pickText(data.professionalSkillsText, "").trim();
    if (text) {
        return renderMyResumeHighlightedText(text, escapeHtml);
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

function buildMyResumeExperienceText(item, helpers) {
    const { normalizeStringArray, escapeHtml } = helpers;
    const bullets = normalizeStringArray(item?.bullets);
    if (!bullets.length) {
        return '<p class="my-resume-empty-state">可在左侧表单中补充工作经历内容</p>';
    }

    return `<p class="my-resume-experience-description">${bullets.map((bullet) => escapeHtml(bullet)).join(" ")}</p>`;
}

function renderMyResumeExperienceEntry(item, index, total, helpers) {
    const { pickText, escapeHtml } = helpers;
    const company = pickText(item?.company, "").trim() || "未填写公司";
    const role = pickText(item?.title, "").trim();
    const period = pickText(item?.period, "").trim();
    const showTail = index < total - 1;

    return `
        <article class="my-resume-experience-entry${showTail ? " my-resume-experience-entry-tail" : ""}">
            <span class="my-resume-experience-rail" aria-hidden="true"></span>
            <span class="my-resume-experience-dot" aria-hidden="true"></span>
            <div class="my-resume-experience-body">
                <div class="my-resume-experience-top">
                    <h3 class="my-resume-experience-company">${escapeHtml(company)}</h3>
                    ${period ? `<span class="my-resume-period">${renderMyResumeIcon("calendar", "my-resume-period-icon")}<span>${escapeHtml(period)}</span></span>` : ""}
                </div>
                <div class="my-resume-experience-role-row">
                    ${role ? `<p class="my-resume-experience-role">${escapeHtml(role)}</p>` : ""}
                    ${item?.highlight ? `<span class="my-resume-highlight-badge">${renderMyResumeIcon("award", "my-resume-badge-icon")}<span>重点经历</span></span>` : ""}
                </div>
                ${buildMyResumeExperienceText(item, helpers)}
            </div>
        </article>
    `;
}

function renderMyResumeProjectCard(project, helpers) {
    const { pickText, normalizeStringArray, escapeHtml } = helpers;
    const title = pickText(project?.name, "").trim() || "未填写项目名称";
    const description = pickText(project?.description, "").trim();
    const tags = normalizeStringArray(project?.techs);

    return `
        <article class="my-resume-project-card">
            <div class="my-resume-project-head">
                <h3 class="my-resume-project-title">
                    ${renderMyResumeIcon("zap", "my-resume-project-title-icon")}
                    <span>${escapeHtml(title)}</span>
                </h3>
                ${tags.length
                    ? `<div class="my-resume-project-tags">${tags.map((tag) => (`<span class="my-resume-project-tag">${escapeHtml(tag)}</span>`)).join("")}</div>`
                    : ""}
            </div>
            ${description
                ? `<p class="my-resume-project-description">${escapeHtml(description)}</p>`
                : '<p class="my-resume-empty-state">可在左侧表单中补充项目说明</p>'}
        </article>
    `;
}

function renderMyResumeAvatar(data, profileImage, helpers) {
    const {
        pickText,
        hasCustomAvatarImage,
        getCachedAvatarImageMeta,
        normalizeAvatarFrame,
        getAvatarImageStyle,
        escapeHtml,
        FALLBACK_AVATAR
    } = helpers;

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
            <div class="my-resume-avatar-fallback">${escapeHtml(buildMyResumeInitials(pickText(data.name, ""), pickText))}</div>
        </div>
    `;
}

export function buildMyResumeLayoutBlocks(data, profileImage, helpers) {
    const { pickArray, pickText, escapeHtml } = helpers;
    const contactItems = pickArray(data.basicInfo)
        .filter((item) => pickText(item?.value, "").trim() !== "")
        .slice(0, 6);
    const contactEntries = contactItems.map((item) => {
        const value = pickText(item?.value, "").trim();
        return {
            value,
            iconName: pickMyResumeInfoIcon(item, pickText)
        };
    });
    const contactLinkIndex = contactEntries.findIndex((entry) => entry.iconName === "link");
    const contactRows = contactLinkIndex >= 2 && contactLinkIndex < contactEntries.length - 1
        ? [contactEntries.slice(0, contactLinkIndex), contactEntries.slice(contactLinkIndex)]
        : [contactEntries];
    const summaryText = pickText(data.summary, "").trim();
    const skillsText = buildMyResumeSkillsText(data, helpers);
    const experienceList = pickArray(data.experiences).filter((item) => (
        pickText(item?.company, "").trim()
        || pickText(item?.title, "").trim()
        || pickText(item?.period, "").trim()
        || helpers.normalizeStringArray(item?.bullets).length
    ));
    const projectList = pickArray(data.projects).filter((item) => (
        pickText(item?.name, "").trim()
        || pickText(item?.description, "").trim()
        || helpers.normalizeStringArray(item?.techs).length
    ));
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
                                    <span class="my-resume-contact-icon" aria-hidden="true">${renderMyResumeIcon(entry.iconName, "my-resume-contact-icon-svg")}</span>
                                    <span class="my-resume-contact-text" data-contact-icon="${escapeHtml(entry.iconName)}">${escapeHtml(entry.value)}</span>
                                </div>
                                `)).join("")}
                            </div>
                        `)).join("")}</div>`
                        : ""}
                </div>
                <div class="my-resume-header-avatar">
                    ${renderMyResumeAvatar(data, profileImage, helpers)}
                </div>
            </div>
        </header>
    `;

    const blocks = [headerBlock];

    blocks.push(`
        <section class="my-resume-section resume-avoid-break">
            ${renderMyResumeSectionHeading("个人概况", "user", escapeHtml)}
            ${summaryText
                ? `<p class="my-resume-paragraph">${escapeHtml(summaryText)}</p>`
                : '<p class="my-resume-empty-state">可在左侧表单中填写个人简介</p>'}
        </section>
    `);

    blocks.push(`
        <section class="my-resume-section resume-avoid-break">
            ${renderMyResumeSectionHeading("专业技能", "layers", escapeHtml)}
            ${skillsText
                ? `<p class="my-resume-paragraph my-resume-skills-paragraph">${skillsText}</p>`
                : '<p class="my-resume-empty-state">可在左侧表单中填写专业技能</p>'}
        </section>
    `);

    if (experienceList.length) {
        blocks.push(`
            <section class="my-resume-section resume-avoid-break">
                ${renderMyResumeSectionHeading("工作经历", "briefcase", escapeHtml)}
                ${renderMyResumeExperienceEntry(experienceList[0], 0, experienceList.length, helpers)}
            </section>
        `);

        for (let index = 1; index < experienceList.length; index += 1) {
            blocks.push(`
                <div class="my-resume-flow-block resume-avoid-break">
                    ${renderMyResumeExperienceEntry(experienceList[index], index, experienceList.length, helpers)}
                </div>
            `);
        }
    } else {
        blocks.push(`
            <section class="my-resume-section resume-avoid-break">
                ${renderMyResumeSectionHeading("工作经历", "briefcase", escapeHtml)}
                <p class="my-resume-empty-state">可在左侧表单中填写工作经历</p>
            </section>
        `);
    }

    if (projectList.length) {
        blocks.push(`
            <section class="my-resume-section resume-avoid-break">
                ${renderMyResumeSectionHeading("核心项目", "zap", escapeHtml)}
                ${renderMyResumeProjectCard(projectList[0], helpers)}
            </section>
        `);

        for (let index = 1; index < projectList.length; index += 1) {
            blocks.push(`
                <div class="my-resume-flow-block resume-avoid-break">
                    ${renderMyResumeProjectCard(projectList[index], helpers)}
                </div>
            `);
        }
    } else {
        blocks.push(`
            <section class="my-resume-section resume-avoid-break">
                ${renderMyResumeSectionHeading("核心项目", "zap", escapeHtml)}
                <p class="my-resume-empty-state">可在左侧表单中填写项目经验</p>
            </section>
        `);
    }

    blocks.push(`
        <section class="my-resume-section resume-avoid-break">
            ${renderMyResumeSectionHeading("教育背景", "graduation", escapeHtml)}
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
    `);

    return {
        leftBlocks: [],
        rightBlocks: blocks
    };
}
