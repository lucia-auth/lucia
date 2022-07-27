<script context="module" lang="ts">
	import type { Load } from '@sveltejs/kit';

	export const load: Load = async ({ session }) => {
		if (!session.lucia) return {};
		return {
			status: 302,
			redirect: '/profile'
		};
	};
</script>

<script lang="ts">
	import { dev } from '$app/env';

	let error = '';
	let username: string, password: string;

	const signup = async () => {
		error = '';
		const response = await fetch('/api/signup', {
			method: 'POST',
			body: JSON.stringify({
				username,
				password
			})
		});
		if (response.ok) return (window.location.href = '/profile');
		const result = await response.json();
		error = result.error;
	};

	const login = async () => {
		error = '';
		const response = await fetch('/api/login', {
			method: 'POST',
			body: JSON.stringify({
				username,
				password
			})
		});
		if (response.ok) return (window.location.href = '/profile');
		const result = await response.json();
		error = result.error;
	};
</script>

<div>
	<h2>Login to continue</h2>
	<label for="username">username</label><br />
	<input id="username" name="username" bind:value={username} /><br />
	<label for="password">password</label><br />
	<input type="password" id="password" name="password" bind:value={password} /><br />
	<button on:click={login}>Login</button>
	<button on:click={signup}>Create an account</button>
	<p class="error">{error}</p>
</div>
