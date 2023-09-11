export const createHeadersFromObject = (
	headersObject: Record<string, string | string[] | null | undefined>
): Headers => {
	const headers = new Headers();
	for (const [key, value] of Object.entries(headersObject)) {
		if (value === undefined || value === null) continue;
		if (typeof value === "string") {
			headers.set(key, value);
			continue;
		}
		for (const arrayValue of value) {
			headers.append(key, arrayValue);
		}
	}
	return headers;
};

export const safeParseUrl = (url: string): URL | null => {
	try {
		return new URL(url);
	} catch {
		return null;
	}
};
