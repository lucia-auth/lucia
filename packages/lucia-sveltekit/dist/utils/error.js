export class LuciaError extends Error {
    constructor(errorMsg, detail) {
        super(errorMsg);
        this.detail = detail || "";
    }
    detail;
}
