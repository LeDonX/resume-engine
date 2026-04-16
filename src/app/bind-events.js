export function bindResumeAppEvents({ app, dom, windowRef = window, documentRef = document }) {
    const {
        formRoot,
        resetButton,
        exportButton,
        importButton,
        importFileInput,
        printButton
    } = dom;

    formRoot.addEventListener("input", (event) => {
        app.handleFormInput(event.target);
    });

    formRoot.addEventListener("change", (event) => {
        app.handleFormChange(event.target);
    });

    formRoot.addEventListener("click", (event) => {
        app.handleFormClick(event.target);
    });

    resetButton.addEventListener("click", () => {
        app.resetData();
    });

    exportButton.addEventListener("click", () => {
        app.exportData();
    });

    importButton.addEventListener("click", () => {
        app.openImportPicker();
    });

    importFileInput.addEventListener("change", () => {
        void app.handleImportFileChange();
    });

    printButton.addEventListener("click", () => {
        app.print();
    });

    if (documentRef.fonts?.ready) {
        documentRef.fonts.ready.then(() => {
            app.handleFontsReady();
        });
    }

    windowRef.addEventListener("resize", app.rerenderResumeSoon);
    windowRef.addEventListener("orientationchange", app.rerenderResumeSoon);
    windowRef.addEventListener("load", app.rerenderResumeSoon);
    windowRef.addEventListener("beforeprint", app.handleBeforePrint);
    windowRef.addEventListener("afterprint", app.handleAfterPrint);
}
