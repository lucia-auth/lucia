import type { DatabaseUser, User } from "../../../types.js";
import {
    getAccountFromDatabaseData,
} from "../../../utils/auth.js";
import type { Context } from "../../index.js";

type UpdateUserData = (
    userId: string,
    userData: Partial<Lucia.UserData>
) => Promise<User>;

export const updateUserDataFunction = (context: Context) => {
    const updateUserData: UpdateUserData= async (userId, userData) => {
        const databaseData = await context.adapter.updateUser(userId, { user_data: userData}) as DatabaseUser
        const account = getAccountFromDatabaseData(databaseData);
        return account.user
    };
    return updateUserData
};
