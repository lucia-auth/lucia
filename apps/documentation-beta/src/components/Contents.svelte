<script lang="ts">
    export let tab: string = "learn";

    const selectTab = (t: "learn" | "reference") => {
        tab = t;
    };
</script>

<div class="w-full h-screen pt-20 px-4">
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
</div>
