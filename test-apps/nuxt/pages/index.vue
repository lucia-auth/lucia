<script lang="ts" setup>
const { data } = await useFetch("/api/user");
if (!data.value) throw createError("Failed to fetch data");
const user = data.value.user;
if (!user) await navigateTo("/login");

const handleSubmit = async (e: Event) => {
	if (!(e.target instanceof HTMLFormElement)) return;
	try {
		const data = await $fetch("/api/logout", {
			method: "POST"
		});
		if (data) {
			return;
		}
		navigateTo("/login");
	} catch (error) {}
};
</script>
<template>
	<p>This page is protected and can only be accessed by authenticated users.</p>
	<pre class="code">{{ JSON.stringify(user, null, 2) }}</pre>

	<form @submit.prevent="handleSubmit">
		<input type="submit" class="button" value="Sign out" />
	</form>
</template>
