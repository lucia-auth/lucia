import path from "path";

import type { AstroIntegration } from "astro";

export default () => {
	const integration: AstroIntegration = {
		name: "lucia:search",
		hooks: {
			"astro:config:setup": ({ injectRoute, injectScript }) => {
				process.env.BUILD_ID = crypto.randomUUID();
				if (import.meta.env.DEV) {
					injectScript("page", `localStorage.removeItem("search:content")`);
				}
				const currentDir = path.dirname(import.meta.url.replace("file://", ""));
				injectRoute({
					entryPoint: path.join(currentDir, "content.txt.ts"),
					pattern: "/content.txt"
				});
			}
		}
	};
	return integration;
};
