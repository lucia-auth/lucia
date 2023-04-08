import { fetchGithub } from "./github";

import type { AstroIntegration } from "astro";
import type { Plugin as VitePlugin } from "vite";

export default () => {
	const integration: AstroIntegration = {
		name: "lucia:preprocess",
		hooks: {
			"astro:config:setup": ({ updateConfig }) => {
				const plugin: VitePlugin = {
					name: "lucia:preprocess",
					buildStart: async () => {
						await fetchGithub();
					}
				};
				updateConfig({
					vite: {
						plugins: [plugin]
					}
				});
			}
		}
	};
	return integration;
};
