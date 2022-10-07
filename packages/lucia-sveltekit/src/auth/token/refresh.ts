import { Session, Tokens } from "../../types.js";
import type { Context } from "../index.js";

type RefreshTokens = (refreshToken: string) => Promise<{
    session: Session;
    tokens: Tokens;
}>;
export const refreshTokensFunction = (context: Context) => {
    const refreshAccessToken: RefreshTokens = async (refreshToken) => {
        const userId = await context.auth.validateRefreshToken(refreshToken);
        await context.adapter.deleteRefreshToken(refreshToken);
        const session = await context.auth.createSession(userId);
        return session;
    };
    return refreshAccessToken;
};
