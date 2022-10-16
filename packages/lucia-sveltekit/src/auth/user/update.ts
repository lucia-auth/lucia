import type { User } from "../../types.js";
import { getAccountFromDatabaseUser } from "../../utils/auth.js";
import type { Context } from "../index.js";
import { hashScrypt } from "../../utils/crypto.js";

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
        const databaseData = await context.adapter.updateUser(userId, {
            providerId,
        });
        const account = getAccountFromDatabaseUser(databaseData);
        return account.user;
    };
    return updateUserProviderId;
};

type UpdateUserData = (
    userId: string,
    userData: Partial<Lucia.UserData>
) => Promise<User>;

export const updateUserDataFunction = (context: Context) => {
    const updateUserData: UpdateUserData = async (userId, userData) => {
        const databaseData = await context.adapter.updateUser(userId, {
            userData,
        });
        const account = getAccountFromDatabaseUser(databaseData);
        return account.user;
    };
    return updateUserData;
};

type UpdateUserPassword = (
    userId: string,
    password: string | null
) => Promise<User>;

export const updateUserPasswordFunction = (context: Context) => {
    const updateUserPassword: UpdateUserPassword = async (userId, password) => {
        const hashedPassword = password ? await hashScrypt(password) : null;
        const [databaseData] = await Promise.all([
            context.adapter.updateUser(userId, {
                hashedPassword,
            }),
            context.adapter.deleteSessionsByUserId(userId),
        ]);
        const account = getAccountFromDatabaseUser(databaseData)
        return account.user
    };
    return updateUserPassword;
};
