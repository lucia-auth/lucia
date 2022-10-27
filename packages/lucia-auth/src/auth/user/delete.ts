import type { Auth } from "../../types.js";

type DeleteUser = (userId: string) => Promise<void>;

export const deleteUserFunction = (auth: Auth) => {
	const deleteUser: DeleteUser = async (userId: string) => {
		await auth.configs.adapter.deleteSessionsByUserId(userId);
		await auth.configs.adapter.deleteUser(userId);
	};
	return deleteUser;
};
