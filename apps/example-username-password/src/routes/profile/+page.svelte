<script lang="ts">
	import { signOut, getSession } from 'lucia-sveltekit/client';

	const signOutUser = async () => {
		await signOut();
		window.location.href = '/';
	};

	let number = 0;

	const lucia = getSession()

	const fetchNumber = async () => {
		const response = await fetch('/api/random-number', {
			headers: {
				Authorization: `Bearer ${$lucia?.access_token}`
			}
		});
		const result = await response.json();
		if (result.error) {
			console.error(result.error)
			return
		}
		number = result.number;
	};
</script>

<h2>Profile</h2>
<p>This page is protected and can only be accessed by authenticated users.</p>
<div>
	<p>user id: {$lucia?.user.user_id}</p>
	<p>username: {$lucia?.user.username}</p>
</div>

<div>
	<form on:submit|preventDefault={fetchNumber} action="/api/random-number" method="get">
		<input type="submit" value="Get random number" class="button" />
	</form>
	<p>result: {number}</p>
</div>

<button on:click={signOutUser}>Sign out</button>
