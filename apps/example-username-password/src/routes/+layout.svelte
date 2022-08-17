<script lang="ts">
	import '../app.css';

	import { Lucia } from 'lucia-sveltekit/client';
</script>
<svelte:head>
	<title>Lucia demo</title>
</svelte:head>
<Lucia on:error={(e) => console.error(e)}>
	<slot/>
</Lucia>

<style lang="postcss">
	/* I've used @apply to apply tailwind classes for demo purposes to remove/hide as much non-lucia related things
	Inline classes should be used for Tailwind */
	:global(body) {
		@apply px-4 pt-8 flex flex-col w-full place-items-center;
	}
	:global(h2) {
		@apply text-3xl font-semibold w-full;
	}
	:global(input) {
		@apply border appearance-none outline-none my-1 rounded p-1 w-full;
	}
	:global(.github), :global(.button), :global(button) {
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
	:global(div) {
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
