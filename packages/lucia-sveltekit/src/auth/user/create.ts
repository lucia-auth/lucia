import { User } from "../../types.js";
import { hashScrypt } from "../../utils/crypto.js";
import type { Context } from "../index.js";

type CreateUser = (
    provider: string,
    identifier: string,
    options?: {
        password?: string;
        attributes?: Lucia.UserAttributesSchema;
    }
) => Promise<User>;

export const createUserFunction = (context: Context) => {
    const createUser: CreateUser = async (provider, identifier, options) => {
        const providerId = `${provider}:${identifier}`;
        const attributes = options?.attributes || {};
        const userId = await context.generateCustomUserId()
        const hashedPassword = options?.password
            ? await hashScrypt(options.password)
            : null;
        const userData = await context.adapter.setUser(userId, {
            providerId,
            hashedPassword: hashedPassword,
            attributes,
        });
        const user = context.transformUserData(userData)
        return user
    };
    return createUser;
};
