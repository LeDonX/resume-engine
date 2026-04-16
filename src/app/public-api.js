export function createResumeAppPublicApi(app) {
    return {
        getResumeData: app.getResumeData,
        getLastExportedJson: app.getLastExportedJson,
        getStatusText: app.getStatusText,
        getAvatarCropState: app.getAvatarCropState,
        rerender: app.rerender,
        openAvatarCropper: app.openAvatarCropper,
        confirmAvatarCrop: app.confirmAvatarCrop,
        cancelAvatarCrop: app.cancelAvatarCrop,
        setAvatarCropFrame: app.setAvatarCropFrame,
        dragAvatarCropFrame: app.dragAvatarCropFrame,
        setAvatarFrame: app.setAvatarFrame,
        dragAvatarFrame: app.dragAvatarFrame
    };
}
