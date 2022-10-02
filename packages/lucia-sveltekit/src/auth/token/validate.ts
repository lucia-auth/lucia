import { Session, User } from "../../types.js";
import { getAccountFromDatabaseData } from "../../utils/auth.js";
import { verifySHA256 } from "../../utils/crypto.js";
import { LuciaError } from "../../utils/error.js";
import { Context } from "../index.js";

type ValidateAccessToken = (accessToken: string) => Promise<Session>;

export const validateAccessTokenFunction = (context: Context) => {
    const validateAccessToken: ValidateAccessToken = async (accessToken) => {
        const databaseSession = await context.adapter.getSessionByAccessToken(
            accessToken
        );
        if (!databaseSession) throw new LuciaError("AUTH_INVALID_ACCESS_TOKEN");
        const { user: databaseUser, expires } = databaseSession;
        return {
            user: getAccountFromDatabaseData(databaseUser).user,
            expires,
        };
    };
    return validateAccessToken;
};

type ValidateRefreshToken = (refreshToken: string) => Promise<User>;

export const validateRefreshTokenFunction = (context: Context) => {
    const validateRefreshToken: ValidateRefreshToken = async (refreshToken) => {
        const [_, hashedUserId, userId] = refreshToken.split(".");
        const isMatch = verifySHA256(userId, hashedUserId, context.secret);
        if (!isMatch) throw new LuciaError("AUTH_INVALID_REFRESH_TOKEN");
        const databaseUser = await context.adapter.getUserByRefreshToken(
            refreshToken
        );
        if (databaseUser) return getAccountFromDatabaseData(databaseUser).user;

        /*
        is a token issued by Lucia, but is invalid
        we can assume

        1. somebody stole a user's token (but is expired)
        2. a user's token was stolen and was used before the they could use it

        either way, all sessions should be invalidated
        */
        await context.auth.invalidateAllUserSessions(userId);
        throw new LuciaError("AUTH_INVALID_REFRESH_TOKEN");
    };
    return validateRefreshToken;
};
