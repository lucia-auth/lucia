export default defineNuxtRouteMiddleware(async () => {
	const user = await useUser();
	if (!user.value) return navigateTo("/login");
});
