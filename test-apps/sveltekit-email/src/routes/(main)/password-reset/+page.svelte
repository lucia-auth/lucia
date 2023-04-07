<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	export let form: ActionData;
</script>

<h1>Reset password</h1>
<form method="post" use:enhance>
	<label for="email">Email</label>
	<input id="email" name="email" value={form?.email ?? ""} />
	<input type="submit" value="Send email" />
</form>
{#if form?.message}
	<p class="error">{form.message}</p>
{/if}
{#if form?.success}
	<p class="message">A verification email was sent to your inbox</p>
{/if}
