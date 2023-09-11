export const isAllowedOrigin = (
	origin: string,
	host: string,
	allowedSubdomains: "*" | (string | null)[]
): boolean => {
	const originHost = new URL(origin).host;
	const baseDomain = getBaseDomain(host);
	if (host.length < 1 || origin.length < 1) return false;
	if (originHost === host) return true;
	if (allowedSubdomains === "*") {
		if (originHost.endsWith(`.${baseDomain}`)) return true;
		return false;
	}
	for (const subdomain of allowedSubdomains) {
		const allowedHostPermutation =
			subdomain === null ? baseDomain : [subdomain, baseDomain].join(".");
		if (allowedHostPermutation === originHost) return true;
	}
	return false;
};

const getBaseDomain = (host: string): string => {
	if (host.startsWith("localhost:")) return host;
	return host.split(".").slice(-2).join(".");
};

export const safeParseUrl = (url: string): URL | null => {
	try {
		return new URL(url);
	} catch {
		return null;
	}
};
