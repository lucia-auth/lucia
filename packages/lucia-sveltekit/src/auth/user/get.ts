import { DatabaseUser, User } from "../../types.js";
import { getAccountFromDatabaseData } from "../../utils/auth.js";
import { Context } from "../index.js";

export type GetUser<UserData extends {}> = (
    authId: string,
    identifier: string
) => Promise<User<UserData> | null>;

export const getUserFunction = <UserData extends {}>(context: Context) => {
    const getUser: GetUser<UserData> = async (authId, identifier) => {
        const identifierToken = `${authId}:${identifier}`;
        const databaseData = await context.adapter.getUserFromIdentifierToken(
            identifierToken
        ) as DatabaseUser<UserData> | null;
        if (!databaseData) return null;
        const account = getAccountFromDatabaseData<UserData>(databaseData);
        return account.user;
    };
    return getUser;
};
