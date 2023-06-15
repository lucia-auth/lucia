import { defineConfig } from "astro/config";
import markdown from "./integrations/markdown";

import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
	integrations: [tailwind(), markdown()],
	markdown: {
		shikiConfig: {
			theme: "min-light"
		}
	}
});
