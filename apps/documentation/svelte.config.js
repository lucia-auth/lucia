import adapter from '@sveltejs/adapter-vercel';
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
		adapter: adapter({
			edge: true,
			external:["canvas"]
		}),
		files: {
			lib: 'src/lib'
		},
		prerender: {
			enabled: true,
			entries: [
				'/',
				'/introduction',
				'/overview',
				'/getting-started',
				'/adapters',
				'/adapters/custom',
				'/adapters/supabase',
				'/configurations',
				'/server-apis',
				'/client-apis',
				'/references',
				'/references/error-handling',
				'/references/types',
				'/references/instances',
				'/changelog',
				'/guides',
				'/guides/email-and-password',
				'/guides/oauth'
			]
		}
	}
};

export default config;
