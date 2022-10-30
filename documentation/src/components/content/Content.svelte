<script lang="ts">
	import { isMenuOpen } from "src/lib/stores.js";

	export let tab: typeof tabs[number]["tab"] = "learn";

	const selectTab = (t: typeof tab) => {
		tab = t;
	};

	export let learnContent: Content = [];
	export let referenceContent: Content = [];
	export let currentTitle: string | null = null;

	const tabs = [
		{
			tab: "learn",
			content: learnContent
		},
		{
			tab: "reference",
			content: referenceContent
		}
	] as const;
</script>

<div
	class=" border-r lg:border-r-0 dark:border-zinc-900 lg:block shrink-0 pt-20 fixed w-72 h-screen ml-4 sm:ml-8 lg:ml-12 bg-white dark:bg-black-zinc"
	class:hidden={!$isMenuOpen}
>
	<div class="overflow-auto h-full relative overscroll-contain pr-4">
		<div class="grid grid-cols-2 gap-x-1 sticky top-0 w-full bg-white dark:bg-black-zinc">
			<div class="w-full pb-1 border-b-2" class:border-main={tab === "learn"}>
				<button
					class="w-full mx-auto block text-center hover:bg-gray-100 dark:hover:bg-zinc-900  rounded py-1"
					on:click|preventDefault={() => selectTab("learn")}>Learn</button
				>
			</div>
			<div class="w-full pb-1 border-b-2" class:border-main={tab === "reference"}>
				<button
					class="w-full mx-auto block text-center hover:bg-gray-100 dark:hover:bg-zinc-900 rounded py-1"
					on:click={() => selectTab("reference")}>Reference</button
				>
			</div>
		</div>
		<div class="pt-4">
			{#each tabs as { tab: tabName, content }}
				{#if tabName === tab}
					{#each content as section}
						<div class="mb-10">
							<p class="font-medium">{section.title}</p>
							<ul class="list-none mt-2 text-gray-500 dark:text-zinc-400">
								{#each section.pages as page}
									{@const isSelected = currentTitle === page.title}
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
										<a href={page.url}>{page.title}</a>
									</li>
								{/each}
							</ul>
						</div>
					{/each}
				{/if}
			{/each}
		</div>
	</div>
</div>
