<script lang="ts">
	import type { Item } from '$lib/types.js';
	import ContentItem from './ContentItem.svelte';

	export let docs: string[];

	let items: Item[] = [];

	const setItem = (paths: string[], parentItems: Item[], doc: string) => {
		const parentFile = paths[0];
		const itemName = parentFile.replaceAll('-', ' ');
		let index = parentItems.findIndex((item) => item.name === itemName);
		if (index === -1) {
			const item = {
				name: itemName,
				pathname: doc,
				items: []
			};
			parentItems.push(item);
			index = parentItems.length - 1;
		}
		if (paths.length > 1) {
			setItem([...paths.slice(1)], parentItems[index].items, doc);
		}
	};

	docs.forEach((doc) => {
		const paths = doc.replace('/', '').split('/');
		setItem(paths, items, doc);
	});
</script>

<ul>
	{#each items as item}
		<ContentItem {item} />
	{/each}
</ul>
