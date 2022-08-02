<script context="module" lang="ts">
	import type { Load } from '@sveltejs/kit';

	export const load: Load = async ({ fetch }) => {
		const response = await fetch('/api/docs');
		const result = await response.json();
		return {
			props: {
				docs: result
			}
		};
	};
</script>

<script lang="ts">
	import '../app.css';
	import 'highlight.js/styles/base16/onedark.css';
	import Github from '$components/icons/Github.svelte';
	import Menu from '$components/icons/Menu.svelte';
	import Contents from '$components/docs/Contents.svelte';
	import { afterNavigate } from '$app/navigation';

	export let docs: string[];

	let toggleMenu = 0;

	afterNavigate(() => {
		toggleMenu = 0;
	});
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="fixed z-50  w-screen divide-y border-b bg-white">
	<div class="flex place-items-center justify-between px-4 py-2 sm:px-8 lg:px-12">
		<a class="text-2xl font-semibold" href="/">Lucia</a>
		<div class="">
			<a href="https://github.com/pilcrowOnPaper/lucia-sveltekit" target="_blank" class="cursor-pointer"> <Github /></a>
		</div>
	</div>
	<div class="px-4 pt-1 sm:px-8 md:hidden lg:px-12">
		<button
			class="hover:pointer appearance-none leading-none"
			on:click={() => {
				toggleMenu += 1;
			}}
		>
			<Menu />
		</button>
	</div>
</div>
<div>
	<div
		class="fixed z-40 h-screen shrink-0 border-r bg-white pr-4 pl-4 pt-28 pb-12 sm:pl-8 md:pt-16 md:shadow-none lg:pl-12 overflow-y-auto"
		class:hidden={toggleMenu % 2 === 0}
		class:md:block={toggleMenu % 2 === 0}
		class:block={toggleMenu % 2 === 1}
		class:shadow-xl={toggleMenu % 2 === 1}
	>
		<div class="w-56">
			<Contents {docs} />
		</div>
	</div>
	<div
		class="fixed top-0 z-20 h-screen w-screen bg-black opacity-10 md:hidden"
		class:block={toggleMenu % 2 === 1}
		class:hidden={toggleMenu % 2 === 0}
		on:click={() => {
			toggleMenu = 0;
		}}
	/>
	<div class="md:pl-72">
		<div class="min-h-screen grow px-4 pt-28 pb-16 sm:px-8 md:pt-16 lg:px-12">
			<slot />
		</div>
	</div>
</div>

<style>
	div {
		font-family: 'IBM Plex Sans', sans-serif;
	}
</style>
