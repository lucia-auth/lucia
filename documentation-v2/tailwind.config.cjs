/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			colors: {
				main: "#5f57ff",
			},
			fontSize: {
				"code-sm": "0.825rem",
				"code-base": "0.95rem"
			}
		},
	},
	plugins: [],
}
