<script lang="ts" setup>
const user = await useUser();
if (user.value) {
	await navigateTo("/"); // redirect to profile page
}

const errorMessage = ref<string | null>(null);

const handleSubmit = async (e: Event) => {
	if (!(e.target instanceof HTMLFormElement)) return;
	const formData = new FormData(e.target);
	try {
		await $fetch("/api/login", {
			method: "POST",
			body: {
				username: formData.get("username"),
				password: formData.get("password")
			},
			redirect: "manual"
		});
		invalidateUserState();
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
	<a href="/login/github">Sign in with Github</a>
</template>
