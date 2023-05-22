<script lang="ts" setup>
const { data } = await useFetch("/api/user");
if (!data.value) throw createError("Failed to fetch data");
const user = data.value.user;
if (!user) throw await navigateTo("/login");

const handleSubmit = async (e: Event) => {
	e.preventDefault();
	if (!(e.target instanceof HTMLFormElement)) return;
	const { data, error } = await useFetch("/api/logout", {
		method: "POST"
	});
	if (!data.value && !error.value) {
		navigateTo("/login");
	}
};
</script>
<template>
	<p>This page is protected and can only be accessed by authenticated users.</p>
	<pre class="code">{{ JSON.stringify(user, null, 2) }}</pre>

	<form @submit="handleSubmit">
		<input type="submit" class="button" value="Sign out" />
	</form>
</template>
