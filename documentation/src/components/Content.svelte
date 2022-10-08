<script lang="ts">
    export let tab: "learn" | "reference" = "learn";

    const selectTab = (t: typeof tab) => {
        tab = t;
    };

    export let learnContent: Content = [];
    export let referenceContent: Content = [];
</script>

<div class="w-full px-4">
    <div class="grid grid-cols-2 gap-x-1">
        <div class="w-full pb-1 border-b-2" class:border-main={tab === "learn"}>
            <a
                href="/learn"
                class="w-full mx-auto block text-center hover:bg-gray-100 rounded py-1"
                on:click|preventDefault={() => selectTab("learn")}>Learn</a
            >
        </div>
        <div
            class="w-full pb-1 border-b-2"
            class:border-main={tab === "reference"}
        >
            <a
                href="/learn"
                class="w-full mx-auto block text-center hover:bg-gray-100 rounded py-1"
                on:click|preventDefault={() => selectTab("reference")}
                >Reference</a
            >
        </div>
    </div>
    <div class="pt-4">
        {#if tab === "learn"}
        {#each learnContent as section}
            <div class="mb-6">
                <p class="font-medium">{section.title}</p>
                <li class=" list-none pl-4">
                    {#each section.pages as page}
                        <ul class="my-1">
                            <a href={page.url}>{page.title}</a>
                        </ul>
                    {/each}
                </li>
            </div>
        {/each}
        {/if}
    </div>
</div>
