import type { User, Auth } from "../../types.js";
import { hashScrypt } from "../../utils/crypto.js";
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
