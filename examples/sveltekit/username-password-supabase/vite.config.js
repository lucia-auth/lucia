import { sveltekit } from '@sveltejs/kit/vite';

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [sveltekit()],
	// ssr: {
	// 	noExternal: ["@lucia-auth/sveltekit"]
	// }
};

export default config;
