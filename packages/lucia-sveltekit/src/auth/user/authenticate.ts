import chalk from "chalk";
import type { DatabaseUser, ServerSession } from "../../types.js";
import {
    createAccessToken,
    createFingerprintToken,
    createRefreshToken,
    getAccountFromDatabaseData,
} from "../../utils/auth.js";
import { verify } from "../../utils/crypto.js";
import { LuciaError } from "../../utils/error.js";
import type { Context } from "../index.js";

type authenticateUser = (
    authId: string,
    identifier: string,
    password?: string
) => Promise<ServerSession>;

export const authenticateUserFunction = (context: Context) => {
    const authenticateUser: authenticateUser = async (
        authId,
        identifier,
        password
    ) => {
        const identifierToken = `${authId}:${identifier}`;
        const databaseData = (await context.adapter.getUserByIdentifierToken(
            identifierToken
        )) as DatabaseUser | null;
        if (!databaseData)
            throw new LuciaError("AUTH_INVALID_IDENTIFIER_TOKEN");
        const account = getAccountFromDatabaseData(databaseData);
        if (account.hashed_password) {
            if (account.hashed_password.startsWith("$2a")) {
                console.log(
                    `${chalk.red.bold("[LUCIA_ERROR]")} ${chalk.red(
                        "The hashing algorithm used for passwords has changed as of v0.8.0, and all accounts made pre-v0.8.0 that uses passwords are invalid."
                    )}`
                );
                process.exit(1);
            }
            const isValid = await verify(
                password || "",
                account.hashed_password
            );
            if (!isValid) throw new LuciaError("AUTH_INVALID_PASSWORD");
        }
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
