import { defineConfig } from "astro/config";

import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
	markdown: {
		shikiConfig: {
			theme: "css-variables"
		}
	},
	integrations: [tailwind()]
});
