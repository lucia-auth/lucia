import type { User } from "lucia";

export const invalidateUserState = async () => {
	const userState = useState<"invalid" | "valid">(
		"user_state",
		() => "invalid"
	);
	userState.value = "invalid";
};

export const useUser = async () => {
	const userState = useState<"invalid" | "valid">(
		"user_state",
		() => "invalid"
	);
	const user = useState<User | null>("user", () => null);
	if (userState.value === "invalid") {
		userState.value = "valid";
		const { data, error } = await useFetch("/api/user");
		if (error.value) throw createError("Failed to fetch data");
		user.value = data.value?.user ?? null;
	}
	return computed(() => user.value); // readonly
};

export const useAuthenticatedUser = async () => {
	const user = unref(await useUser());
	if (!user) {
		throw createError(
			"useAuthenticatedUser() can only be used in protected pages"
		);
	}
	const authenticatedUser = useState("authenticated_user", () => user);
	return computed(() => authenticatedUser); // readonly
};
