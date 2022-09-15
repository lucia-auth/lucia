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
            if (account.hashed_password.startsWith("$2a"))
                throw new LuciaError("AUTH_OUTDATED_PASSWORD");
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
        const accessToken = await createAccessToken(
            account.user,
            fingerprintToken.value,
            context
        );
        return {
            user: account.user,
            access_token: accessToken,
            refresh_token: refreshToken,
            fingerprint_token: fingerprintToken,
            cookies: [accessToken.cookie(), refreshToken.encrypt().cookie(), fingerprintToken.cookie()]
        };
    };
    return authenticateUser;
};
