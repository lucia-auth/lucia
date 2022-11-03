import type { User } from "lucia-auth";

export const getUser = async (): Promise<Readonly<User> | null> => {
	const response = await fetch("/api/auth/user");
	if (!response.ok) return null;
	const { user } = (await response.json()) as {
		user: User;
	};
	return user;
};

export const signOut = async () => {
	const response = await fetch("/api/auth/logout", {
		method: "POST"
	});
	if (!response.ok) throw new Error("Unknown");
	const { error } = (await response.json()) as {
		error?: string;
	};
	if (!error) return;
	throw new Error(error);
};
