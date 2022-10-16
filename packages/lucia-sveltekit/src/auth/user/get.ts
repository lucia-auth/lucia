import type { Session, User } from "../../types.js";
import { getAccountFromDatabaseUser } from "../../utils/auth.js";
import { LuciaError } from "../../error.js";
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
        const databaseUser = (await context.adapter.getUser(
            userId
        ))
        if (!databaseUser) throw new LuciaError("AUTH_INVALID_USER_ID")
        const account = getAccountFromDatabaseUser(databaseUser);
        return account.user;
    };
    return getUser;
};


type GetSessionUser = (sessionId: string) => Promise<{
    user: User,
    session: Session
}>

export const getSessionUserFunction = (context: Context) => {
    const getSessionUser: GetSessionUser = async (sessionId) => {
        const userSession = await context.adapter.getSessionAndUserBySessionId(sessionId)
        if (!userSession) throw new LuciaError("AUTH_INVALID_SESSION_ID")
        if (new Date().getTime() > userSession.session.expires) throw new LuciaError("AUTH_INVALID_SESSION_ID")
        const account = getAccountFromDatabaseUser(userSession.user)
        return {
            user: account.user,
            session: {
                sessionId: userSession.session.id,
                expires: userSession.session.expires,
                userId: userSession.session.user_id
            }
        }
    }
    return getSessionUser
}