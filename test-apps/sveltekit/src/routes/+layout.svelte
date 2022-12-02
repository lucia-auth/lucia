<script lang="ts">
	import { page } from '$app/stores';
	import { handleSession } from '@lucia-auth/sveltekit/client';
	import '../app.css';

	handleSession(page, (hasSession) => {
		console.log(hasSession);
	});
</script>

<svelte:head>
	<title>Lucia demo</title>
</svelte:head>
<div>
	<h1><a href="/">Lucia + SvelteKit demo</a></h1>
	<slot />
</div>

<style lang="postcss">
	:global(body) {
		@apply px-4 pt-8 flex flex-col w-full place-items-center;
	}
	:global(h1) {
		@apply text-3xl font-semibold w-full mb-4;
	}
	:global(h2) {
		@apply text-2xl font-semibold w-full mb-2;
	}
	:global(input:not(.checkbox)) {
		@apply border appearance-none outline-none my-1 rounded p-1 w-full;
	}
	:global(.github),
	:global(.button),
	:global(button) {
		@apply bg-black text-white my-2 rounded py-1 cursor-pointer w-full text-center hover:opacity-80;
	}
	:global(.link) {
		@apply text-blue-500 hover:underline mb-1;
	}
	:global(label) {
		@apply text-sm;
	}
	:global(.github) {
		@apply py-1;
	}
	:global(div:not(.ignore):not(.code)) {
		@apply py-4 max-w-md w-full flex flex-col place-items-center;
	}
	:global(form) {
		@apply w-full my-2;
	}
	:global(.error) {
		@apply text-red-400 text-sm w-full;
	}
	:global(p) {
		@apply w-full my-1;
	}
	:global(pre, .code) {
		@apply w-full bg-zinc-900 text-gray-200 rounded-md py-2 px-4 my-2 overflow-auto;
	}
</style>
