import { defineConfig } from "astro/config";
import markdown from "./integrations/markdown";
import og from "./integrations/og";
import search from "./integrations/search";
import tailwind from "@astrojs/tailwind";

import { rehypeHeadingIds } from "@astrojs/markdown-remark";

// https://astro.build/config
export default defineConfig({
	integrations: [tailwind(), markdown(), og(), search()],
	markdown: {
		rehypePlugins: [rehypeHeadingIds],
		shikiConfig: {
			theme: "min-light"
		}
	}
});
