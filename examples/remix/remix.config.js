/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
	ignoredRouteFiles: ["**/.*"],
	tailwind: true,
	serverModuleFormat: "cjs",
	future: {
		v2_errorBoundary: true,
		v2_meta: true,
		v2_normalizeFormMethod: true,
		v2_routeConvention: true
	},
	serverDependenciesToBundle: [
		"lucia-auth",
		"lucia-auth/middleware",
		"@lucia-auth/adapter-prisma",
		"@lucia-auth/oauth",
		"@lucia-auth/oauth/providers",
		"lucia-auth/polyfill/node"
	]
};
