export const isAllowedUrl = (
	incomingUrl: string | URL,
	app: {
		url: string | URL;
		allowedSubdomains: "*" | string[];
	}
): boolean => {
	const getHostname = (urlParams: string | URL) => {
		if (typeof urlParams === "string") return new URL(urlParams).hostname;
		return urlParams.hostname;
	};
	const incomingHostname = getHostname(incomingUrl);
	const appHostname = getHostname(app.url);
	const appBaseDomain = getBaseDomain(appHostname);
	if (incomingHostname === appHostname) return true;
	if (app.allowedSubdomains === "*") {
		if (incomingHostname.endsWith(`.${appBaseDomain}`)) return true;
		return false;
	}
	const allowedHosts = app.allowedSubdomains.map((subdomain) => {
		return [subdomain, appBaseDomain].join(".");
	});
	return allowedHosts.includes(incomingHostname);
};

const getBaseDomain = (hostname: string): string => {
	if (hostname === "localhost") return "localhost";
	return hostname.split(".").slice(-2).join(".");
};
