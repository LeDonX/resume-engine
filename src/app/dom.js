export function getAppDom(rootDocument = document) {
    return {
        formRoot: rootDocument.getElementById("form-root"),
        resumeRoot: rootDocument.getElementById("resume-root"),
        statusText: rootDocument.getElementById("form-status"),
        resetButton: rootDocument.getElementById("reset-data"),
        exportButton: rootDocument.getElementById("export-data"),
        importButton: rootDocument.getElementById("import-data"),
        importFileInput: rootDocument.getElementById("import-file"),
        printButton: rootDocument.getElementById("print-pdf")
    };
}
