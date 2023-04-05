import { generateContent, generateCollection } from "./generate";
import path from "path";

import type { AstroIntegration } from "astro";
import type { Plugin as VitePlugin } from "vite";

export default () => {
	const integration: AstroIntegration = {
		name: "lucia:cela",
		hooks: {
			"astro:config:setup": ({ updateConfig }) => {
				const vitePlugin: VitePlugin = {
					name: "lucia:cela",
					buildStart: async () => {
						generateContent();
					},
					handleHotUpdate: async (ctx) => {
						const collectionDirPath = path.join(process.cwd(), "content");
						if (!ctx.file.startsWith(collectionDirPath)) return;
						await ctx.read();
						const workingPath = ctx.file.replace(
							path.join(process.cwd(), "content"),
							""
						);
						const [baseCollectionId] = workingPath.replace("/", "").split("/");
						generateCollection(baseCollectionId);
					}
				};
				updateConfig({
					vite: {
						plugins: [vitePlugin]
					}
				});
			}
		}
	};
	return integration;
};
