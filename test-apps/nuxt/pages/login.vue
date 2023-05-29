<script lang="ts" setup>
const { data, error } = await useFetch("/api/user");
if (error.value) throw createError("Failed to fetch data");
if (data?.value?.user) navigateTo("/");
const errorMessage = ref<string | null>(null);

const handleSubmit = async (e: Event) => {
	errorMessage.value = "";
	if (!(e.target instanceof HTMLFormElement)) return;
	const formData = new FormData(e.target);
	try {
		await $fetch("/api/login", {
			method: "POST",
			body: Object.fromEntries(formData.entries())
		});
		navigateTo("/");
	} catch (error) {
		errorMessage.value = "An unknown error occurred";
	}
};
</script>

<template>
	<h2>Sign in</h2>
	<a href="/api/oauth?provider=github" class="button"> Github </a>
	<p class="center">or</p>
	<form @submit.prevent="handleSubmit">
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
