<script lang="ts">
	import { applyAction, enhance } from '$app/forms';

	export let form: { message?: string };
</script>

<div>
	<h1>Create an account</h1>
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
			return async ({ result }) => {
				if (result.type === 'redirect') {
					window.location.href = result.location; // invalidateAll() + goto() will not work
				}
				if (result.type === 'invalid') {
					applyAction(result);
				}
			};
		}}
	>
		<label for="username">username</label><br />
		<input id="username" name="username" /><br />
		<label for="password">password</label><br />
		<input type="password" id="password" name="password" /><br />
		<input type="submit" value="Continue" class="button" />
	</form>
	<p class="error">{form?.message || ''}</p>
	<a href="/login" class="link">Sign in</a>
</div>
