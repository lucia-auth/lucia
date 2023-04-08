<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	export let form: ActionData;
</script>

<h1>Reset password</h1>
<form method="post" use:enhance>
	<label for="new-password">New password</label>
	<p>Password must be at least 8 characters long</p>
	<input id="new-password" name="new-password" />
	<input type="submit" value="Reset password" />
</form>
{#if form?.message}
	<p class="error">{form.message}</p>
{/if}
