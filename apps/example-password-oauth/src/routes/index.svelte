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
	import { sendForm } from '$lib/api.js';
	import { dev } from '$app/env';

	let loginError = '';
	let signupError = '';

	const signup = async (event: SubmitEvent) => {
		signupError = '';
		const formElement = event.target as HTMLFormElement;
		const response = await sendForm(formElement);
		if (response.ok) return (window.location.href = '/profile');
		const result = await response.json();
		signupError = result.error;
	};

	const login = async (event: SubmitEvent) => {
		loginError = '';
		const formElement = event.target as HTMLFormElement;
		const response = await sendForm(formElement);
		if (response.ok) return (window.location.href = '/profile');
		const result = await response.json();
		loginError = result.error;
	};

	const githubClientId = dev ? 'f7176f2deee94f36e472' : '54c0606ce6ef78637a38';
	const githubLink = `https://github.com/login/oauth/authorize?client_id=${githubClientId}&scope=user:email`;
</script>

<div>
	<h2>Create an account</h2>
	<form on:submit|preventDefault={signup} action="/api/signup" method="post">
		<label for="email">email</label><br />
		<input type="email" id="email" name="email" /><br />
		<label for="password">password</label><br />
		<input type="password" id="password" name="password" /><br />
		<button type="submit">Login</button>
		<p class="error">{signupError}</p>
	</form>
</div>

<div>
	<h2>Sign in</h2>
	<form on:submit|preventDefault={login} action="/api/login" method="post">
		<label for="email">email</label><br />
		<input type="email" id="email" name="email" /><br />
		<label for="password">password</label><br />
		<input type="password" id="password" name="password" /><br />
		<button type="submit">Login</button>
		<p class="error">{loginError}</p>
	</form>
</div>

<div>
	<h2>Github login</h2>
	<a href={githubLink} class="github">Login with Github</a>
</div>
