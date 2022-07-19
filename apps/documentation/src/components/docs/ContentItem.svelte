<script lang="ts">
	import type { Item } from '$lib/types.js';
	import ContentItem from '$components/docs/ContentItem.svelte';
	import { page } from '$app/stores';
	import { formatText } from '$lib/format.js';

	export let item: Item;
</script>

<li class="py-1">
	<a
		href={item.pathname}
		sveltekit:prefetch
		class="hover:underline"
		class:text-indigo-600={$page.url.pathname === item.pathname}
		class:font-medium={$page.url.pathname === item.pathname}>{formatText(item.name)}</a
	>
	<ul class="ml-4">
		{#if item.items.length > 0}
			{#each item.items as childItem}
				<ContentItem item={childItem} />
			{/each}
		{/if}
	</ul>
</li>
