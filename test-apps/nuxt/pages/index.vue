<script lang="ts" setup>
const { data, error } = await useFetch<{ user: any }>("/api/user");
const user = computed(() => data?.value?.user);
if (error.value) throw createError(error.value.message);
if (!user.value) navigateTo("/login");

const handleSubmit = async (e: Event) => {
	if (!(e.target instanceof HTMLFormElement)) return;
	try {
		const { error } = await useFetch("/api/logout", {
			method: "POST"
		});
		if (error.value) throw error.value;
		navigateTo("/login");
	} catch (error) {
		console.error(error);
	}
};
</script>
<template>
	<p>This page is protected and can only be accessed by authenticated users.</p>
	<pre class="code">{{ JSON.stringify(user, null, 2) }}</pre>
	<form @submit.prevent="handleSubmit">
		<input type="submit" class="button" value="Sign out" />
	</form>
</template>
