<script lang="ts">
	import type { Section } from "src/lib/content";
	import { isMenuOpen } from "src/lib/stores.js";

	const selectTab = (id: string) => {
		selectedContent = id;
	};

	export let contents: {
		title: string;
		id: string;
		sections: Section[];
	}[] = [];
	export let selectedContent: string = contents[0].id;
	export let currentPath: string | null = null;
	export let title: string | null = null;
</script>

<div
	class="border-r dark:border-zinc-900 shrink-0 pt-20 fixed z-40 w-full sm:w-72 pr-4 h-screen bg-white dark:bg-black-zinc xl:block"
	class:hidden={!$isMenuOpen}
>
	{#if title}
		<h3 class="text-lg font-medium">
			{title}
		</h3>
	{/if}
	{#if contents.length > 1}
		<div class="grid grid-cols-2 gap-x-2 sticky top-0 w-full bg-white dark:bg-black-zinc">
			{#each contents as content}
				<div class="w-full pb-1 border-b-2" class:border-main={content.id === selectedContent}>
					<button
						class="w-full mx-auto block text-center hover:bg-gray-100 dark:hover:bg-zinc-900  rounded py-1"
						on:click={() => selectTab(content.id)}>{content.title}</button
					>
				</div>
			{/each}
		</div>
	{/if}
	<div class="overflow-auto h-full relative overscroll-contain pb-8 pt-4">
		{#each contents as content}
			{#if content.id === selectedContent}
				{#each content.sections as section}
					<div class="mb-10">
						<p class="font-medium">{section.title}</p>
						<ul class="list-none mt-2 text-gray-500 dark:text-zinc-400">
							{#each section.pages as page}
								{@const isSelected = currentPath === page.path}
								<li
									class="my-1 pl-4 border-l-2"
									class:text-main={isSelected}
									class:border-main={isSelected}
									class:border-zinc-400={!isSelected}
									class:hover:border-black={!isSelected}
									class:dark:hover:border-zinc-200={!isSelected}
									class:hover:text-black={!isSelected}
									class:dark:hover:text-zinc-200={!isSelected}
								>
									<a href={page.path}>{page.title}</a>
								</li>
							{/each}
						</ul>
					</div>
				{/each}
			{/if}
		{/each}
	</div>
</div>
