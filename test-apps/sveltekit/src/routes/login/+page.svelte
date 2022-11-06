<script lang="ts">
	import { enhance } from '$app/forms';

	export let form: { message?: string };
</script>

<h2>Sign in</h2>
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
<p class="error">{form?.message || ''}</p>
<a href="/signup" class="link">Create a new account</a>
