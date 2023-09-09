<script lang="ts" setup>
const user = await useUser();
if (user.value) {
	await navigateTo("/"); // redirect to profile page
}
</script>

<template>
	<h1>Sign in</h1>
	<a href="/api/login/github">Sign in with GitHub</a>
</template>
