import type { User } from "../../types.js";
import { hashScrypt } from "../../utils/crypto.js";
import type { Context } from "../index.js";

type CreateUser = (
    provider: string,
    identifier: string,
    options?: {
        password?: string;
        userData?: Lucia.UserData;
    }
) => Promise<User>;

export const createUserFunction = (context: Context) => {
    const createUser: CreateUser = async (provider, identifier, options) => {
        const providerId = `${provider}:${identifier}`;
        const userData = options?.userData || {};
        const userId = await context.generateCustomUserId()
        const hashedPassword = options?.password
            ? await hashScrypt(options.password)
            : null;
        const dbUserId = await context.adapter.setUser(userId, {
            providerId,
            hashedPassword: hashedPassword,
            userData: userData,
        });
        const user = {
            userId: dbUserId,
            ...userData
        } as User
        return user
    };
    return createUser;
};
