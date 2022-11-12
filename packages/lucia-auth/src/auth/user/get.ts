import { LuciaError } from "../../error.js";
import type { User, Auth } from "../../types.js";

type GetUser = (provider: string, identifier: string) => Promise<User>;

export const getUserByProviderIdFunction = (auth: Auth) => {
	const getUserByProviderId: GetUser = async (provider, identifier) => {
		const providerId = `${provider}:${identifier}`;
		const databaseUser = await auth.configs.adapter.getUserByProviderId(providerId);
		if (!databaseUser) throw new LuciaError("AUTH_INVALID_PROVIDER_ID");
		const user = auth.configs.transformUserData(databaseUser);
		return user;
	};
	return getUserByProviderId;
};

type GetUserById = (userId: string) => Promise<User>;

export const getUserFunction = (auth: Auth) => {
	const getUser: GetUserById = async (userId: string) => {
		const databaseUser = await auth.configs.adapter.getUser(userId);
		if (!databaseUser) throw new LuciaError("AUTH_INVALID_USER_ID");
		const user = auth.configs.transformUserData(databaseUser);
		return user;
	};
	return getUser;
};
