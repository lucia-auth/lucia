import type { DatabaseUser, User } from "../../types.js";
import { getAccountFromDatabaseData } from "../../utils/auth.js";
import type { Context } from "../index.js";

type GetUser = (
    authId: string,
    identifier: string
) => Promise<User | null>;

export const getUserFunction = (context: Context) => {
    const getUser: GetUser = async (authId, identifier) => {
        const identifierToken = `${authId}:${identifier}`;
        const databaseData = (await context.adapter.getUserByIdentifierToken(
            identifierToken
        )) as DatabaseUser | null;
        if (!databaseData) return null;
        const account = getAccountFromDatabaseData(databaseData);
        return account.user;
    };
    return getUser;
};

type GetUserById = (
    userId: string
) => Promise<User| null>;

export const getUserByIdFunction = (context: Context) => {
    const getUserById: GetUserById = async (userId: string) => {
        const databaseData = (await context.adapter.getUserById(
            userId
        )) as DatabaseUser | null;
        if (!databaseData) return null;
        const account = getAccountFromDatabaseData(databaseData);
        return account.user;
    };
    return getUserById;
};
