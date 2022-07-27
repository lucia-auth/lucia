<script lang="ts">
	import '../app.css';

	import { autoRefreshTokens } from 'lucia-sveltekit/client';
	import { session } from '$app/stores';
	import { onDestroy } from 'svelte';

	const unsubscribe = autoRefreshTokens(session, (e) => {
		console.log(e);
	});

	onDestroy(() => {
		unsubscribe();
	});
</script>

<slot />

<style lang="postcss">
	/* I've used @apply to apply tailwind classes for demo purposes to remove/hide as much non-lucia related things
	Inline classes should be used for Tailwind */
	:global(body) {
		@apply px-4 pt-8;
	}
	:global(h2) {
		@apply text-3xl font-semibold;
	}
	:global(input) {
		@apply border appearance-none outline-none my-1 rounded p-1;
	}
	:global(button, .github) {
		@apply bg-black text-white px-8 my-1 rounded py-1;
	}
	:global(label) {
		@apply text-sm;
	}
	:global(.github) {
		@apply w-fit;
	}
	:global(.box) {
		@apply py-4;
	}
	:global(.error) {
		@apply text-red-400 text-sm;
	}
</style>
