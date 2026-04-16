import Sortable from "sortablejs";
import {
    AVATAR_OFFSET_LIMIT,
    AVATAR_SHAPE_CIRCLE,
    DEFAULT_AVATAR_FRAME,
    PRINT_RESTORE_DELAY_MS,
    RENDER_MODE_PRINT,
    RENDER_MODE_SCREEN,
    RESUME_LAYOUT_CLASSIC,
    createInitialPanelState,
    sampleResumeData
} from "../core/config.js";
import {
    clampNumber,
    cloneData,
    createEducation,
    createExperience,
    createProject,
    createSkillGroup,
    linesToArray,
    pickText
} from "../core/utils.js";
import { createDraftStore } from "../persistence/draft-store.js";
import { createAvatarController } from "../avatar/controller.js";
import {
    calculateAvatarFrameFromDrag,
    createAvatarCropState,
    getAvatarEditorMinZoom,
    getCachedAvatarImageMeta,
    hasCustomAvatarImage,
    normalizeAvatarFrame,
    normalizeAvatarShape
} from "../avatar/avatar-utils.js";
import {
    getResumeLayoutLabel,
    normalizeProfessionalSkillsMode,
    getResumeThemeOption,
    normalizeResumeData,
    normalizeResumeLayout,
    normalizeResumeTheme
} from "../core/resume-model.js";
import { renderFormHtml } from "../form/render.js";
import { renderResume as renderPreview } from "../preview/render.js";
import { clampResumeLayoutControl } from "../resume-layout-controls.js";

