<script lang="ts">
	import { enhance } from "$app/forms";

    import type { ActionData } from './$types';

    export let form: ActionData;
</script>

<h1>Sign in</h1>
<form method="post" use:enhance>
	<label for="username">Username</label>
	<input name="username" id="username" /><br>
	<label for="password">Password</label>
	<input type="password" name="password" id="password" /><br>
	<input type="submit" />
</form>
{#if form?.message}
<p class="error">{form.message}</p>
{/if}
<a href="/signup">Create an account</a>