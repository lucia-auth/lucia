import type { Context } from "../index.js";
import { hashScrypt } from "../../utils/crypto.js";
import { User } from "../../types.js";

type UpdateUserProviderIdToken = (
    userId: string,
    provider: string,
    identifier: string
) => Promise<User>;

export const updateUserProviderIdFunction = (context: Context) => {
    const updateUserProviderId: UpdateUserProviderIdToken = async (
        userId,
        provider,
        identifier
    ) => {
        const providerId = `${provider}:${identifier}`;
        const userData = await context.adapter.updateUser(userId, {
            providerId,
        });
        const user = context.transformUserData(userData);
        return user;
    };
    return updateUserProviderId;
};

type UpdateUserAttributes = (
    userId: string,
    userData: Partial<Lucia.UserAttributesSchema>
) => Promise<User>;

export const updateUserAttributesFunction = (context: Context) => {
    const updateUserAttributes: UpdateUserAttributes = async (
        userId,
        attributes
    ) => {
        const userData = await context.adapter.updateUser(userId, {
            attributes,
        });
        const user = context.transformUserData(userData);
        return user;
    };
    return updateUserAttributes;
};

type UpdateUserPassword = (
    userId: string,
    password: string | null
) => Promise<Lucia.User>;

export const updateUserPasswordFunction = (context: Context) => {
    const updateUserPassword: UpdateUserPassword = async (userId, password) => {
        const hashedPassword = password ? await hashScrypt(password) : null;
        const [userData] = await Promise.all([
            context.adapter.updateUser(userId, {
                hashedPassword,
            }),
            context.adapter.deleteSessionsByUserId(userId),
        ]);
        const user = context.transformUserData(userData);
        return user;
    };
    return updateUserPassword;
};
