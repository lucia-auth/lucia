import {
    createAccessToken,
    createFingerprintToken,
    createRefreshToken,
    getAccountFromDatabaseData,
} from "../utils/auth.js";
import { LuciaError } from "../utils/error.js";

import type { DatabaseUser, ServerSession } from "../types.js";
import type { Context } from "./index.js";

type CreateUserSession = (
    authId: string
) => Promise<ServerSession>;

export const createUserSessionFunction = (
    context: Context
) => {
    const createUserSession: CreateUserSession = async (authId) => {
        const databaseData = (await context.adapter.getUserById(
            authId
        )) as DatabaseUser | null;
        if (!databaseData)
            throw new LuciaError("AUTH_INVALID_IDENTIFIER_TOKEN");
        const account = getAccountFromDatabaseData(databaseData);
        const userId = account.user.user_id;
        const fingerprintToken = createFingerprintToken(context);
        const refreshToken = await createRefreshToken(
            account.user.user_id,
            fingerprintToken.value,
            context
        );
        await context.adapter.setRefreshToken(refreshToken.value, userId);
        const encryptedRefreshToken = refreshToken.encrypt();
        const accessToken = await createAccessToken(
            account.user,
            fingerprintToken.value,
            context
        );
        const accessTokenCookie = accessToken.createCookie();
        const encryptedRefreshTokenCookie =
            encryptedRefreshToken.createCookie();
        const fingerprintTokenCookie = fingerprintToken.createCookie();
        return {
            user: account.user,
            access_token: accessToken,
            refresh_token: refreshToken,
            fingerprint_token: fingerprintToken,
            cookies: [
                accessTokenCookie,
                encryptedRefreshTokenCookie,
                fingerprintTokenCookie,
            ],
        };
    };
    return createUserSession;
};
