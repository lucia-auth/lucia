import type { DatabaseUser, User } from "../types.js";
import {
    createAccessToken,
    createFingerprintToken,
    createRefreshToken,
    getAccountFromDatabaseData,
} from "../utils/auth.js";
import { LuciaError } from "../utils/error.js";
import type {
    AccessToken,
    EncryptedRefreshToken,
    FingerprintToken,
    RefreshToken,
} from "../utils/token.js";
import type { Context } from "./index.js";

export type CreateUserSession<UserData extends {}> = (
    authId: string
) => Promise<{
    user: User<UserData>;
    access_token: AccessToken<UserData>;
    refresh_token: RefreshToken;
    encrypted_refresh_token: EncryptedRefreshToken;
    fingerprint_token: FingerprintToken;
    cookies: string[];
}>;

export const createUserSessionFunction = <UserData extends {}>(
    context: Context
) => {
    const createUserSession: CreateUserSession<UserData> = async (authId) => {
        const databaseData = (await context.adapter.getUserById(
            authId
        )) as DatabaseUser<UserData> | null;
        if (!databaseData)
            throw new LuciaError("AUTH_INVALID_IDENTIFIER_TOKEN");
        const account = getAccountFromDatabaseData<UserData>(databaseData);
        const userId = account.user.user_id;
        const fingerprintToken = createFingerprintToken(context);
        const refreshToken = await createRefreshToken(
            account.user.user_id,
            fingerprintToken.value,
            context
        );
        await context.adapter.setRefreshToken(refreshToken.value, userId);
        const encryptedRefreshToken = refreshToken.encrypt();
        const accessToken = await createAccessToken<UserData>(
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
            encrypted_refresh_token: encryptedRefreshToken,
            cookies: [
                accessTokenCookie,
                encryptedRefreshTokenCookie,
                fingerprintTokenCookie,
            ],
        };
    };
    return createUserSession;
};
