import { defineConfig } from "astro/config";
import markdown from "./integrations/markdown";
import og from "./integrations/og";

import tailwind from "@astrojs/tailwind";

import { rehypeHeadingIds } from "@astrojs/markdown-remark";

// https://astro.build/config
export default defineConfig({
	integrations: [tailwind(), markdown(), og()],
	markdown: {
		rehypePlugins: [rehypeHeadingIds],
		shikiConfig: {
			theme: "min-light"
		}
	}
});
