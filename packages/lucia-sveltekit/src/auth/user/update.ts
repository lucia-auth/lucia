import type { User } from "../../types.js";
import { getAccountFromDatabaseData } from "../../utils/auth.js";
import type { Context } from "../index.js";
import { hashScrypt } from "../../utils/crypto.js";

type UpdateUserIdentifierToken = (
    userId: string,
    auth_id: string,
    identifier: string
) => Promise<User>;

export const updateUserIdentifierTokenFunction = (context: Context) => {
    const updateUserIdentifierToken: UpdateUserIdentifierToken = async (
        userId,
        auth_id,
        identifier
    ) => {
        const identifierToken = `${auth_id}:${identifier}`;
        const databaseData = await context.adapter.updateUser(userId, {
            identifierToken,
        });
        const account = getAccountFromDatabaseData(databaseData);
        return account.user;
    };
    return updateUserIdentifierToken;
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
        const account = getAccountFromDatabaseData(databaseData);
        return account.user;
    };
    return updateUserData;
};

type UpdateUserPassword = (
    userId: string,
    password: string | null
) => Promise<void>;

export const updateUserPasswordFunction = (context: Context) => {
    const updateUserPassword: UpdateUserPassword = async (userId, password) => {
        const hashedPassword = password ? await hashScrypt(password) : null;
        await Promise.all([
            context.adapter.updateUser(userId, {
                hashedPassword,
            }),
            context.adapter.deleteUserRefreshTokens(userId),
        ]);
    };
    return updateUserPassword;
};
