<script lang="ts">
	import '../app.css';
	import { page } from "$app/stores"

	import { handleSilentRefresh } from 'lucia-sveltekit/client';
	handleSilentRefresh()
</script>

<svelte:head>
	<title>Lucia demo</title>
</svelte:head>
<slot />

<style lang="postcss">
	/* I've used @apply to apply tailwind classes for demo purposes to remove/hide as much non-lucia related things
	Inline classes should be used for Tailwind */
	:global(body) {
		@apply px-4 pt-8 flex flex-col w-full place-items-center;
	}
	:global(h1) {
		@apply text-3xl font-semibold w-full;
	}
	:global(h2) {
		@apply text-2xl font-semibold w-full;
	}
	:global(input:not(.checkbox)) {
		@apply border appearance-none outline-none my-1 rounded p-1 w-full;
	}
	:global(.github),
	:global(.button),
	:global(button) {
		@apply bg-black text-white my-1 rounded py-1 cursor-pointer w-full text-center hover:opacity-80;
	}
	:global(.link) {
		@apply text-blue-500 text-sm hover:underline;
	}
	:global(label) {
		@apply text-sm;
	}
	:global(.github) {
		@apply py-1;
	}
	:global(div:not(.ignore)) {
		@apply py-4 max-w-sm w-full flex flex-col place-items-center;
	}
	:global(form) {
		@apply w-full;
	}
	:global(.error) {
		@apply text-red-400 text-sm w-full;
	}
	:global(p) {
		@apply w-full;
	}
</style>
