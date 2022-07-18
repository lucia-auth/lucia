export declare class LuciaError extends Error {
    constructor(errorMsg: ErrorMessage, detail?: string);
    detail: string;
}
declare type ErrorMessage = "AUTH_INVALID_ACCESS_TOKEN" | "AUTH_INVALID_REFRESH_TOKEN" | "AUTH_INVALID_PASSWORD" | "AUTH_INVALID_IDENTIFIER_TOKEN" | "AUTH_DUPLICATE_USER_DATA" | "AUTH_DUPLICATE_IDENTIFER_TOKEN" | "DATABASE_FETCH_FAILED" | "DATABASE_UPDATE_FAILED" | "REQUEST_UNAUTHORIZED" | "UNKNOWN_ERROR";
export {};
