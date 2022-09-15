<script lang="ts">
	export let errors: { username: string; message: string };
	let username: string, password: string;

	const signup = async (e: SubmitEvent) => {
		const form = e.target as HTMLFormElement;
		form.submit();
	};
</script>

<div>
	<h2>Create an account</h2>
	<form on:submit|preventDefault={signup} action="/signup" method="post">
		<label for="username">username</label><br />
		<input id="username" name="username" bind:value={username} /><br />
		<p class="error">{errors?.username || ''}</p>
		<label for="password">password</label><br />
		<input type="password" id="password" name="password" bind:value={password} /><br />
		<input type="submit" value="Continue" class="button" />
	</form>
	<p class="error">{errors?.message || ''}</p>
	<a href="/login" class="link">Sign in</a>
</div>
