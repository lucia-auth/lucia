import { LuciaUser } from "../../types.js";
import { hash } from "../../utils/crypto.js";
import {
    AccessToken,
    FingerprintToken,
    RefreshToken,
} from "../../utils/token.js";
import { Context } from "../index.js";

export type CreateUser = (
    authId: string,
    identifier: string,
    options: {
        password?: string;
        user_data?: Record<string, any>;
    }
) => Promise<{
    user: LuciaUser;
    access_token: AccessToken;
    refresh_token: RefreshToken;
    fingerprint: FingerprintToken;
    cookies: string[];
}>;

export const createUserFunction = (context: Context) => {
    const createUser: CreateUser = async (authId, identifier, options) => {
        const identifierToken = `${authId}:${identifier}`;
        const userId = context.generateUserId();
        const fingerprintToken = context.auth.createFingerprintToken();
        const refreshToken = await context.auth.createRefreshToken(
            fingerprintToken.value
        );
        const encryptedRefreshToken = refreshToken.encrypt()
        const hashedPassword = options.password
            ? await hash(options.password)
            : null;
        const userData = options.user_data || {};
        await context.adapter.createUser(userId, {
            identifier_token: identifierToken,
            hashed_password: hashedPassword,
            user_data: userData,
        });
        await context.adapter.saveRefreshToken(refreshToken.value, userId);
        const user = {
            user_id: userId,
            ...userData,
        };
        const accessToken = await context.auth.createAccessToken(
            user,
            fingerprintToken.value
        );
        const accessTokenCookie = accessToken.createCookie();
        const encryptedRefreshTokenCookie = encryptedRefreshToken.createCookie();
        const fingerprintTokenCookie = fingerprintToken.createCookie();
        return {
            user,
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
    return createUser;
};
