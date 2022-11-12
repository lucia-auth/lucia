import { hashScrypt } from "../../utils/crypto.js";
import type { Auth, User } from "../../types.js";

type CreateUser = (
	provider: string,
	identifier: string,
	options?: {
		password?: string;
		attributes?: Lucia.UserAttributes;
	}
) => Promise<User>;

export const createUserFunction = (auth: Auth) => {
	const createUser: CreateUser = async (provider, identifier, options) => {
		const providerId = `${provider}:${identifier}`;
		const attributes = options?.attributes || {};
		const userId = await auth.configs.generateCustomUserId();
		const hashedPassword = options?.password ? await hashScrypt(options.password) : null;
		const userData = await auth.configs.adapter.setUser(userId, {
			providerId,
			hashedPassword: hashedPassword,
			attributes
		});
		const user = auth.configs.transformUserData(userData);
		return user;
	};
	return createUser;
};

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

type DeleteUser = (userId: string) => Promise<void>;

export const deleteUserFunction = (auth: Auth) => {
	const deleteUser: DeleteUser = async (userId: string) => {
		await auth.configs.adapter.deleteSessionsByUserId(userId);
		await auth.configs.adapter.deleteUser(userId);
	};
	return deleteUser;
};
