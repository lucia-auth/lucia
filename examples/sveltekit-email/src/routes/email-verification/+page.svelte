<script lang="ts">
	import { enhance } from '$app/forms';

	import type { ActionData } from './$types';
</script>

<h2>Email verification</h2>
<p>Check your console for the verification link!</p>
<form method="post" use:enhance>
	<input type="submit" value="Resend email" class="button" />
</form>
