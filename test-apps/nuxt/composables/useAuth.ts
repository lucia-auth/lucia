export const useAuth = () => {
	const { data, execute: fetchUser } = useFetch("/api/user", {
		immediate: false
	});
	return { user: computed(() => data.value?.user), fetchUser };
};
