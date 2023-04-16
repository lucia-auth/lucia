import { generateContent, generateCollection } from "./generate";
import path from "path";

import type { AstroIntegration } from "astro";
import type { Plugin as VitePlugin } from "vite";

export { CELA_GENERATED_DIR } from "./constant";
export * from "./types";

export default (
	celaCompletedCallback: () => void | Promise<void> = () => {}
) => {
	const integration: AstroIntegration = {
		name: "lucia:cela",
		hooks: {
			"astro:config:setup": ({ updateConfig }) => {
				const vitePlugin: VitePlugin = {
					name: "lucia:cela",
					buildStart: async () => {
						generateContent();
						celaCompletedCallback();
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
						celaCompletedCallback();
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
