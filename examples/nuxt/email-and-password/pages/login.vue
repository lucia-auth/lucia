<script lang="ts" setup>
const user = useUser();
if (user.value) {
	if (user.value.emailVerified) {
		await navigateTo("/email-verification");
	} else {
		await navigateTo("/"); // redirect to profile page
	}
}

const errorMessage = ref<string | null>(null);

const handleSubmit = async (e: Event) => {
	if (!(e.target instanceof HTMLFormElement)) return;
	errorMessage.value = null;
	const formData = new FormData(e.target);
	try {
		await $fetch("/api/login", {
			method: "POST",
			body: {
				email: formData.get("email"),
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
	<h1>Sign in</h1>
	<form method="post" action="/api/login" @submit.prevent="handleSubmit">
		<label for="email">Email</label>
		<input name="email" id="email" /><br />
		<label for="password">Password</label>
		<input type="password" name="password" id="password" /><br />
		<input type="submit" />
	</form>
	<p class="error">{{ errorMessage }}</p>
	<NuxtLink to="/password-reset">Reset password</NuxtLink>
	<NuxtLink to="/signup">Create an account</NuxtLink>
</template>
