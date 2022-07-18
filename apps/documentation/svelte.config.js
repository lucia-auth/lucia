import adapter from '@sveltejs/adapter-auto';
import preprocess from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	preprocess: [
		preprocess({
			postcss: true
		})
	],

	kit: {
		adapter: adapter(),
		files: {
			lib: 'src/lib'
		},
		prerender: {
			enabled: true,
			entries: [
				'/',
				'/introduction',
				'/getting-started',
				'/adapters',
				'/adapters/custom',
				'/adapters/supabase',
				'/configurations',
				'/server-apis',
				'/client-apis',
				'/references',
				'/references/error-handling',
				'/references/types'
			]
		}
	}
};

export default config;
