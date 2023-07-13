<script lang="ts" setup>
const errorMessage = ref<string | null>(null);
const successMessage = ref<string | null>(null);

const handleSubmit = async (e: Event) => {
	if (!(e.target instanceof HTMLFormElement)) return;
	errorMessage.value = null;
	successMessage.value = null;
	const formData = new FormData(e.target);
	try {
		await $fetch("/api/password-reset", {
			method: "POST",
			body: {
				email: formData.get("email")
			},
			redirect: "manual"
		});
		successMessage.value = "Your password reset link was sent to your inbox";
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
	<h1>Reset password</h1>
	<form
		method="post"
		action="/api/password-reset"
		@submit.prevent="handleSubmit"
	>
		<label for="email">Email</label>
		<input name="email" id="email" /><br />
		<input type="submit" />
	</form>
	<p class="error" v-if="errorMessage">{{ errorMessage }}</p>
	<p v-if="successMessage">{{ successMessage }}</p>
	<NuxtLink to="/login">Sign in</NuxtLink>
</template>
