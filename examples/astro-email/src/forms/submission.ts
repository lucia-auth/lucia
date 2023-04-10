export const isValidFormSubmission = (request: Request) => {
	if (request.method !== "POST") return false;
	const originHeader = request.headers.get("Origin");
	if (!originHeader || originHeader !== new URL(request.url).origin) {
		return false;
	}
	return true;
};

export const emailRegex = /^.+@.+/;
