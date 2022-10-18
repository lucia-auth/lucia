import type { Adapter } from "lucia-sveltekit/adapter";
import { test, end, validate } from "./../test.js";
import { User } from "./../db.js";
import { Database } from "../index.js";

export const testAdapter = async (adapter: Adapter, db: Database) => {
    const clearAll = async () => {
        await db.clearSessions();
        await db.clearUsers();
    };
    await clearAll();
    await test(
        "setUser()",
        "Insert a user with a null user id into Users DB",
        async () => {
            const user = new User();
            const createdUser = await adapter.setUser(null, {
                providerId: user.providerId,
                hashedPassword: user.hashedPassword,
                attributes: {
                    username: user.username,
                },
            });
            user.update({
                id: createdUser.id,
            });
            const users = await db.getUsers();
            validate.includesSomeItem(
                users,
                user.validateSchema,
                "Target does not exist in Users DB",
                user.getSchema()
            );
            await clearAll();
        }
    );
    await clearAll();
    end();
};
