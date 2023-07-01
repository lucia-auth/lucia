<script lang="ts" setup>
const { data, error } = await useFetch("/api/user");
if (error.value) throw createError("Failed to fetch data");
const user = data.value?.user ?? null;
if (!user) {
	await navigateTo("/login");
}

const handleSubmit = async (e: Event) => {
	if (!(e.target instanceof HTMLFormElement)) return;
	await $fetch("/api/logout", {
		method: "POST",
		redirect: "manual"
	});
	await navigateTo("/login");
};
</script>

<template>
	<h1>Profile</h1>
	<p>User id: {{ user?.userId }}</p>
	<p>Username: {{ user?.username }}</p>
	<form method="post" action="/api/logout" @submit.prevent="handleSubmit">
		<input type="submit" value="Sign out" />
	</form>
</template>
