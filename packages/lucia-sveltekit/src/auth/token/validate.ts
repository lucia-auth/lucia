import { Session } from "../../types.js";
import { LuciaError } from "../../error.js";
import { Context } from "../index.js";

type ValidateAccessToken = (accessToken: string) => Promise<Session>;

export const validateAccessTokenFunction = (context: Context) => {
    const validateAccessToken: ValidateAccessToken = async (accessToken) => {
        const databaseSession = await context.adapter.getSessionByAccessToken(
            accessToken
        );
        if (!databaseSession) throw new LuciaError("AUTH_INVALID_ACCESS_TOKEN");
        const currentTime = new Date().getTime();
        if (currentTime > databaseSession.expires)
            throw new LuciaError("AUTH_INVALID_ACCESS_TOKEN");
        const { user_id: userId, expires } = databaseSession;
        return {
            userId,
            expires,
        };
    };
    return validateAccessToken;
};

type ValidateRefreshToken = (refreshToken: string) => Promise<string>;

export const validateRefreshTokenFunction = (context: Context) => {
    const validateRefreshToken: ValidateRefreshToken = async (refreshToken) => {
        const isValidTokenFormat =
            refreshToken.startsWith("rt_") && refreshToken.length === 43;
        if (!isValidTokenFormat)
            throw new LuciaError("AUTH_INVALID_REFRESH_TOKEN");
        const userId = await context.adapter.getUserIdByRefreshToken(
            refreshToken
        );
        if (!userId) throw new LuciaError("AUTH_INVALID_REFRESH_TOKEN");
        return userId;
    };
    return validateRefreshToken;
};
