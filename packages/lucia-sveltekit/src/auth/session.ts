import type { ServerSession, Tokens } from "../types.js";
import type { Context } from "./index.js";
import {
    createAccessToken,
    createAccessTokenCookie,
    createRefreshToken,
    createRefreshTokenCookie,
} from "../utils/token.js";

type CreateSessionTokens = (userId: string) => Promise<Tokens>;

export const createSessionTokensFunction = (context: Context) => {
    const createSessionTokens: CreateSessionTokens = async (userId) => {
        const refreshToken = createRefreshToken(userId, context);
        const [accessToken, accessTokenExpires] = createAccessToken();
        await context.adapter.setAccessToken(
            accessToken,
            accessTokenExpires,
            userId
        );
        await context.adapter.setRefreshToken(refreshToken, userId);
        const accessTokenCookie = createAccessTokenCookie(
            accessToken,
            accessTokenExpires,
            context
        );
        const refreshTokenCookie = createRefreshTokenCookie(
            refreshToken,
            context
        );
        return {
            accessToken: [accessToken, accessTokenCookie],
            refreshToken: [refreshToken, refreshTokenCookie],
            cookies: [accessTokenCookie, refreshTokenCookie],
            expires: accessTokenExpires,
        };
    };
    return createSessionTokens;
};

type CreateSession = (userId: string) => Promise<ServerSession>;

export const createSessionFunction = (context: Context) => {
    const createSession: CreateSession = async (userId) => {
        const [user, tokens] = await Promise.all([
            context.auth.getUser(userId),
            context.auth.createSessionTokens(userId),
        ]);
        return {
            user,
            ...tokens,
        };
    };
    return createSession;
};

type InvalidateAllUserSessions = (userId: string) => Promise<void>;

export const invalidateAllUserSessionsFunction = (context: Context) => {
    const invalidateAllUserSessions: InvalidateAllUserSessions = async (
        userId: string
    ) => {
        await Promise.all([
            context.adapter.deleteUserAccessTokens(userId),
            context.adapter.deleteUserRefreshTokens(userId),
        ]);
    };
    return invalidateAllUserSessions;
};

type DeleteExpiredUserSessions = (userId: string) => Promise<void>;

export const deleteExpiredUserSessionsFunction = (context: Context) => {
    const deleteExpiredUserSessions: DeleteExpiredUserSessions = async (
        userId
    ) => {
        const userAccessTokens = await context.adapter.getAccessTokensByUserId(
            userId
        );
        const currentTime = new Date().getTime();
        const expiredUserAccessTokens = userAccessTokens
            .filter((val) => val.expires < currentTime)
            .map((val) => val.accessToken);
        await context.adapter.deleteRefreshToken(...expiredUserAccessTokens)
    };
    return deleteExpiredUserSessions;
};
