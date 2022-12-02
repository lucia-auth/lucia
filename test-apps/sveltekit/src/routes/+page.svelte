<script lang="ts">
	import { signOut, getUser } from '@lucia-auth/sveltekit/client';
	import { invalidateAll } from '$app/navigation';
	const user = getUser();
</script>

{#if $user}
	<p>This page is protected and can only be accessed by authenticated users.</p>
	<pre class="code">
{JSON.stringify($user, null, 2)}
</pre>

	<button
		on:click={async () => {
			await signOut();
			invalidateAll();
		}}>Sign out</button
	>
{:else}
	<h2>Sign in</h2>
	<a href="/login" class="button">Username and password</a>
	<a href="/api/oauth?provider=github" class="button">Github</a>
{/if}
