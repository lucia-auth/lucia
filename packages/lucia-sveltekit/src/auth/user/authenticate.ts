import type { DatabaseUser, ServerSession } from "../../types.js";
import { getAccountFromDatabaseData } from "../../utils/auth.js";
import { verifyScrypt } from "../../utils/crypto.js";
import { LuciaError } from "../../utils/error.js";
import {
    createAccessToken,
    createAccessTokenCookie,
    createRefreshToken,
    createRefreshTokenCookie,
} from "../../utils/token.js";
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
        ));
        if (!databaseData)
            throw new LuciaError("AUTH_INVALID_IDENTIFIER_TOKEN");
        const account = getAccountFromDatabaseData(databaseData);
        if (account.hashedPassword) {
            if (account.hashedPassword.startsWith("$2a"))
                throw new LuciaError("AUTH_OUTDATED_PASSWORD");
            const isValid = await verifyScrypt(
                password || "",
                account.hashedPassword
            );
            if (!isValid) throw new LuciaError("AUTH_INVALID_PASSWORD");
        }
        const user = account.user;
        const session = await context.auth.createSession(user.userId)
        return session
    };
    return authenticateUser;
};
