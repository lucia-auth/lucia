export default Promise.all([
	import("lucia-auth"),
	import("@lucia-auth/adapter-prisma"),
	import("@lucia-auth/oauth/github")
]).then(([lucia, prisma, github]) => {
	return {
		lucia: lucia.default,
		prisma: prisma.default,
		github: github.default
	};
});
