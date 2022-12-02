import { LuciaError } from "../../error.js";
import type { User, Auth } from "../../types.js";

type authenticateUser = (authId: string, identifier: string, password: string) => Promise<User>;

export const authenticateUserFunction = (auth: Auth) => {
	const authenticateUser: authenticateUser = async (provider, identifier, password) => {
		const providerId = `${provider}:${identifier}`;
		const databaseData = await auth.configs.adapter.getUserByProviderId(providerId);
		if (!databaseData) throw new LuciaError("AUTH_INVALID_PROVIDER_ID");
		if (!databaseData.hashed_password) throw new LuciaError("AUTH_INVALID_PASSWORD");
		if (databaseData.hashed_password.startsWith("$2a"))
			throw new LuciaError("AUTH_OUTDATED_PASSWORD");
		const isValid = await auth.configs.hash.validate(password || "", databaseData.hashed_password);
		if (!isValid) throw new LuciaError("AUTH_INVALID_PASSWORD");
		const user = auth.configs.transformUserData(databaseData);
		return user;
	};
	return authenticateUser;
};
