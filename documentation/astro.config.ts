import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import solidJs from "@astrojs/solid-js";
import siena from "siena";
// importing via "integrations" will result in an error
import cela from "./integrations/cela";
import preprocess from "./integrations/preprocess";
import markdown from "./integrations/markdown";

import vercel from "@astrojs/vercel/edge";

export default defineConfig({
	integrations: [
		tailwind(),
		solidJs(),
		siena(),
		cela(),
		preprocess(),
		markdown()
	],
	output: "server",
	adapter: vercel()
});
