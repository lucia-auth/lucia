import type { DatabaseUser, User } from "../../../types.js";
import { getAccountFromDatabaseData } from "../../../utils/auth.js";
import type { Context } from "../../index.js";

type UpdateUserIdentifierToken = (
    userId: string,
    auth_id: string,
    identifier: string
) => Promise<User>;

export const updateUserIdentifierTokenFunction =(
    context: Context
) => {
    const updateUserIdentifierToken: UpdateUserIdentifierToken = async (
        userId,
        auth_id,
        identifier
    ) => {
        const identifierToken = `${auth_id}:${identifier}`;
        const databaseData = (await context.adapter.updateUser(userId, {
            identifier_token: identifierToken,
        })) as DatabaseUser
        const account = getAccountFromDatabaseData(databaseData);
        return account.user;
    };
    return updateUserIdentifierToken;
};
