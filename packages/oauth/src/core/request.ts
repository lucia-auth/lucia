export class OAuthRequestError extends Error {
	public request: Request;
	public response: Response;
	public message = "OAUTH_REQUEST_FAILED" as const;
	constructor(request: Request, response: Response) {
		super("OAUTH_REQUEST_FAILED");
		this.request = request;
		this.response = response;
	}
}
