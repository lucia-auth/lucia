import type { DatabaseUser, User } from "../../../types.js";
import {
    getAccountFromDatabaseData,
} from "../../../utils/auth.js";
import type { Context } from "../../index.js";

export type UpdateUserData<UserData extends {}> = (
    userId: string,
    userData: Partial<UserData>
) => Promise<User<UserData>>;

export const updateUserDataFunction = <UserData extends {}>(context: Context) => {
    const updateUserData: UpdateUserData<UserData> = async (userId, userData) => {
        const databaseData = await context.adapter.updateUser(userId, { user_data: userData}) as DatabaseUser<UserData>
        const account = getAccountFromDatabaseData<UserData>(databaseData);
        return account.user
    };
    return updateUserData
};
