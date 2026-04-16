import {
    AVATAR_SIDECAR_DB_NAME,
    AVATAR_SIDECAR_RECORD_KEY,
    AVATAR_SIDECAR_STORE_NAME,
    DRAFT_AVATAR_SENTINEL,
    DRAFT_STORAGE_VERSION,
    STORAGE_KEY
} from "../core/config.js";
import { cloneData, pickText } from "../core/utils.js";
import {
    cacheAvatarImageMeta,
    createDefaultAvatarFrame,
    getDraftAvatarValue,
    hasCustomAvatarImage,
    loadAvatarImageMeta,
    normalizeAvatarFrame,
    normalizeAvatarImageMeta
} from "../avatar/avatar-utils.js";

export function buildDraftStoragePayload(data) {
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

export function parseDraftStoragePayload(raw) {
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

export function createDraftStore({ getResumeData, normalizeResumeData, setStatus, setCleanSnapshot }) {
    let avatarSidecarPersistedValue = "";
    let avatarSidecarDesiredValue = "";
    let avatarSidecarSyncInFlight = false;
    let avatarSidecarSyncQueue = Promise.resolve(true);

    function primeAvatarSidecarState(persistedValue = "", desiredValue = persistedValue) {
        avatarSidecarPersistedValue = getDraftAvatarValue(persistedValue);
        avatarSidecarDesiredValue = getDraftAvatarValue(desiredValue);
    }

    function syncAvatarSidecar(options = {}) {
        const resumeData = getResumeData();
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
            cacheAvatarImageMeta(profileImage, normalizedMeta);
            return false;
        }

        try {
            const resolvedMeta = normalizeAvatarImageMeta(await loadAvatarImageMeta(profileImage));
            if (resolvedMeta) {
                targetData.avatarImageMeta = resolvedMeta;
                targetData.avatarFrame = normalizeAvatarFrame(targetData.avatarFrame, resolvedMeta);
                cacheAvatarImageMeta(profileImage, resolvedMeta);
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
            localStorage.setItem(STORAGE_KEY, JSON.stringify(buildDraftStoragePayload(getResumeData())));
            setCleanSnapshot(getResumeData());
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
                            cacheAvatarImageMeta(avatarValue, normalizedDraft.avatarImageMeta);
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

    return {
        hydrateAvatarStateIfNeeded,
        loadDraft,
        primeAvatarSidecarState,
        saveDraft,
        syncAvatarSidecar
    };
}
