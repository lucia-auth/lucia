<script lang="ts" setup>
definePageMeta({ middleware: "auth" });
const { user } = useAuth(); // Grab the user from your composable ...
</script>

<template>
	<h2>Secret page</h2>
	<p>
		This page is protected by a nuxt middleware and can only be accessed by
		authenticated users.
	</p>
	<pre class="code">{{ JSON.stringify(user, null, 2) }}</pre>
	<NuxtLink to="/" class="button">Home</NuxtLink>
</template>
