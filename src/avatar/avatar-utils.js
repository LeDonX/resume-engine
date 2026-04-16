import {
    AVATAR_CROP_FRAME_RATIO,
    AVATAR_OFFSET_LIMIT,
    AVATAR_SHAPE_CIRCLE,
    AVATAR_SHAPE_RECTANGLE,
    DEFAULT_AVATAR_FRAME,
    DEFAULT_AVATAR_IMAGE_META,
    FALLBACK_AVATAR
} from "../core/config.js";
import { clampNumber, pickText } from "../core/utils.js";

const avatarImageMetaCache = new Map();

export function createDefaultAvatarFrame() {
    return { ...DEFAULT_AVATAR_FRAME };
}

export function getCachedAvatarImageMeta(imageSrc) {
    const src = pickText(imageSrc, "").trim();
    return src ? (avatarImageMetaCache.get(src) || null) : null;
}

export function cacheAvatarImageMeta(imageSrc, imageMeta) {
    const src = pickText(imageSrc, "").trim();
    if (!src) {
        return;
    }
    avatarImageMetaCache.set(src, imageMeta || null);
}

export function loadAvatarImageMeta(imageSrc) {
    const src = pickText(imageSrc, "").trim();
    if (!src) {
        return Promise.resolve(null);
    }
    if (typeof Image === "undefined") {
        return Promise.resolve(null);
    }
    if (avatarImageMetaCache.has(src)) {
        return Promise.resolve(avatarImageMetaCache.get(src));
    }

    return new Promise((resolve) => {
        const image = new Image();
        image.onload = () => resolve({ width: image.naturalWidth || 0, height: image.naturalHeight || 0 });
        image.onerror = () => resolve(null);
        image.src = src;
    }).then((meta) => {
        avatarImageMetaCache.set(src, meta);
        return meta;
    });
}

export function normalizeAvatarShape(value) {
    return value === AVATAR_SHAPE_RECTANGLE ? AVATAR_SHAPE_RECTANGLE : AVATAR_SHAPE_CIRCLE;
}

export function getAvatarFrameLabel(shape) {
    return normalizeAvatarShape(shape) === AVATAR_SHAPE_RECTANGLE ? "矩形框" : "圆框";
}

export function getAvatarCropMaskRadius(shape) {
    return normalizeAvatarShape(shape) === AVATAR_SHAPE_RECTANGLE ? "1rem" : "9999px";
}

export function getAvatarFrameContainerClass(shape) {
    return normalizeAvatarShape(shape) === AVATAR_SHAPE_RECTANGLE ? "rounded-2xl" : "rounded-full";
}

export function normalizeAvatarImageMeta(sourceValue) {
    const source = sourceValue && typeof sourceValue === "object" ? sourceValue : {};
    const width = Math.max(0, Math.round(clampNumber(source.width, 0, 100000, DEFAULT_AVATAR_IMAGE_META.width)));
    const height = Math.max(0, Math.round(clampNumber(source.height, 0, 100000, DEFAULT_AVATAR_IMAGE_META.height)));
    if (!width || !height) {
        return null;
    }
    return { width, height };
}

export function getAvatarEditorMinZoom(imageMeta) {
    const meta = normalizeAvatarImageMeta(imageMeta);
    if (!meta) {
        return 1;
    }
    const minDimension = Math.min(meta.width, meta.height);
    const maxDimension = Math.max(meta.width, meta.height);
    const fitZoom = minDimension / (maxDimension * AVATAR_CROP_FRAME_RATIO);
    return Math.min(1, Math.max(0.2, Number(fitZoom.toFixed(2))));
}

export function createInitialAvatarCropFrame(imageMeta) {
    const frame = createDefaultAvatarFrame();
    frame.zoom = getAvatarEditorMinZoom(imageMeta);
    return frame;
}

export function getAvatarOffsetLimits(zoom, imageMeta) {
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

export function normalizeAvatarFrame(sourceValue, imageMeta = null, minZoom = 1) {
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

export function getAvatarImageStyle(frame, imageMeta = null, viewportRatio = 1, minZoom = 1) {
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

export function createAvatarCropState(imageSrc, frame, fileName = "", imageMeta = null) {
    const minZoom = getAvatarEditorMinZoom(imageMeta);
    return {
        imageSrc: pickText(imageSrc, "").trim(),
        frame: normalizeAvatarFrame(frame, imageMeta, minZoom),
        fileName: pickText(fileName, ""),
        imageMeta: imageMeta && imageMeta.width && imageMeta.height ? { width: imageMeta.width, height: imageMeta.height } : null,
        pendingQuickAction: null
    };
}

export function calculateAvatarFrameFromDrag(startFrame, deltaX, deltaY, width, height, imageMeta = null, minZoom = 1) {
    const avatarFrame = normalizeAvatarFrame(startFrame, imageMeta, minZoom);
    return normalizeAvatarFrame({
        ...avatarFrame,
        offsetX: avatarFrame.offsetX + ((deltaX / Math.max(width, 1)) * 100),
        offsetY: avatarFrame.offsetY + ((deltaY / Math.max(height, 1)) * 100)
    }, imageMeta, minZoom);
}

export function getAvatarImageSource(value) {
    const image = pickText(value, "").trim();
    return /^data:image\/(png|jpeg|webp);/i.test(image) ? image : FALLBACK_AVATAR;
}

export function hasCustomAvatarImage(value) {
    return /^data:image\/(png|jpeg|webp);/i.test(pickText(value, "").trim());
}

export function getDraftAvatarValue(value) {
    const image = pickText(value, "").trim();
    return hasCustomAvatarImage(image) ? image : "";
}
