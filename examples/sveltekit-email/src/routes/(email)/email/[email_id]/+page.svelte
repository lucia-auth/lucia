<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div class="flex place-content-between text-sm">
	<p class="">To: {data.email.toAddress}</p>
	<p class="text-zinc-400">{data.email.dateSent.toLocaleString()}</p>
</div>
<h1 class="border-b py-2 text-lg font-semibold">
	{data.email.subject}
</h1>
<p class="mt-4 break-words" id="email-content">
	{@html data.email.content}
</p>
<form use:enhance method="post" class="mt-6">
	<input
		type="submit"
		value="Delete email"
		class="cursor-pointer text-sm text-red-400 hover:underline"
	/>
</form>
<style lang="postcss">
	:global(#email-content a) {
		@apply text-indigo-500 hover:underline;
	}
</style>