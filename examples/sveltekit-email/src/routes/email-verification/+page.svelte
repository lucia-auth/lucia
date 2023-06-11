<script lang="ts">
	import { enhance } from '$app/forms';

	import type { ActionData } from './$types';

	export let form: ActionData;
</script>

<h1>Email verification</h1>
<p>Check your console for the verification link!</p>
<h2>Resend verification email</h2>
<form method="post" use:enhance>
	<input type="submit" value="Resend email" class="button" />
</form>
