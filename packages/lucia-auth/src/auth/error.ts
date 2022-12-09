export class LuciaError extends Error {
	constructor(errorMsg: ErrorMessage, detail?: string) {
		super(errorMsg);
		this.message = errorMsg;
		this.detail = detail ?? "";
	}
	public detail: string;
	public message: ErrorMessage;
}

export type ErrorMessage =
	| "AUTH_INVALID_SESSION_ID"
	| "AUTH_INVALID_PASSWORD"
	| "AUTH_INVALID_PROVIDER_ID"
	| "AUTH_DUPLICATE_SESSION_ID"
	| "AUTH_DUPLICATE_PROVIDER_ID"
	| "AUTH_INVALID_USER_ID"
	| "AUTH_INVALID_REQUEST"
	| "AUTH_NOT_AUTHENTICATED"
	| "REQUEST_UNAUTHORIZED"
	| "UNKNOWN_ERROR"
	| "AUTH_OUTDATED_PASSWORD";
