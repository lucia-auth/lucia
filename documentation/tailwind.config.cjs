/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			colors: {
				main: "#7057ff",
				"main-darker": "#643ce8",
				"main-black": "#0b0a26",
				"black-zinc": "#121214"
			}
		},
	},
	darkMode: "class",
	plugins: [],
}
