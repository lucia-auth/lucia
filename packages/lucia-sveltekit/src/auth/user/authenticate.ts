import type { ServerSession } from "../../types.js";
import { getAccountFromDatabaseUser } from "../../utils/auth.js";
import { verifyScrypt } from "../../utils/crypto.js";
import { LuciaError } from "../../utils/error.js";
import type { Context } from "../index.js";

type authenticateUser = (
    provider: string,
    identifier: string,
    password?: string
) => Promise<ServerSession>;

export const authenticateUserFunction = (context: Context) => {
    const authenticateUser: authenticateUser = async (
        provider,
        identifier,
        password
    ) => {
        const providerId = `${provider}:${identifier}`;
        const databaseData = (await context.adapter.getUserByProviderId(
            providerId
        ));
        if (!databaseData)
            throw new LuciaError("AUTH_INVALID_PROVIDER_ID");
        const account = getAccountFromDatabaseUser(databaseData);
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
