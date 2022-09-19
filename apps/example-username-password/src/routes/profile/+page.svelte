<script lang="ts">
	import { enhance } from '$app/forms';
	import { signOut, getSession } from 'lucia-sveltekit/client';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	const session = getSession();

	export let form: { error?: string; success?: string } | null;

	let number = 'fetching...';

	const fetchNumber = async () => {
		const response = await fetch('/api/random-number', {
			headers: {
				Authorization: `Bearer ${$session?.access_token}`
			}
		});
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

	let addAccessTokenToFrom = true;
</script>

<h1>Profile</h1>
<p>This page is protected and can only be accessed by authenticated users.</p>
<div>
	<p>User id: {$session?.user.user_id}</p>
	<p>Username: {$session?.user.username}</p>
	<p>Random number API: {number}</p>
</div>

<div>
	<h2>Notes</h2>
	<div class="ignore w-full">
		<label for="add_auth">Include access token</label>
		<input type="checkbox" id="add_auth" class="checkbox" bind:checked={addAccessTokenToFrom} />
	</div>
	<form method="post" use:enhance>
		{#if addAccessTokenToFrom}
			<input value={$session?.access_token} name="_lucia" hidden />
		{/if}
		<input value={$page.data.notes} name="notes" />
		<input type="submit" value="Save" class="button" />
		{#if form?.error}
			<p class="error">{form?.error}</p>
		{/if}
	</form>
</div>

<button on:click={() => signOut('/')}>Sign out</button>
