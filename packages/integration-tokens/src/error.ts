export class LuciaTokenError extends Error {
	public message: ErrorMessage;
	constructor(errorMessage: ErrorMessage) {
		super(errorMessage);
		this.message = errorMessage;
	}
}

type ErrorMessage =
	| "INVALID_TOKEN"
	| "EXPIRED_TOKEN"
	| "INVALID_USER_ID"
	| "DUPLICATE_TOKEN";