export function createResumeApp({ dom, windowRef = window, documentRef = document, sortableLib = Sortable }) {
    const {
        formRoot,
        resumeRoot,
        statusText,
        importFileInput
    } = dom;

    let resumeData = normalizeResumeData(cloneData(sampleResumeData));
    let panelState = createInitialPanelState();
    let activeBasicInfoPickerIndex = -1;
    let basicInfoSortable = null;
    let lastExportedJson = "";
    let avatarDragState = null;
    let avatarCropState = null;
    let activeRenderMode = RENDER_MODE_SCREEN;
    let repaginationTimer = null;
    let printRestoreTimer = null;
    let statusTimer = null;
    let lastPersistedSnapshot = null;

    function setCleanSnapshot(snapshot) {
        lastPersistedSnapshot = snapshot ? cloneData(snapshot) : null;
    }

    function setStatus(message, type = "info") {
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

        statusText.className = `truncate text-[10px] font-bold tracking-wide transition-opacity duration-300 ${colorClass}`;
        statusText.innerHTML = `${icon} ${message}`;
        statusText.style.opacity = "1";

        if (statusTimer) {
            windowRef.clearTimeout(statusTimer);
        }

        statusTimer = windowRef.setTimeout(() => {
            statusText.style.opacity = "0";
        }, 3000);
    }

    const draftStore = createDraftStore({
        getResumeData: () => resumeData,
        normalizeResumeData,
        setStatus,
        setCleanSnapshot
    });

    const {
        hydrateAvatarStateIfNeeded,
        loadDraft,
        primeAvatarSidecarState,
        saveDraft,
        syncAvatarSidecar
    } = draftStore;

    function renderResume(data = resumeData, renderMode = activeRenderMode) {
        activeRenderMode = renderPreview({ resumeRoot, data, renderMode });
        return activeRenderMode;
    }

    let avatarController;

    function initBasicInfoSortable() {
        if (basicInfoSortable) {
            basicInfoSortable.destroy();
            basicInfoSortable = null;
        }

        const list = documentRef.getElementById("basic-info-list");
        if (!list || !sortableLib || typeof sortableLib.create !== "function") {
            return;
        }

        basicInfoSortable = sortableLib.create(list, {
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

    function renderForm() {
        formRoot.innerHTML = renderFormHtml({
            resumeData,
            panelState,
            activeBasicInfoPickerIndex,
            avatarCropState
        });

        avatarController.initAvatarFrameEditor();
        initBasicInfoSortable();
    }

    function renderAll() {
        renderForm();
        renderResume(resumeData, activeRenderMode);
    }

    avatarController = createAvatarController({
        formRoot,
        getResumeData: () => resumeData,
        getAvatarCropState: () => avatarCropState,
        setAvatarCropState: (value) => {
            avatarCropState = value;
        },
        getAvatarDragState: () => avatarDragState,
        setAvatarDragState: (value) => {
            avatarDragState = value;
        },
        renderForm,
        renderResume,
        renderAll,
        saveDraft,
        setStatus,
        getActiveRenderMode: () => activeRenderMode
    });

    const {
        applyAvatarCropQuickAction,
        closeAvatarCropper,
        confirmAvatarCrop,
        handleAvatarUpload,
        openAvatarCropper,
        setAvatarEditorFrame,
        syncAvatarEditorUI
    } = avatarController;

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

        if (section === "layoutControls") {
            resumeData[field] = clampResumeLayoutControl(field, value, resumeData[field]);
        } else if (section === "basic") {
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

        if (action === "set-skill-badge-color") {
            const colorKey = pickText(button?.dataset?.color, "theme");
            if (resumeData.skillBadgeColor !== colorKey) {
                resumeData.skillBadgeColor = colorKey;
                renderAll();
                saveDraft();
            }
            return;
        }

        if (action === "toggle-flat-icons") {
            resumeData.useFlatIcons = !resumeData.useFlatIcons;
            renderAll();
            saveDraft();
            return;
        }

        if (action === "toggle-experience-timeline") {
            resumeData.showExperienceTimeline = !resumeData.showExperienceTimeline;
            renderAll();
            saveDraft();
            return;
        }

        if (action === "toggle-theme-timeline") {
            resumeData.useThemeTimeline = !resumeData.useThemeTimeline;
            renderAll();
            saveDraft();
            return;
        }

        if (action === "toggle-multicolor-icons") {
            resumeData.useMulticolorIcons = resumeData.useMulticolorIcons === false ? true : false;
            renderAll();
            saveDraft();
            return;
        }

        if (action === "set-icon-palette") {
            const paletteKey = pickText(button?.dataset?.palette, "macaron");
            if (resumeData.iconPalette !== paletteKey) {
                resumeData.iconPalette = paletteKey;
                renderAll();
                saveDraft();
            }
            return;
        }

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
            setStatus(`头像展示已切换为${shape === "rectangle" ? "矩形" : "圆形"}。`, "success");
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

        if (action === "set-professional-skills-mode") {
            const nextMode = normalizeProfessionalSkillsMode(pickText(button?.dataset?.mode, "skills"));
            if (resumeData.professionalSkillsMode === nextMode) {
                return;
            }
            const previousMode = resumeData.professionalSkillsMode;
            resumeData.professionalSkillsMode = nextMode;
            renderAll();
            if (!saveDraft()) {
                resumeData.professionalSkillsMode = previousMode;
                renderAll();
                setStatus("技能展示方式保存失败：无法写入本地草稿。", "error");
                return;
            }
            setStatus(`专业技能展示已切换为${nextMode === "text" ? "文本摘要" : "标签分组"}。`, "success");
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

    function rerenderResumeSoon() {
        if (repaginationTimer !== null) {
            windowRef.clearTimeout(repaginationTimer);
        }

        repaginationTimer = windowRef.setTimeout(() => {
            repaginationTimer = null;
            renderResume(resumeData, activeRenderMode);
        }, 120);
    }

    function rerenderResumeNow(renderMode = activeRenderMode) {
        if (repaginationTimer !== null) {
            windowRef.clearTimeout(repaginationTimer);
            repaginationTimer = null;
        }
        renderResume(resumeData, renderMode);
    }

    function scheduleScreenModeRestore() {
        if (printRestoreTimer !== null) {
            windowRef.clearTimeout(printRestoreTimer);
        }

        printRestoreTimer = windowRef.setTimeout(() => {
            printRestoreTimer = null;
            windowRef.requestAnimationFrame(() => {
                windowRef.requestAnimationFrame(() => {
                    rerenderResumeNow(RENDER_MODE_SCREEN);
                });
            });
        }, PRINT_RESTORE_DELAY_MS);
    }

    function handleFormInput(target) {
        if (!target || !target.dataset) {
            return;
        }
        applyFieldUpdate(target);
    }

    function handleFormChange(target) {
        if (!target || !target.dataset) {
            return;
        }
        if (target.getAttribute("data-testid") === "avatar-upload-input") {
            handleAvatarUpload(target.files?.[0]);
            target.value = "";
            return;
        }
        applyFieldUpdate(target);
    }

    function handleFormClick(target) {
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
    }

    function resetData() {
        resumeData = normalizeResumeData(cloneData(sampleResumeData));
        renderAll();
        const didPersist = saveDraft({ showAvatarWarning: true });
        setStatus(
            didPersist
                ? "已重置为默认示例。"
                : "已重置当前预览，但未能保存到本地草稿；刷新后可能恢复旧内容。",
            didPersist ? "success" : "error"
        );
    }

    function exportData() {
        const content = JSON.stringify(resumeData, null, 2);
        lastExportedJson = content;
        const blob = new Blob([content], { type: "application/json;charset=utf-8" });
        const blobUrl = URL.createObjectURL(blob);
        const anchor = documentRef.createElement("a");
        anchor.href = blobUrl;
        anchor.download = "resume-data.json";
        documentRef.body.appendChild(anchor);
        anchor.click();
        documentRef.body.removeChild(anchor);
        URL.revokeObjectURL(blobUrl);
        setStatus("已导出 JSON。", "success");
    }

    function openImportPicker() {
        importFileInput.click();
    }

    async function handleImportFileChange() {
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
    }

    function print() {
        windowRef.print();
    }

    function handleFontsReady() {
        rerenderResumeNow();
    }

    function handleBeforePrint() {
        if (printRestoreTimer !== null) {
            windowRef.clearTimeout(printRestoreTimer);
            printRestoreTimer = null;
        }
        rerenderResumeNow(RENDER_MODE_PRINT);
    }

    function handleAfterPrint() {
        scheduleScreenModeRestore();
    }

    function getResumeData() {
        return cloneData(resumeData);
    }

    function getLastExportedJson() {
        return lastExportedJson;
    }

    function getStatusText() {
        return statusText.textContent;
    }

    function getAvatarCropState() {
        return avatarCropState ? createAvatarCropState(avatarCropState.imageSrc, avatarCropState.frame, avatarCropState.fileName) : null;
    }

    function openCurrentAvatarCropper(fileName = "当前头像") {
        openAvatarCropper(resumeData.profileImage, resumeData.avatarFrame, fileName, resumeData.avatarImageMeta || getCachedAvatarImageMeta(resumeData.profileImage));
    }

    function setAvatarCropFrame(frame) {
        if (!avatarCropState) {
            return;
        }
        avatarCropState.frame = normalizeAvatarFrame({ ...avatarCropState.frame, ...frame }, avatarCropState.imageMeta, getAvatarEditorMinZoom(avatarCropState.imageMeta));
        syncAvatarEditorUI();
    }

    function dragAvatarCropFrame(deltaX, deltaY, width = 420, height = 420) {
        if (!avatarCropState) {
            return;
        }
        avatarCropState.frame = calculateAvatarFrameFromDrag(avatarCropState.frame, deltaX, deltaY, width, height, avatarCropState.imageMeta, getAvatarEditorMinZoom(avatarCropState.imageMeta));
        syncAvatarEditorUI();
    }

    function setAvatarFrame(frame) {
        resumeData.avatarFrame = normalizeAvatarFrame({ ...resumeData.avatarFrame, ...frame }, resumeData.avatarImageMeta || getCachedAvatarImageMeta(resumeData.profileImage));
        syncAvatarEditorUI();
        renderResume(resumeData, activeRenderMode);
        saveDraft();
    }

    function dragAvatarFrame(deltaX, deltaY, width = 136, height = 136) {
        resumeData.avatarFrame = calculateAvatarFrameFromDrag(resumeData.avatarFrame, deltaX, deltaY, width, height, resumeData.avatarImageMeta || getCachedAvatarImageMeta(resumeData.profileImage));
        syncAvatarEditorUI();
        renderResume(resumeData, activeRenderMode);
        saveDraft();
    }

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

    return {
        initializeApp,
        handleFormInput,
        handleFormChange,
        handleFormClick,
        resetData,
        exportData,
        openImportPicker,
        handleImportFileChange,
        print,
        handleFontsReady,
        rerenderResumeSoon,
        rerenderResumeNow,
        handleBeforePrint,
        handleAfterPrint,
        getResumeData,
        getLastExportedJson,
        getStatusText,
        getAvatarCropState,
        rerender: renderAll,
        openAvatarCropper: openCurrentAvatarCropper,
        confirmAvatarCrop,
        cancelAvatarCrop: closeAvatarCropper,
        setAvatarCropFrame,
        dragAvatarCropFrame,
        setAvatarFrame,
        dragAvatarFrame
    };
}
