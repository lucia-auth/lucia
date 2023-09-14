export const createHeadersFromObject = (
	headersObject: Record<string, string | string[] | null | undefined>
): Headers => {
	const headers = new Headers();
	for (const [key, value] of Object.entries(headersObject)) {
		if (value === null || value === undefined) continue;
		if (typeof value === "string") {
			headers.set(key, value);
		} else {
			for (const item of value) {
				headers.append(key, item);
			}
		}
	}
	return headers;
};
