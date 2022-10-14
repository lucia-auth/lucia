import type { Adapter } from "lucia-sveltekit/adapter"
import { test, end, validate } from "./../test.js";
import { User } from "./../db.js";
import { Database } from "../index.js";

export const testAdapter = async (adapter: Adapter, db: Database) => {
    const clearAll = async () => {
        await Promise.all([db.clearSessions(), db.clearRefreshTokens()]);
        await db.clearUsers();
    };
    await clearAll();
    await test(
        "setUser()",
        "Insert a user with a null user id into Users DB",
        async () => {
            const user = new User();
            const userId = await adapter.setUser(null, {
                providerId: user.providerId,
                hashedPassword: user.hashedPassword,
                userData: {
                    username: user.username,
                    email: user.user_email,
                },
            });
            user.update({
                id: userId,
            });
            const users = await db.getUsers();
            validate.includesSomeItem(
                users,
                user.validateDbSchema,
                "Target does not exist in Users DB",
                user.getDbSchema()
            );
            await clearAll();
        }
    );
    await clearAll();
    end();
};
