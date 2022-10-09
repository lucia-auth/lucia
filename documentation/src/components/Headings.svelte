<script lang="ts">
    import type { MarkdownHeading } from "astro";

    export let headings: MarkdownHeading[];

    console.log(headings);
</script>

<div
    class="hidden xl:block pt-36 lg:pt-20 fixed right-0 top-0 w-64 h-screen mr-4 sm:mr-8 lg:mr-12"
>
    <div class="overflow-auto h-full relative overscroll-contain pl-4">
        <div class="w-full sticky top-0 bg-white">
            <h3 class="font-medium">On this page</h3>
        </div>
        <div class="pt-4">
            <ul class="list-none">
                <li class="my-1">
                    <!-- svelte-ignore a11y-invalid-attribute -->
                    <a href="#"> Overview </a>
                </li>
                {#each headings as heading}
                    {@const hash = heading.slug.split("/").reverse()[0]}
                    <li
                        class:ml-4={heading.depth === 3}
                        class:ml-6={heading.depth === 4}
                        class="my-1"
                    >
                        <a href="#{hash}"> {heading.text}</a>
                    </li>
                {/each}
            </ul>
        </div>
    </div>
</div>
