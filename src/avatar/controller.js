import {
    ALLOWED_AVATAR_EXTENSIONS,
    ALLOWED_AVATAR_TYPES,
    AVATAR_CROP_FRAME_RATIO,
    AVATAR_OFFSET_LIMIT,
    AVATAR_STORAGE_QUALITIES,
    DEFAULT_AVATAR_FRAME,
    FALLBACK_AVATAR,
    MAX_AVATAR_DRAFT_DATA_URL_LENGTH,
    MAX_AVATAR_FILE_SIZE,
    MAX_AVATAR_STORAGE_EDGE
} from "../core/config.js";
import { clampNumber, cloneData, pickText } from "../core/utils.js";
import {
    cacheAvatarImageMeta,
    calculateAvatarFrameFromDrag,
    createAvatarCropState,
    createDefaultAvatarFrame,
    createInitialAvatarCropFrame,
    getAvatarCropMaskRadius,
    getAvatarEditorMinZoom,
    getAvatarFrameLabel,
    getAvatarImageSource,
    getAvatarImageStyle,
    getCachedAvatarImageMeta,
    hasCustomAvatarImage,
    loadAvatarImageMeta,
    normalizeAvatarFrame,
    normalizeAvatarImageMeta
} from "./avatar-utils.js";

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

export function createAvatarController(deps) {
    const {
        formRoot,
        getResumeData,
        getAvatarCropState,
        setAvatarCropState,
        getAvatarDragState,
        setAvatarDragState,
        renderForm,
        renderResume,
        renderAll,
        saveDraft,
        setStatus,
        getActiveRenderMode
    } = deps;

    function getAvatarEditorState() {
        const avatarCropState = getAvatarCropState();
        if (avatarCropState) {
            return avatarCropState;
        }
        const resumeData = getResumeData();
        return {
            imageSrc: getAvatarImageSource(resumeData.profileImage),
            frame: normalizeAvatarFrame(resumeData.avatarFrame, resumeData.avatarImageMeta || getCachedAvatarImageMeta(resumeData.profileImage)),
            fileName: "",
            imageMeta: resumeData.avatarImageMeta || getCachedAvatarImageMeta(resumeData.profileImage)
        };
    }

    function syncAvatarEditorUI() {
        const resumeData = getResumeData();
        const avatarCropState = getAvatarCropState();
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
                cacheAvatarImageMeta(avatarCropState.imageSrc, avatarCropState.imageMeta);
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

    function setAvatarEditorFrame(frame) {
        const avatarCropState = getAvatarCropState();
        if (avatarCropState) {
            avatarCropState.frame = normalizeAvatarFrame(frame, avatarCropState.imageMeta, getAvatarEditorMinZoom(avatarCropState.imageMeta));
            syncAvatarEditorUI();
            return;
        }

        const resumeData = getResumeData();
        resumeData.avatarFrame = normalizeAvatarFrame(frame, resumeData.avatarImageMeta || getCachedAvatarImageMeta(resumeData.profileImage));
        syncAvatarEditorUI();
        renderResume(resumeData, getActiveRenderMode());
        saveDraft();
    }

    function openAvatarCropper(imageSrc, frame = createDefaultAvatarFrame(), fileName = "", imageMeta = null) {
        setAvatarCropState(createAvatarCropState(imageSrc, frame, fileName, imageMeta || getCachedAvatarImageMeta(imageSrc)));
        setAvatarDragState(null);
        renderForm();
        syncAvatarEditorUI();

        const activeCropState = getAvatarCropState();
        if (!activeCropState?.imageMeta && activeCropState?.imageSrc) {
            loadAvatarImageMeta(activeCropState.imageSrc).then((resolvedMeta) => {
                const currentCropState = getAvatarCropState();
                if (!resolvedMeta || !currentCropState || currentCropState.imageSrc !== imageSrc) {
                    return;
                }
                currentCropState.imageMeta = resolvedMeta;
                currentCropState.frame = normalizeAvatarFrame(currentCropState.frame, resolvedMeta, getAvatarEditorMinZoom(resolvedMeta));
                if (currentCropState.pendingQuickAction) {
                    const pendingAction = currentCropState.pendingQuickAction;
                    currentCropState.pendingQuickAction = null;
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
        setAvatarCropState(null);
        setAvatarDragState(null);
        renderForm();
    }

    function applyAvatarCropQuickAction(mode) {
        const avatarCropState = getAvatarCropState();
        if (!avatarCropState) {
            return;
        }

        const resumeData = getResumeData();
        const frameLabel = getAvatarFrameLabel(resumeData.avatarShape);

        if (mode === "show-full" && !avatarCropState.imageMeta) {
            avatarCropState.pendingQuickAction = mode;
            setStatus("正在读取图片尺寸，稍后会自动切换到完整预览。", "info");
            return;
        }

        const minZoom = getAvatarEditorMinZoom(avatarCropState.imageMeta);
        const currentFrame = normalizeAvatarFrame(avatarCropState.frame, avatarCropState.imageMeta, minZoom);

        if (mode === "center") {
            setAvatarEditorFrame({ ...currentFrame, offsetX: 0, offsetY: 0 });
            setStatus("已将头像重新居中。", "info");
            return;
        }

        if (mode === "show-full") {
            setAvatarEditorFrame({ ...currentFrame, zoom: minZoom, offsetX: 0, offsetY: 0 });
            setStatus("已切换为完整预览。", "info");
            return;
        }

        if (mode === "fill-frame") {
            setAvatarEditorFrame({ ...currentFrame, zoom: 1, offsetX: 0, offsetY: 0 });
            setStatus(`已填满${frameLabel}，可继续微调。`, "info");
        }
    }

    function confirmAvatarCrop() {
        const avatarCropState = getAvatarCropState();
        if (!avatarCropState) {
            return;
        }

        const resumeData = getResumeData();
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

        setAvatarCropState(null);
        renderAll();
        const suffix = nextCrop.fileName ? `：${nextCrop.fileName}` : "";
        setStatus(`头像已更新并保存${suffix}`, "success");
    }

    function initAvatarFrameEditor() {
        const dragSurface = formRoot.querySelector('[data-avatar-drag-surface="true"]');
        const editorImage = formRoot.querySelector('[data-avatar-editor-image="true"]');
        if (!dragSurface) {
            return;
        }

        const applyWheelZoom = (deltaY) => {
            const editorState = getAvatarEditorState();
            const minZoom = getAvatarCropState() ? getAvatarEditorMinZoom(editorState.imageMeta) : 1;
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
            const avatarCropState = getAvatarCropState();
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
            if (!getAvatarDragState()) {
                return;
            }
            setAvatarDragState(null);
            dragSurface.classList.remove("cursor-grabbing");
            dragSurface.classList.add("cursor-grab");
            if (shouldPersist && !getAvatarCropState()) {
                saveDraft();
            }
        };

        dragSurface.addEventListener("pointerdown", (event) => {
            if (event.button !== undefined && event.button !== 0) {
                return;
            }
            const rect = dragSurface.getBoundingClientRect();
            const editorState = getAvatarEditorState();
            const avatarCropState = getAvatarCropState();
            setAvatarDragState({
                pointerId: event.pointerId,
                startX: event.clientX,
                startY: event.clientY,
                width: rect.width,
                height: rect.height,
                startFrame: normalizeAvatarFrame(editorState.frame, editorState.imageMeta, avatarCropState ? getAvatarEditorMinZoom(editorState.imageMeta) : 1),
                imageMeta: editorState.imageMeta,
                minZoom: avatarCropState ? getAvatarEditorMinZoom(editorState.imageMeta) : 1
            });
            if (typeof dragSurface.setPointerCapture === "function" && event.pointerId !== undefined) {
                dragSurface.setPointerCapture(event.pointerId);
            }
            dragSurface.classList.remove("cursor-grab");
            dragSurface.classList.add("cursor-grabbing");
            event.preventDefault();
        });

        dragSurface.addEventListener("pointermove", (event) => {
            const avatarDragState = getAvatarDragState();
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
            const avatarDragState = getAvatarDragState();
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
            if (!getAvatarCropState()) {
                renderResume(getResumeData(), getActiveRenderMode());
            }
        });
        syncAvatarEditorUI();
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

        const resumeData = getResumeData();
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

    return {
        getAvatarEditorState,
        syncAvatarEditorUI,
        setAvatarEditorFrame,
        openAvatarCropper,
        closeAvatarCropper,
        applyAvatarCropQuickAction,
        confirmAvatarCrop,
        initAvatarFrameEditor,
        handleAvatarUpload
    };
}
