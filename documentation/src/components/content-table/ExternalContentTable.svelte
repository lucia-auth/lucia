<script lang="ts">
	import type { Section } from "src/lib/content";
	import { isMenuOpen } from "src/lib/stores.js";
	export let sections: Section[] = [];
	export let title: string;
	export let currentPageTitle: string
</script>

<div
	class="border-r xl:border-r-0 dark:border-zinc-900 xl:block shrink-0 pt-20 fixed w-72 h-screen ml-4 sm:ml-8 lg:ml-12 bg-white dark:bg-black-zinc"
	class:hidden={!$isMenuOpen}
>
	<h3 class="text-lg font-medium">
		{title}
	</h3>
	<div class="overflow-auto h-full relative overscroll-contain pr-4 mt-2">
		{#each sections as section}
			<div class="mb-10">
				<p class="font-medium">{section.title}</p>
				<ul class="list-none mt-2 text-gray-500 dark:text-zinc-400">
					{#each section.pages as page}
						{@const isSelected = currentPageTitle === page.title}
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
	</div>
</div>
