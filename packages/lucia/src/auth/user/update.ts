import { hashScrypt } from "../../utils/crypto.js";
import type { Auth, User } from "../../types.js";

type UpdateUserProviderIdToken = (
	userId: string,
	provider: string,
	identifier: string
) => Promise<User>;

export const updateUserProviderIdFunction = (auth: Auth) => {
	const updateUserProviderId: UpdateUserProviderIdToken = async (userId, provider, identifier) => {
		const providerId = `${provider}:${identifier}`;
		const userData = await auth.configs.adapter.updateUser(userId, {
			providerId
		});
		const user = auth.configs.transformUserData(userData);
		return user;
	};
	return updateUserProviderId;
};

type UpdateUserAttributes = (
	userId: string,
	userData: Partial<Lucia.UserAttributes>
) => Promise<User>;

export const updateUserAttributesFunction = (auth: Auth) => {
	const updateUserAttributes: UpdateUserAttributes = async (userId, attributes) => {
		const userData = await auth.configs.adapter.updateUser(userId, {
			attributes
		});
		const user = auth.configs.transformUserData(userData);
		return user;
	};
	return updateUserAttributes;
};

type UpdateUserPassword = (userId: string, password: string | null) => Promise<User>;

export const updateUserPasswordFunction = (auth: Auth) => {
	const updateUserPassword: UpdateUserPassword = async (userId, password) => {
		const hashedPassword = password ? await hashScrypt(password) : null;
		const [userData] = await Promise.all([
			auth.configs.adapter.updateUser(userId, {
				hashedPassword
			}),
			auth.configs.adapter.deleteSessionsByUserId(userId)
		]);
		const user = auth.configs.transformUserData(userData);
		return user;
	};
	return updateUserPassword;
};
