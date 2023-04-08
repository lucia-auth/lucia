<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<h1>Welcome, user</h1>
<p>Your email is {data.user.email}</p>
<form method="post" use:enhance>
	<input type="submit" value="Sign out" />
</form>
