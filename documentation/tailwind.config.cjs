/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
	theme: {
		extend: {
			colors: {
				main: "#5f57ff",
				"shadow-zinc": "#121214",
				"black-zinc": "#0C0C0D",
				svelte: "#ff6430",
				zinc: {
					80: "#F5F5F6",
					150: "#EDEDEF",
					950: "#141416"
				}
			}
		}
	},
	darkMode: "class",
	plugins: []
};
