<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	export let form: ActionData;
</script>

<h2>Reset password</h2>
<form method="post" use:enhance>
	<label for="new-password">New password</label>
	<input id="new-password" name="new-password" type="password" />
	<input type="submit" value="Reset password" class="button" />
</form>
{#if form?.message}
	<p class="error">{form.message}</p>
{/if}
