<script lang="ts" setup>
const user = useUser();
if (user.value) {
	await navigateTo("/"); // redirect to profile page
}

const errorMessage = ref<string | null>(null);

const handleSubmit = async (e: Event) => {
	if (!(e.target instanceof HTMLFormElement)) return;
	const formData = new FormData(e.target);
	try {
		await $fetch("/api/signup", {
			method: "POST",
			body: {
				username: formData.get("username"),
				password: formData.get("password")
			},
			redirect: "manual"
		});
		await navigateTo("/"); // profile page
	} catch (e) {
		const { data: error } = e as {
			data: {
				message: string;
			};
		};
		errorMessage.value = error.message;
	}
};
</script>

<template>
	<h1>Sign up</h1>
	<form method="post" action="/api/signup" @submit.prevent="handleSubmit">
		<label for="username">Username</label>
		<input name="username" id="username" /><br />
		<label for="password">Password</label>
		<input type="password" name="password" id="password" /><br />
		<input type="submit" />
	</form>
	<p class="error">{{ errorMessage }}</p>
	<NuxtLink to="/login">Sign in</NuxtLink>
</template>
