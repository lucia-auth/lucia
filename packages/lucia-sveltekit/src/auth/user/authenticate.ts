import { verifyScrypt } from "../../utils/crypto.js";
import { LuciaError } from "../../error.js";
import type { Context } from "../index.js";
import { User } from "../../types.js";

type authenticateUser = (
    authId: string,
    identifier: string,
    password: string
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
        if (!databaseData.hashed_password)
            throw new LuciaError("AUTH_INVALID_PASSWORD");
        if (databaseData.hashed_password.startsWith("$2a"))
            throw new LuciaError("AUTH_OUTDATED_PASSWORD");
        const isValid = await verifyScrypt(
            password || "",
            databaseData.hashed_password
        );
        if (!isValid) throw new LuciaError("AUTH_INVALID_PASSWORD");
        const user = context.transformUserData(databaseData);
        return user;
    };
    return authenticateUser;
};
