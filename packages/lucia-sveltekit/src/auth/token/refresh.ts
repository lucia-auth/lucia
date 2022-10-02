import { ServerSession } from "../../types.js";
import type { Context } from "../index.js";

type RefreshTokens = (
    refreshToken: string,
) => Promise<ServerSession>;
export const refreshTokensFunction = (context: Context) => {
    const refreshAccessToken: RefreshTokens = async (refreshToken) => {
        const user = await context.auth.validateRefreshToken(refreshToken)
        await context.adapter.deleteRefreshToken(refreshToken);
        const session = await context.auth.createSession(user.userId)
        return session
    };
    return refreshAccessToken;
};
