import { defineConfig } from "astro/config";
import markdown from "./integrations/markdown";
import og from "./integrations/og"

import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
	integrations: [tailwind(), markdown(), og()],
	markdown: {
		shikiConfig: {
			theme: "min-light"
		}
	}
});
