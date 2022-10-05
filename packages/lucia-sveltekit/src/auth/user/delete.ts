import type { Context } from "../index.js";

type DeleteUser = (userId: string) => Promise<void>

export const deleteUserFunction = (context: Context) => {
    const deleteUser : DeleteUser = async (userId: string) => {
        await context.adapter.deleteSessionsByUserId(userId)
        await context.adapter.deleteRefreshTokensByUserId(userId);
        await context.adapter.deleteUser(userId);
    };
    return deleteUser;
};
