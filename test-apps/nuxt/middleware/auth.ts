export default defineNuxtRouteMiddleware(async () => {
	const { fetchUser } = useAuth();
	const user = await fetchUser();
	if (!user.value) {
		// if there's no user found, navigate to the login page.
		return navigateTo("/login");
	}
});
