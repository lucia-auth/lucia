export class LuciaError extends Error {
    constructor(errorMsg: ErrorMessage, detail?: string) {
        super(errorMsg);
        this.detail = detail || "";
    }
    public detail: string;
}

type ErrorMessage =
    | "AUTH_INVALID_ACCESS_TOKEN"
    | "AUTH_INVALID_REFRESH_TOKEN"
    | "AUTH_INVALID_PASSWORD"
    | "AUTH_INVALID_PROVIDER_ID"
    | "AUTH_DUPLICATE_USER_DATA"
    | "AUTH_DUPLICATE_PROVIDER_ID"
    | "AUTH_INVALID_USER_ID"
    | "AUTH_INVALID_REQUEST"
    | "AUTH_NOT_AUTHENTICATED"
    | "DATABASE_FETCH_FAILED"
    | "DATABASE_UPDATE_FAILED"
    | "REQUEST_UNAUTHORIZED"
    | "UNKNOWN_ERROR"
    | "AUTH_OUTDATED_PASSWORD"
    | "AUTH_DUPLICATE_ACCESS_TOKEN"
    | "AUTH_DUPLICATE_REFRESH_TOKEN";
