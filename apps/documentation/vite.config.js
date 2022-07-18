import { sveltekit } from '@sveltejs/kit/vite';

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [sveltekit()],
	resolve: {
		alias: {
			$components: '/src/components'
		}
	},
	server: {
		fs: {
			allow: ['../../']
		},
		port: '3000'
	}
};

export default config;
