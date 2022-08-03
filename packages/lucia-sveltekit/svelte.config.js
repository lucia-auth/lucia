import sveltePreprocess from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
export default {
  preprocess: sveltePreprocess(),

  kit: {
    files: {
      lib: 'src'
    },

    package: {
      dir: 'dist',
      exports: (file) => {
        return file === 'index.ts';
      }
    }
  }
};