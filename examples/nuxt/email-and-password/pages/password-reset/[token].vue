<script lang="ts" setup>
const errorMessage = ref<string | null>(null);

const route = useRoute();
const apiRoute = `/api/password-reset/${route.params.token}`;

const handleSubmit = async (e: Event) => {
	if (!(e.target instanceof HTMLFormElement)) return;
	errorMessage.value = null;
	const formData = new FormData(e.target);
	try {
		await $fetch(apiRoute, {
			method: "POST",
			body: {
				password: formData.get("password")
			},
			redirect: "manual"
		});
		await navigateTo("/");
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
	<form method="post" :action="apiRoute" @submit.prevent="handleSubmit">
		<label htmlFor="password">New Password</label>
		<input name="password" id="password" />
		<br />
		<input type="submit" />
	</form>
	<p class="error" v-if="errorMessage">{{ errorMessage }}</p>
</template>
