<script lang="ts">
	import { isMenuOpen } from "src/lib/stores";
</script>

<button
	on:click={() => {
		isMenuOpen.toggle();
	}}
	class="xl:hidden"
>
	<div class="h-8 w-8 dark:text-zinc-200 fill-current">
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" class="w-full h-full"
			><path d="M6 36v-3h36v3Zm0-10.5v-3h36v3ZM6 15v-3h36v3Z" />
		</svg>
	</div>
</button>
