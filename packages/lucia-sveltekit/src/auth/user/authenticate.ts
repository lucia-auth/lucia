import type { User } from "../../types.js";
import { getAccountFromDatabaseUser } from "../../utils/auth.js";
import { verifyScrypt } from "../../utils/crypto.js";
import { LuciaError } from "../../error.js";
import type { Context } from "../index.js";

type authenticateUser = (
    authId: string,
    identifier: string,
    password?: string
) => Promise<User>;

export const authenticateUserFunction = (context: Context) => {
    const authenticateUser: authenticateUser = async (
        provider,
        identifier,
        password
    ) => {
        const providerId = `${provider}:${identifier}`;
        const databaseData = await context.adapter.getUserByProviderId(
            providerId
        );
        if (!databaseData) throw new LuciaError("AUTH_INVALID_PROVIDER_ID");
        const account = getAccountFromDatabaseUser(databaseData);
        if (!account.hashedPassword)
            throw new LuciaError("AUTH_INVALID_PASSWORD");
        if (account.hashedPassword.startsWith("$2a"))
            throw new LuciaError("AUTH_OUTDATED_PASSWORD");
        const isValid = await verifyScrypt(
            password || "",
            account.hashedPassword
        );
        if (!isValid) throw new LuciaError("AUTH_INVALID_PASSWORD");
        return account.user;
    };
    return authenticateUser;
};
