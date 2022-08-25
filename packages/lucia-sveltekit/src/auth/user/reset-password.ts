import { hash } from "../../utils/crypto.js";
import type { Context } from "../index.js";

type ResetUserPassword = (
    userId: string,
    password: string | null
) => Promise<void>;

export const resetUserPasswordFunction = (context: Context) => {
    const resetUserPassword: ResetUserPassword = async (userId, password) => {
        const hashedPassword = password ? await hash(password) : null;
        await Promise.all([
            context.adapter.updateUser(userId, {
                hashed_password: hashedPassword,
            }),
            context.adapter.deleteUserRefreshTokens(userId),
        ]);
    };
    return resetUserPassword;
};
