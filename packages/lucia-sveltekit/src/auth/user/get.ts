import type { Session } from "../../types.js";
import { LuciaError } from "../../error.js";
import type { Context } from "../index.js";
import { User } from "../../types.js";
import { SessionSchema, UserSchema } from "../../adapter/index.js";

type GetUser = (provider: string, identifier: string) => Promise<User>;

export const getUserByProviderIdFunction = (context: Context) => {
    const getUserByProviderId: GetUser = async (provider, identifier) => {
        const providerId = `${provider}:${identifier}`;
        const databaseUser = await context.adapter.getUserByProviderId(
            providerId
        );
        if (!databaseUser) throw new LuciaError("AUTH_INVALID_PROVIDER_ID");
        const user = context.transformUserData(databaseUser);
        return user;
    };
    return getUserByProviderId;
};

type GetUserById = (userId: string) => Promise<User>;

export const getUserFunction = (context: Context) => {
    const getUser: GetUserById = async (userId: string) => {
        const databaseUser = await context.adapter.getUser(userId);
        if (!databaseUser) throw new LuciaError("AUTH_INVALID_USER_ID");
        const user = context.transformUserData(databaseUser);
        return user;
    };
    return getUser;
};

type GetSessionUser = (sessionId: string) => Promise<{
    user: User;
    session: Session;
}>;

export const getSessionUserFunction = (context: Context) => {
    const getSessionUser: GetSessionUser = async (sessionId) => {
        let userSessionData: {
            user: UserSchema;
            session: SessionSchema;
        } | null;
        if (context.adapter.getSessionAndUserBySessionId !== undefined) {
            userSessionData =
                await context.adapter.getSessionAndUserBySessionId(sessionId);
        } else {
            const sessionData = await context.adapter.getSession(sessionId);
            if (!sessionData) throw new LuciaError("AUTH_INVALID_SESSION_ID");
            const userData = await context.adapter.getUser(sessionData.user_id);
            if (!userData) throw new LuciaError("AUTH_INVALID_SESSION_ID");
            userSessionData = {
                user: userData,
                session: sessionData,
            };
        }
        if (!userSessionData) throw new LuciaError("AUTH_INVALID_SESSION_ID");
        const { user: databaseUser, session: databaseSession } =
            userSessionData;
        if (new Date().getTime() > databaseSession.expires)
            throw new LuciaError("AUTH_INVALID_SESSION_ID");
        const user = context.transformUserData(databaseUser);
        return {
            user,
            session: {
                sessionId: databaseSession.id,
                expires: databaseSession.expires,
                userId: databaseSession.user_id,
                idlePeriodExpires: databaseSession.idle_expires,
            },
        };
    };
    return getSessionUser;
};
