import { LuciaUser } from "../../types.js";
import { getAccountFromDatabaseData } from "../../utils/auth.js";
import { compare } from "../../utils/crypto.js";
import { LuciaError } from "../../utils/error.js";
import {
    AccessToken,
    EncryptedRefreshToken,
    FingerprintToken,
    RefreshToken,
} from "../../utils/token.js";
import { Context } from "../index.js";

export type authenticateUser = (
    authId: string,
    identifier: string,
    password?: string
) => Promise<{
    user: LuciaUser;
    access_token: AccessToken;
    refresh_token: RefreshToken;
    encrypted_refresh_token: EncryptedRefreshToken;
    fingerprint: FingerprintToken;
    cookies: string[];
}>;

export const authenticateUserFunction = (context: Context) => {
    const authenticateUser: authenticateUser = async (
        authId,
        identifier,
        password
    ) => {
        const identifierToken = `${authId}:${identifier}`;
        const databaseData = await context.adapter.getUserFromIdentifierToken(
            identifierToken
        );
        if (!databaseData)
            throw new LuciaError("AUTH_INVALID_IDENTIFIER_TOKEN");
        const account = getAccountFromDatabaseData(databaseData);
        if (account.hashed_password) {
            try {
                await compare(password || "", account.hashed_password);
            } catch {
                throw new LuciaError("AUTH_INVALID_PASSWORD");
            }
        }
        const userId = account.user.user_id;
        const fingerprintToken = context.auth.createFingerprintToken();
        const refreshToken = await context.auth.createRefreshToken(
            fingerprintToken.value
        );
        await context.adapter.saveRefreshToken(refreshToken.value, userId);
        const encryptedRefreshToken = refreshToken.encrypt()
        const accessToken = await context.auth.createAccessToken(
            account.user,
            fingerprintToken.value
        );
        const accessTokenCookie = accessToken.createCookie();
        const encryptedRefreshTokenCookie = encryptedRefreshToken.createCookie();
        const fingerprintTokenCookie = fingerprintToken.createCookie();
        return {
            user: account.user,
            access_token: accessToken,
            refresh_token: refreshToken,
            fingerprint: fingerprintToken,
            encrypted_refresh_token: encryptedRefreshToken,
            cookies: [
                accessTokenCookie,
                encryptedRefreshTokenCookie,
                fingerprintTokenCookie,
            ],
        };
    };
    return authenticateUser;
};
