<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<h2>Your profile</h2>
<pre class="code">{JSON.stringify(data.session, null, 2)}</pre>
<form method="post" use:enhance>
	<input type="submit" class="button" value="Sign out" />
</form>
