import type { User } from "../../types.js";
import { getAccountFromDatabaseUser } from "../../utils/auth.js";
import { LuciaError } from "../../utils/error.js";
import type { Context } from "../index.js";

type GetUser = (
    provider: string,
    identifier: string
) => Promise<User>;

export const getUserByProviderIdFunction = (context: Context) => {
    const getUserByProviderId: GetUser = async (provider, identifier) => {
        const providerId = `${provider}:${identifier}`;
        const databaseUser = (await context.adapter.getUserByProviderId(
            providerId
        ))
        if (!databaseUser) throw new LuciaError("AUTH_INVALID_PROVIDER_ID");
        const account = getAccountFromDatabaseUser(databaseUser);
        return account.user;
    };
    return getUserByProviderId;
};

type GetUserById = (
    userId: string
) => Promise<User>;

export const getUserFunction = (context: Context) => {
    const getUser: GetUserById = async (userId: string) => {
        const databaseUser = (await context.adapter.getUserById(
            userId
        ))
        if (!databaseUser) throw new LuciaError("AUTH_INVALID_USER_ID")
        const account = getAccountFromDatabaseUser(databaseUser);
        return account.user;
    };
    return getUser;
};


type GetSessionUser = (accessToken: string) => Promise<User>

export const getSessionUserFunction = (context: Context) => {
    const getSessionUser: GetSessionUser = async (accessToken) => {
        const databaseUser = await context.adapter.getUserByAccessToken(accessToken)
        if (!databaseUser) throw new LuciaError("AUTH_INVALID_ACCESS_TOKEN")
        const account = getAccountFromDatabaseUser(databaseUser)
        return account.user
    }
    return getSessionUser
}