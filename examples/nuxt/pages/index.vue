<script lang="ts" setup>
const { data, error } = await useFetch("/api/user");
if (error.value) throw createError(error.value.message);
if (!data.value?.user) navigateTo("/login");

const handleSubmit = async (e: Event) => {
	if (!(e.target instanceof HTMLFormElement)) return;
	try {
		await $fetch("/api/logout", { method: "POST" });
		navigateTo("/login");
	} catch (error) {
		console.error(error);
	}
};
</script>
<template>
	<p>This page is protected and can only be accessed by authenticated users.</p>
	<pre class="code">{{ JSON.stringify(data?.user, null, 2) }}</pre>
	<form @submit.prevent="handleSubmit">
		<input type="submit" class="button" value="Sign out" />
	</form>
	<NuxtLink to="/middleware" class="button">Middleware</NuxtLink>
</template>
