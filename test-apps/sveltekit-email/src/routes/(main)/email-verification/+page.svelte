<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData;
</script>

<h1>Email verification</h1>
<p>Please check your inbox ({data.user.email}) for a verification email</p>
<h2>Resend verification email</h2>
<form method="post" use:enhance>
	<input type="submit" value="Resend email" />
</form>

{#if form?.message}
	<p class="error">{form.message}</p>
{/if}
