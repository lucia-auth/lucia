import type { User } from "lucia-auth";

export const useAuth = () => {
	const user = useState<User | null>("user", () => null);

	const fetchUser = async () => {
		const { data } = await useFetch<{ user: User }>("/api/user");
		if (data?.value?.user) {
			user.value = data?.value?.user;
		}
		return computed(() => user.value);
	};
	return { user: readonly(user), fetchUser };
};
