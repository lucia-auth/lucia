<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	export let form: ActionData;
</script>

<h2>Create an account</h2>
<form method="post" use:enhance>
	<label for="email">Email</label><br />
	<input id="email" name="email" value={form?.email ?? ""} /><br />
	<label for="password">Password</label>
	<input id="password" name="password" type="password" /><br />

	<input type="submit" value="Continue" class="button" />
</form>
{#if form?.message}
	<p class="error">{form.message}</p>
{/if}
<a href="/login">Sign in</a>
