import type { DatabaseUser, User } from "../../../types.js";
import { getAccountFromDatabaseData } from "../../../utils/auth.js";
import type { Context } from "../../index.js";

export type UpdateUserIdentifierToken<UserData extends {}> = (
    userId: string,
    auth_id: string,
    identifier: string
) => Promise<User<UserData>>;

export const updateUserIdentifierTokenFunction = <UserData extends {}>(
    context: Context
) => {
    const updateUserIdentifierToken: UpdateUserIdentifierToken<UserData> = async (
        userId,
        auth_id,
        identifier
    ) => {
        const identifierToken = `${auth_id}:${identifier}`;
        const databaseData = (await context.adapter.updateUser(userId, {
            identifier_token: identifierToken,
        })) as DatabaseUser<UserData>;
        const account = getAccountFromDatabaseData<UserData>(databaseData);
        return account.user;
    };
    return updateUserIdentifierToken;
};
