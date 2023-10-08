/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		"./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}",
		"./integrations/**/*.ts"
	],
	theme: {
		extend: {
			screens: {
				xs: "475px",
				"1.5xl": "1400px"
			},
			colors: {
				main: "#5f57ff",
				"main-pastel": "#a7a6ff",
				zinc: {
					50: "rgb(var(--color-zinc-50) / <alpha-value>)",
					80: "rgb(var(--color-zinc-80) / <alpha-value>)",
					100: "rgb(var(--color-zinc-100) / <alpha-value>)",
					200: "rgb(var(--color-zinc-200) / <alpha-value>)",
					300: "rgb(var(--color-zinc-300) / <alpha-value>)",
					400: "rgb(var(--color-zinc-400) / <alpha-value>)",
					500: "rgb(var(--color-zinc-500) / <alpha-value>)",
					600: "rgb(var(--color-zinc-600) / <alpha-value>)",
					700: "rgb(var(--color-zinc-700) / <alpha-value>)",
					800: "rgb(var(--color-zinc-800) / <alpha-value>)",
					900: "rgb(var(--color-zinc-900) / <alpha-value>)",
					950: "rgb(var(--color-zinc-950) / <alpha-value>)"
				},
				white: "rgb(var(--color-white) / <alpha-value>)",
				black: "rgb(var(--color-black) / <alpha-value>)"
			},
			fontSize: {
				"code-sm": "0.825rem",
				"code-base": "0.925rem",
				"code-lg": "1.12rem",
				"code-xl": "1.2rem",
				"code-2xl": "1.45rem",
				"code-3xl": "1.825rem",
				"code-4xl": "2.15rem",
				"code-5xl": "2.9rem"
			}
		}
	},
	plugins: []
};
