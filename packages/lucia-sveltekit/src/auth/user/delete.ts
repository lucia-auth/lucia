import type { Context } from "../index.js";

export type DeleteUser = (userId: string) => Promise<void>

export const deleteUserFunction = (context: Context) => {
    const deleteUser : DeleteUser = async (userId: string) => {
        await context.adapter.deleteUserRefreshTokens(userId);
        await context.adapter.deleteUser(userId);
    };
    return deleteUser;
};
