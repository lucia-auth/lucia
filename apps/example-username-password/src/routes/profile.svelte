<script context="module" lang="ts">
	import type { Load } from '@sveltejs/kit';

	export const load: Load = async ({ session }) => {
		if (session.lucia) return {};
		return {
			status: 302,
			redirect: '/'
		};
	};
</script>

<script lang="ts">
	import { signOut } from 'lucia-sveltekit/client';
	import { session } from '$app/stores';

	const signOutUser = async () => {
		await signOut();
		window.location.href = '/';
	};

	let number = 0;

	const fetchNumber = async () => {
		const response = await fetch('/api/data', {
			headers: {
				Authorization: `Bearer ${$session.lucia?.access_token}`
			}
		});
		const result = await response.json();
		number = result.number;
	};
</script>

<div>
	<p>user id: {$session.lucia?.user.user_id}</p>
	<p>username: {$session.lucia?.user.username}</p>
</div>

<div>
	<button on:click={fetchNumber}>Get random number</button>
	<p>result: {number}</p>
</div>

<button on:click={signOutUser}>Sign out</button>
