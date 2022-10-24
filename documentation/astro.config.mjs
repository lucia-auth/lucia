import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import svelte from "@astrojs/svelte";

// https://astro.build/config
export default defineConfig({
	integrations: [tailwind(), svelte()],
	markdown: {
		shikiConfig: {
			theme: "github-dark"
		},
		rehypePlugins: [
			[
				"rehype-wrap-all",
				{
					selector: "table",
					wrapper: "div.table-wrapper"
				}
			]
		],
		extendDefaultPlugins: true
	}
});
