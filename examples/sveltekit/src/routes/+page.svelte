<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<p>This page is protected and can only be accessed by authenticated users.</p>
<pre class="code">
{JSON.stringify(data.user, null, 2)}
</pre>

<form use:enhance method="post">
	<input type="submit" class="button" value="Sign out" />
</form>
