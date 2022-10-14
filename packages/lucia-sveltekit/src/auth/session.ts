import type { Session, Tokens } from "../types.js";
import type { Context } from "./index.js";
import {
    createAccessToken,
    createAccessTokenCookie,
    createRefreshToken,
    createRefreshTokenCookie,
} from "../utils/token.js";
import { LuciaError } from "../index.js";

type CreateSession = (userId: string) => Promise<{
    session: Session;
    tokens: Tokens;
}>;

export const createSessionFunction = (context: Context) => {
    const createSession: CreateSession = async (userId) => {
        const [refreshToken] = createRefreshToken();
        const [accessToken, accessTokenExpires] = createAccessToken();
        await context.adapter.setSession(
            userId,
            accessToken,
            accessTokenExpires
        );
        await context.adapter.setRefreshToken(refreshToken, userId);
        const accessTokenCookie = createAccessTokenCookie(
            accessToken,
            accessTokenExpires,
            context.env === "PROD"
        );
        const refreshTokenCookie = createRefreshTokenCookie(
            refreshToken,
            context.env === "PROD"
        );
        return {
            session: {
                userId,
                expires: accessTokenExpires,
                accessToken,
            },
            tokens: {
                accessToken: [accessToken, accessTokenCookie],
                refreshToken: [refreshToken, refreshTokenCookie],
                cookies: [accessTokenCookie, refreshTokenCookie],
            },
        };
    };
    return createSession;
};

type InvalidateSession = (refreshToken: string) => Promise<void>;

export const invalidateSessionFunction = (context: Context) => {
    const invalidateSession: InvalidateSession = async (refreshToken) => {
        await context.adapter.deleteSessionByAccessToken(refreshToken);
    };
    return invalidateSession;
};

type InvalidateAllUserSessions = (userId: string) => Promise<void>;

export const invalidateAllUserSessionsFunction = (context: Context) => {
    const invalidateAllUserSessions: InvalidateAllUserSessions = async (
        userId: string
    ) => {
        await Promise.all([
            context.adapter.deleteSessionsByUserId(userId),
            context.adapter.deleteRefreshTokensByUserId(userId),
        ]);
    };
    return invalidateAllUserSessions;
};

type DeleteExpiredUserSessions = (userId: string) => Promise<void>;

export const deleteExpiredUserSessionsFunction = (context: Context) => {
    const deleteExpiredUserSessions: DeleteExpiredUserSessions = async (
        userId
    ) => {
        const sessions = await context.adapter.getSessionsByUserId(userId);
        const currentTime = new Date().getTime();
        const expiredUserAccessTokens = sessions
            .filter((val) => val.expires < currentTime)
            .map((val) => val.accessToken);
        await context.adapter.deleteSessionByAccessToken(
            ...expiredUserAccessTokens
        );
    };
    return deleteExpiredUserSessions;
};


type RefreshSession = (refreshToken: string) => Promise<{
    session: Session;
    tokens: Tokens;
}>;
export const refreshSessionFunction = (context: Context) => {
    const refreshSession: RefreshSession = async (refreshToken) => {
        const userId = await context.auth.validateRefreshToken(refreshToken);
        await context.adapter.deleteRefreshToken(refreshToken);
        const session = await context.auth.createSession(userId);
        return session;
    };
    return refreshSession;
};
