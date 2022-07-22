<script context="module" lang="ts">
	import type { Load } from '@sveltejs/kit';

	export const load: Load = async ({ fetch, params }) => {
		const response = await fetch(`/api/docs/${params.doc}`);
		const result = await response.json();
		return {
			props: {
				doc: result
			}
		};
	};
</script>

<script lang="ts">
	export let doc: {
		title: string;
		html: string;
	};
</script>

<svelte:head>
	<title>{doc.title} | Lucia</title>
</svelte:head>

<div class="pt-12 pb-8">
	<h1 class="text-5xl font-semibold">{doc.title}</h1>
</div>
<div class="markdown">
	{@html doc.html}
</div>

<style lang="postcss">
	:global(.markdown h2) {
		@apply mt-16 mb-4 text-3xl font-semibold;
	}
	:global(.markdown h3) {
		@apply mt-10 text-2xl font-semibold;
	}
	:global(.markdown h4) {
		@apply mt-4 text-lg font-semibold;
	}
	:global(.markdown h2 + h3) {
		@apply mt-4;
	}
	:global(.markdown > *) {
		@apply my-3;
	}
	:global(.markdown > *:first-child) {
		@apply mt-0;
	}
	:global(.markdown pre) {
		@apply overflow-auto rounded-md px-4 py-2 text-sm;
		color: #ebeff5;
		background-color: #0e121c;
	}
	:global(.markdown a > code) {
		@apply overflow-auto rounded text-indigo-600 bg-indigo-200 py-0.5 px-1 text-sm;
	}
	:global(.markdown code:not(pre * , a > code)) {
		@apply overflow-auto rounded bg-gray-900 py-0.5 px-1 text-sm;
		color: #ced5e0;
	}
	:global(.markdown ul:not(li > ul)) {
		@apply list-disc;
	}
	:global(.markdown ol) {
		@apply list-decimal;
	}
	:global(.markdown li) {
		@apply my-1 list-inside;
	}
	:global(.markdown li > ul) {
		@apply ml-2 list-disc;
	}
	:global(.markdown a) {
		@apply text-indigo-600 hover:underline;
	}
	:global(.markdown .table-top) {
		@apply overflow-auto rounded-t-md pt-1.5 bg-gray-100 w-full;
	}
	:global(.markdown .table-bottom) {
		@apply overflow-auto rounded-b-md h-2 bg-gray-50 w-full;
	}
	:global(.markdown .table) {
		@apply w-full overflow-hidden flex flex-col;
	}
	:global(.markdown table) {
		@apply w-full table-auto border-collapse appearance-none;
	}
	:global(.markdown th) {
		@apply appearance-none border-b bg-gray-100 py-1 px-2 text-left font-medium;
	}
	:global(.markdown td) {
		@apply border-t px-2 py-1;
	}
	:global(.markdown tr) {
		@apply appearance-none bg-gray-50;
	}
	:global(.markdown blockquote) {
		@apply bg-indigo-100 px-2 py-1 rounded-md text-sm;
	}
	:global(.markdown .breaking) {
		@apply text-red-500 font-medium;
	}
</style>
