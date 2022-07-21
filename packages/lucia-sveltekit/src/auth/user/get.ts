import { LuciaUser } from "../../types.js";
import { getAccountFromDatabaseData } from "../../utils/auth.js";
import { Context } from "../index.js";

export type GetUser = (
    authId: string,
    identifier: string
) => Promise<LuciaUser | null>;

export const getUserFunction = (context: Context) => {
    const getUser: GetUser = async (authId, identifier) => {
        const identifierToken = `${authId}:${identifier}`;
        const databaseData = await context.adapter.getUserFromIdentifierToken(
            identifierToken
        );
        if (!databaseData) return null;
        const account = getAccountFromDatabaseData(databaseData);
        return account.user;
    };
    return getUser;
};
