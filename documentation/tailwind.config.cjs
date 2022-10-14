/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			colors: {
				main: "#654aff",
				"main-darker": "#643ce8",
				"main-black": "#0b0a26"
			}
		},
	},
	plugins: [],
}
