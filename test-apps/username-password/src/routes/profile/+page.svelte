<script lang="ts">
	import { enhance } from '$app/forms';
	import { signOut, getSession } from 'lucia-sveltekit/client';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	const session = getSession();

	export let form: { error?: string; success?: string } | null;

	let number = 'fetching...';

	const fetchNumber = async () => {
		const response = await fetch('/api/random-number');
		const result = await response.json();
		if (result.error) {
			console.error(result.error);
			return;
		}
		await new Promise((resolve) => {
			setTimeout(resolve, 1000);
		});
		number = result.number;
	};

	onMount(fetchNumber);
</script>

<h1>Profile</h1>
<p>This page is protected and can only be accessed by authenticated users.</p>
<div>
	<p>User id: {$session?.user.userId}</p>
	<p>Username: {$session?.user.username}</p>
	<p>Random number API: {number}</p>
</div>

<div>
	<h2>Notes</h2>
	<form method="post" use:enhance>
		<input value={$page.data.notes} name="notes" />
		<input type="submit" value="Save" class="button" />
		{#if form?.error}
			<p class="error">{form?.error}</p>
		{/if}
	</form>
</div>

<button on:click={() => signOut('/')}>Sign out</button>
