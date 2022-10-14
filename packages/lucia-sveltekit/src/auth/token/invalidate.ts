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