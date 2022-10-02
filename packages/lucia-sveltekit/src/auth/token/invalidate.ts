import type { Context } from "../index.js";

type InvalidateRefreshToken = (...refreshToken: string[]) => Promise<void>;

export const invalidateRefreshTokenFunction = (context: Context) => {
    const invalidateRefreshToken: InvalidateRefreshToken = async (
        refreshToken
    ) => {
        await context.adapter.deleteRefreshToken(refreshToken);
    };
    return invalidateRefreshToken;
};

type InvalidateAccessToken = (refreshToken: string) => Promise<void>;

export const invalidateAccessTokenFunction = (context: Context) => {
    const invalidateAccessToken: InvalidateAccessToken = async (
        refreshToken
    ) => {
        await context.adapter.deleteSessionByAccessToken(refreshToken)
    };
    return invalidateAccessToken
};