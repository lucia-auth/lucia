<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	export let form: ActionData;
</script>

<h1>Create an account</h1>
<form method="post" use:enhance>
	<label for="email">Email</label><br />
	<input id="email" name="email" value={form?.email ?? ""} /><br />
	<label for="password">Password</label>
	<p>Password should be at least 8 characters long</p>
	<input id="password" name="password" type="password" /><br />

	<input type="submit" value="Continue" />
</form>
{#if form?.message}
	<p class="error">{form.message}</p>
{/if}
<a href="/login">Sign in</a>
