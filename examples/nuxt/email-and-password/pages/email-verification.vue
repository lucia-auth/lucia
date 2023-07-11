<script lang="ts" setup>
definePageMeta({
	middleware: ["protected"]
});

const user = useAuthenticatedUser();

if (user.value.emailVerified) {
	await navigateTo("/");
}

const successMessage = ref<null | string>(null);

const handleResend = async (e: Event) => {
	if (!(e.target instanceof HTMLFormElement)) return;
	successMessage.value = null;
	await $fetch("/api/email-verification", {
		method: "POST",
		redirect: "manual"
	});
	successMessage.value = "Your verification link was resent";
};
</script>

<template>
	<h1>Email verification</h1>
	<p>Your email verification link was sent to your inbox (i.e. console).</p>
	<h2>Resend verification link</h2>
	<form
		method="post"
		action="/api/email-verification"
		@submit.prevent="handleResend"
	>
		<input type="submit" value="Resend" />
	</form>
	<p v-if="successMessage">{successMessage}</p>
</template>
