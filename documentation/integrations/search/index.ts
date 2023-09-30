import type { AstroIntegration } from "astro";

export default () => {
	const integration: AstroIntegration = {
		name: "lucia:search",
		hooks: {
			"astro:config:setup": ({ injectScript }) => {
				process.env.BUILD_ID = crypto.randomUUID();
				if (import.meta.env.DEV) {
					injectScript("page", `localStorage.removeItem("search:content")`);
				}
			}
		}
	};
	return integration;
};
