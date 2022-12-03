<script lang="ts">
	import { enhance } from '$app/forms';

	export let form: { message?: string };
</script>

<h2>Create an account with username and password</h2>
<form
	method="post"
	use:enhance={({ data, cancel }) => {
		form = {};
		const username = data.get('username')?.toString() || '';
		const password = data.get('password')?.toString() || '';
		if (!username || !password) {
			form.message = 'Invalid input';
			cancel();
		}
	}}
>
	<label for="username">username</label><br />
	<input id="username" name="username" /><br />
	<label for="password">password</label><br />
	<input type="password" id="password" name="password" /><br />
	<input type="submit" value="Continue" class="button" />
</form>
{#if form?.message}
	<p class="error">{form.message || ''}</p>
{/if}
<a href="/login" class="link">Sign in</a>
