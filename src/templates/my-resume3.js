function renderMyResume3Icon(name, className = "") {
    const iconClass = className ? ` class="${className}"` : "";

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
        code: `<svg${iconClass} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="18" height="18" rx="2" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="1.8"/><path d="m9 10-3 2.5L9 15M15 10l3 2.5-3 2.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
        briefcase: `<svg${iconClass} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="7" width="20" height="14" rx="2" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="1.8"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
        layers: `<svg${iconClass} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="12 2 2 7 12 12 22 7 12 2" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="m2 12 10 5 10-5M2 17l10 5 10-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
        book: `<svg${iconClass} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`
    };

    return icons[name] || icons.user;
}

function pickMyResume3InfoIcon(item, pickText) {
    const labelText = pickText(item?.label, "").trim().toLowerCase();
    const valueText = pickText(item?.value, "").trim().toLowerCase();
    const lookup = [item?.id, item?.iconPreset, item?.label, item?.customIcon, valueText]
        .map((value) => pickText(value, "").trim().toLowerCase())
        .filter(Boolean)
        .join(" ");

    if (lookup.includes("github")) return "github";
    if (lookup.includes("website") || lookup.includes("网址") || lookup.includes("网站") || lookup.includes("link") || valueText.includes("http") || valueText.includes("www.")) return "link";
    if (lookup.includes("phone") || lookup.includes("手机") || lookup.includes("电话")) return "phone";
    if (lookup.includes("mail") || lookup.includes("email") || lookup.includes("邮箱")) return "mail";
    if (lookup.includes("location") || lookup.includes("城市") || lookup.includes("地址") || lookup.includes("居住")) return "pin";
    if (lookup.includes("birth") || lookup.includes("年龄") || lookup.includes("生日") || lookup.includes("出生")) return "calendar";
    if (lookup.includes("education") || lookup.includes("学历") || labelText.includes("学历")) return "cap";
    if (lookup.includes("company") || lookup.includes("role") || lookup.includes("岗位") || lookup.includes("职位") || lookup.includes("身份")) return "briefcase";
    if (lookup.includes("calendar") || lookup.includes("工龄") || lookup.includes("经验") || lookup.includes("年限")) return "clock";
    return "user";
}

function buildMyResume3Initials(name, pickText) {
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

function renderMyResume3RichText(text, escapeHtml) {
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

function renderMyResume3BulletList(items, helpers, emptyText = "") {
    const { normalizeStringArray, escapeHtml } = helpers;
    const list = normalizeStringArray(items);
    if (!list.length) {
        return emptyText ? `<p class="my-resume3-empty-state">${escapeHtml(emptyText)}</p>` : "";
    }

    return `
        <ul class="my-resume3-bullet-list">
            ${list.map((item) => (`<li class="my-resume3-bullet-item">${renderMyResume3RichText(item, escapeHtml)}</li>`)).join("")}
        </ul>
    `;
}

function renderMyResume3SectionHeading(title, iconName, escapeHtml) {
    return `
        <div class="my-resume3-section-heading-row">
            <span class="my-resume3-section-icon-box" aria-hidden="true">${renderMyResume3Icon(iconName, "my-resume3-section-icon")}</span>
            <h2 class="my-resume3-section-heading">${escapeHtml(title)}</h2>
        </div>
    `;
}

function buildMyResume3ExternalHref(value) {
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

function shouldMyResume3MetaItemSpanWide(value, iconName, href) {
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
    const wideThreshold = iconName === "github" ? 34 : 30;

    return compactValue.length > wideThreshold || (compactValue.length > 24 && hasComplexPath);
}

function renderMyResume3MetaItem(item, helpers) {
    const { pickText, escapeHtml } = helpers;
    const value = pickText(item?.value, "").trim();
    if (!value) return "";

    const iconName = pickMyResume3InfoIcon(item, pickText);
    const href = buildMyResume3ExternalHref(value);
    const isWide = shouldMyResume3MetaItemSpanWide(value, iconName, href);
    const textHtml = href
        ? `<a class="my-resume3-meta-text my-resume3-meta-link" href="${escapeHtml(href)}" target="_blank" rel="noreferrer">${escapeHtml(value)}</a>`
        : `<span class="my-resume3-meta-text">${escapeHtml(value)}</span>`;

    return `
        <div class="my-resume3-meta-item${isWide ? " my-resume3-meta-item-wide" : ""}">
            <span class="my-resume3-meta-icon" aria-hidden="true">${renderMyResume3Icon(iconName, "my-resume3-meta-icon-svg")}</span>
            ${textHtml}
        </div>
    `;
}

function renderMyResume3Avatar(data, profileImage, helpers) {
    const {
        pickText,
        hasCustomAvatarImage,
        getCachedAvatarImageMeta,
        normalizeAvatarFrame,
        getAvatarImageStyle,
        escapeHtml,
        FALLBACK_AVATAR
    } = helpers;

    const avatarContent = hasCustomAvatarImage(data.profileImage)
        ? (() => {
            const avatarMeta = data.avatarImageMeta || getCachedAvatarImageMeta(data.profileImage);
            const avatarFrame = normalizeAvatarFrame(data.avatarFrame, avatarMeta);
            const avatarStyle = getAvatarImageStyle(avatarFrame, avatarMeta);
            return `<img src="${escapeHtml(profileImage)}" alt="Profile Picture" class="my-resume3-avatar-image pointer-events-none select-none" style="${avatarStyle}" data-testid="avatar-preview-image" data-avatar-zoom="${escapeHtml(String(avatarFrame.zoom))}" data-avatar-offset-x="${escapeHtml(String(avatarFrame.offsetX))}" data-avatar-offset-y="${escapeHtml(String(avatarFrame.offsetY))}" onerror="this.onerror=null;this.src='${FALLBACK_AVATAR}'">`;
        })()
        : `<div class="my-resume3-avatar-fallback">${escapeHtml(buildMyResume3Initials(pickText(data.name, ""), pickText))}</div>`;

    return `
        <div class="my-resume3-avatar-card">
            <div class="my-resume3-avatar-media">
                ${avatarContent}
            </div>
        </div>
    `;
}

function buildMyResume3SkillItems(data, helpers) {
    const { pickText, pickArray, normalizeStringArray } = helpers;
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

function renderMyResume3ExperienceEntry(item, index, total, helpers) {
    const { pickText, normalizeStringArray, escapeHtml } = helpers;
    const company = pickText(item?.company, "").trim() || "未填写公司";
    const role = pickText(item?.title, "").trim();
    const period = pickText(item?.period, "").trim();
    const details = normalizeStringArray(item?.bullets);
    const showTail = index < total - 1;

    return `
        <article class="my-resume3-timeline-entry my-resume3-work-entry${showTail ? " my-resume3-timeline-entry-tail" : ""}">
            <span class="my-resume3-timeline-rail" aria-hidden="true"></span>
            <span class="my-resume3-timeline-dot" aria-hidden="true"></span>
            <div class="my-resume3-timeline-body">
                <div class="my-resume3-timeline-head">
                    <h3 class="my-resume3-timeline-title">
                        <span class="my-resume3-timeline-title-main">${escapeHtml(company)}</span>
                        ${role ? `<span class="my-resume3-timeline-separator">/</span><span class="my-resume3-work-role">${escapeHtml(role)}</span>` : ""}
                    </h3>
                    ${period ? `<span class="my-resume3-date">${escapeHtml(period)}</span>` : ""}
                </div>
                ${details.length
                    ? renderMyResume3BulletList(details, helpers)
                    : '<p class="my-resume3-empty-state">可在左侧表单中补充工作经历要点</p>'}
            </div>
        </article>
    `;
}

function renderMyResume3EducationEntry(item, index, total, helpers) {
    const { pickText, escapeHtml } = helpers;
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

function renderMyResume3ProjectCard(project, helpers) {
    const { pickText, normalizeStringArray, escapeHtml } = helpers;
    const title = pickText(project?.name, "").trim() || "未填写项目名称";
    const badge = pickText(project?.badge, "").trim();
    const badgeStyle = pickText(project?.badgeStyle, "secondary") === "primary" ? "primary" : "secondary";
    const period = pickText(project?.period, "").trim();
    const tags = normalizeStringArray(project?.techs);
    const highlights = normalizeStringArray(project?.highlights);
    const description = pickText(project?.description, "").trim();
    const detailItems = highlights.length ? highlights : (description ? [description] : []);

    return `
        <article class="my-resume3-project-card">
            <div class="my-resume3-project-head">
                <div class="my-resume3-project-copy">
                    <div class="my-resume3-project-title-row">
                        <h3 class="my-resume3-project-title">${escapeHtml(title)}</h3>
                        ${badge ? `<span class="my-resume3-project-badge my-resume3-project-badge-${badgeStyle}">${escapeHtml(badge)}</span>` : ""}
                    </div>
                </div>
                ${period ? `<span class="my-resume3-date my-resume3-project-date">${escapeHtml(period)}</span>` : ""}
                ${tags.length
                    ? `<div class="my-resume3-project-tags">${tags.map((tag) => (`<span class="my-resume3-project-tag">${escapeHtml(tag)}</span>`)).join("")}</div>`
                    : ""}
            </div>
            ${detailItems.length
                ? renderMyResume3BulletList(detailItems, helpers)
                : '<p class="my-resume3-empty-state">可在左侧表单中补充项目亮点</p>'}
        </article>
    `;
}

export function buildMyResume3LayoutBlocks(data, profileImage, helpers) {
    const { pickArray, pickText, normalizeStringArray, escapeHtml } = helpers;
    const contactItems = pickArray(data.basicInfo).filter((item) => pickText(item?.value, "").trim());
    const summaryItems = normalizeStringArray(pickText(data.summary, ""));
    const skillItems = buildMyResume3SkillItems(data, helpers);
    const experienceList = pickArray(data.experiences).filter((item) => (
        pickText(item?.company, "").trim()
        || pickText(item?.title, "").trim()
        || pickText(item?.period, "").trim()
        || normalizeStringArray(item?.bullets).length
    ));
    const projectList = pickArray(data.projects).filter((item) => (
        pickText(item?.name, "").trim()
        || pickText(item?.badge, "").trim()
        || pickText(item?.period, "").trim()
        || pickText(item?.description, "").trim()
        || normalizeStringArray(item?.highlights).length
        || normalizeStringArray(item?.techs).length
    ));
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
                            ? `<div class="my-resume3-meta-grid">${contactItems.map((item) => renderMyResume3MetaItem(item, helpers)).join("")}</div>`
                            : ""}
                    </div>
                    <div class="my-resume3-avatar-wrap">
                        ${renderMyResume3Avatar(data, profileImage, helpers)}
                    </div>
                </div>
            </header>
        `,
        `
            <section class="my-resume3-section resume-avoid-break">
                ${renderMyResume3SectionHeading("个人概况", "user", escapeHtml)}
                ${summaryItems.length
                    ? renderMyResume3BulletList(summaryItems, helpers)
                    : '<p class="my-resume3-empty-state">可在左侧表单中填写个人概况</p>'}
            </section>
        `,
        `
            <section class="my-resume3-section resume-avoid-break">
                ${renderMyResume3SectionHeading("专业技能情况", "code", escapeHtml)}
                ${skillItems.length
                    ? renderMyResume3BulletList(skillItems, helpers)
                    : '<p class="my-resume3-empty-state">可在左侧表单中填写专业技能</p>'}
            </section>
        `
    ];

    if (experienceList.length) {
        blocks.push(`
            <section class="my-resume3-section resume-avoid-break">
                ${renderMyResume3SectionHeading("工作经历", "briefcase", escapeHtml)}
                ${renderMyResume3ExperienceEntry(experienceList[0], 0, experienceList.length, helpers)}
            </section>
        `);

        for (let index = 1; index < experienceList.length; index += 1) {
            blocks.push(`
                <div class="my-resume3-flow-block resume-avoid-break">
                    ${renderMyResume3ExperienceEntry(experienceList[index], index, experienceList.length, helpers)}
                </div>
            `);
        }
    } else {
        blocks.push(`
            <section class="my-resume3-section resume-avoid-break">
                ${renderMyResume3SectionHeading("工作经历", "briefcase", escapeHtml)}
                <p class="my-resume3-empty-state">可在左侧表单中填写工作经历</p>
            </section>
        `);
    }

    if (projectList.length) {
        blocks.push(`
            <section class="my-resume3-section resume-avoid-break">
                ${renderMyResume3SectionHeading("项目经历", "layers", escapeHtml)}
                ${renderMyResume3ProjectCard(projectList[0], helpers)}
            </section>
        `);

        for (let index = 1; index < projectList.length; index += 1) {
            blocks.push(`
                <div class="my-resume3-flow-block resume-avoid-break">
                    ${renderMyResume3ProjectCard(projectList[index], helpers)}
                </div>
            `);
        }
    } else {
        blocks.push(`
            <section class="my-resume3-section resume-avoid-break">
                ${renderMyResume3SectionHeading("项目经历", "layers", escapeHtml)}
                <p class="my-resume3-empty-state">可在左侧表单中填写项目经验</p>
            </section>
        `);
    }

    if (educationList.length) {
        blocks.push(`
            <section class="my-resume3-section resume-avoid-break">
                ${renderMyResume3SectionHeading("教育经历", "book", escapeHtml)}
            </section>
        `);

        blocks.push(`
            <div class="my-resume3-flow-block resume-avoid-break">
                ${renderMyResume3EducationEntry(educationList[0], 0, educationList.length, helpers)}
            </div>
        `);

        for (let index = 1; index < educationList.length; index += 1) {
            blocks.push(`
                <div class="my-resume3-flow-block resume-avoid-break">
                    ${renderMyResume3EducationEntry(educationList[index], index, educationList.length, helpers)}
                </div>
            `);
        }
    } else {
        blocks.push(`
            <section class="my-resume3-section resume-avoid-break">
                ${renderMyResume3SectionHeading("教育经历", "book", escapeHtml)}
                <p class="my-resume3-empty-state">可在左侧表单中填写教育背景</p>
            </section>
        `);
    }

    return {
        leftBlocks: [],
        rightBlocks: blocks
    };
}
