<script lang="ts">
	export let errors: { message: string}
	let username: string, password: string;

	const login = async (e:SubmitEvent) => {
        const form = e.target as HTMLFormElement
		form.submit()
	};
</script>

<div>
	<h2>Sign in</h2>
	<form on:submit|preventDefault={login} action="/login" method="post">
		<label for="username">username</label><br />
		<input id="username" name="username" bind:value={username} /><br />
		<label for="password">password</label><br />
		<input type="password" id="password" name="password" bind:value={password} /><br />
        <input type="submit" value="Continue" class="button"/>
	</form>
	<p class="error">{errors?.message || ""}</p>
	<a href="/signup" class="link">Create a new account</a>
</div>
