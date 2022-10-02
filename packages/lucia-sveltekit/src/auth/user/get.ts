import type { User } from "../../types.js";
import { getAccountFromDatabaseData } from "../../utils/auth.js";
import { LuciaError } from "../../utils/error.js";
import type { Context } from "../index.js";

type GetUser = (
    authId: string,
    identifier: string
) => Promise<User>;

export const getUserByIdentifierFunction = (context: Context) => {
    const getUserByIdentifier: GetUser = async (authMethod, identifier) => {
        const identifierToken = `${authMethod}:${identifier}`;
        const databaseData = (await context.adapter.getUserByIdentifierToken(
            identifierToken
        ))
        if (!databaseData) throw new LuciaError("AUTH_INVALID_IDENTIFIER_TOKEN");
        const account = getAccountFromDatabaseData(databaseData);
        return account.user;
    };
    return getUserByIdentifier;
};

type GetUserById = (
    userId: string
) => Promise<User>;

export const getUserFunction = (context: Context) => {
    const getUser: GetUserById = async (userId: string) => {
        const databaseData = (await context.adapter.getUserById(
            userId
        ))
        if (!databaseData) throw new LuciaError("AUTH_INVALID_USER_ID")
        const account = getAccountFromDatabaseData(databaseData);
        return account.user;
    };
    return getUser;
};
