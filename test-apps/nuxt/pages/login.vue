<script lang="ts" setup>
const { data } = await useFetch("/api/user");
if (!data.value) throw createError("Failed to fetch data");
const user = data.value.user;
if (user) {
	await navigateTo("/");
}

const errorMessage = ref<string | null>(null);

const handleSubmit = async (e: Event) => {
	errorMessage.value = "";
	e.preventDefault();
	if (!(e.target instanceof HTMLFormElement)) return;
	const formData = new FormData(e.target);
	const { data, error } = await useFetch("/api/login", {
		method: "POST",
		body: Object.fromEntries(formData.entries())
	});
	if (error.value) {
		errorMessage.value = "An unknown error occurred";
		return;
	}
	if (data.value) {
		errorMessage.value = data.value.error;
		return;
	}
	navigateTo("/");
};
</script>

<template>
	<h2>Sign in</h2>
	<a href="/api/oauth?provider=github" class="button"> Github </a>
	<p class="center">or</p>
	<form @submit="handleSubmit">
		<label htmlFor="username">username</label>
		<br />
		<input id="username" name="username" />
		<br />
		<label htmlFor="password">password</label>
		<br />
		<input type="password" id="password" name="password" />
		<br />
		<input type="submit" value="Continue" class="button" />
	</form>
	<p class="error">{{ errorMessage }}</p>
	<NuxtLink to="/signup" class="link"> Create a new account </NuxtLink>
</template>
