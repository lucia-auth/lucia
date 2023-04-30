<script lang="ts">
	import { enhance } from '$app/forms';

	export let form: { message?: string };
</script>

<h2>Create an account</h2>
<a href="/api/oauth?provider=github" class="button">Continue with Github</a>
<p class="center">or</p>
<form
	method="post"
	use:enhance
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
