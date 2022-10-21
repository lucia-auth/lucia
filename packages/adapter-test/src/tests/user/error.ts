import type { Adapter } from "lucia-sveltekit/adapter";
import { test, end, validate } from "../../test.js";
import { User } from "../../db.js";
import { Database } from "../../index.js";

const INVALID_INPUT = "INVALID_INPUT";

export const testUserAdapterErrors = async (adapter: Adapter, db: Database, endProcess = true) => {
    const clearAll = async () => {
        await db.clearSessions();
        await db.clearUsers();
    };
    await clearAll();
    await test(
        "setUser()",
        "Throw AUTH_DUPLICATE_PROVIDER_ID or AUTH_DUPLICATE_USER_DATA if provider id violates unique key",
        async () => {
            const user1 = new User();
            const user2 = new User();
            await db.insertUser(user1.getSchema());
            try {
                await adapter.setUser(user2.id, {
                    providerId: user1.providerId,
                    hashedPassword: user2.hashedPassword,
                    attributes: {
                        username: user2.username,
                    },
                });
            } catch (e) {
                const error = e as Error;
                try {
                    validate.isEqual(
                        error.message,
                        "AUTH_DUPLICATE_PROVIDER_ID",
                        "Error message did not match"
                    );
                } catch {
                    validate.isEqual(
                        error.message,
                        "AUTH_DUPLICATE_USER_DATA",
                        "Error message did not match"
                    );
                }
                await clearAll();
                return;
            }
            throw new Error("No error was thrown");
        }
    );
    await test(
        "setUser()",
        "Throw AUTH_DUPLICATE_USER_DATA if user data violates unique key",
        async () => {
            const user1 = new User();
            const user2 = new User();
            await db.insertUser(user1.getSchema());
            try {
                await adapter.setUser(user2.id, {
                    providerId: user2.providerId,
                    hashedPassword: user2.hashedPassword,
                    attributes: {
                        username: user1.username,
                    },
                });
            } catch (e) {
                const error = e as Error;
                validate.isEqual(
                    error.message,
                    "AUTH_DUPLICATE_USER_DATA",
                    "Error message did not match"
                );
                await clearAll();
                return;
            }
            throw new Error("No error was thrown");
        }
    );
    await test(
        "updateUser()",
        "Throw AUTH_INVALID_USER_ID if user id is invalid",
        async () => {
            try {
                await adapter.updateUser(INVALID_INPUT, {});
                throw new Error("No error was thrown");
            } catch (e) {
                const error = e as Error;
                validate.isEqual(
                    error.message,
                    "AUTH_INVALID_USER_ID",
                    "Error message did not match"
                );
            }
            await clearAll();
        }
    );
    await test(
        "updateUser()",
        "Throw AUTH_DUPLICATE_PROVIDER_ID if user data violates unique key",
        async () => {
            const user1 = new User();
            const user2 = new User();
            await db.insertUser(user1.getSchema());
            await db.insertUser(user2.getSchema());
            try {
                await adapter.updateUser(user2.id, {
                    providerId: user1.providerId,
                });
                throw new Error("No error was thrown");
            } catch (e) {
                const error = e as Error;
                validate.isEqual(
                    error.message,
                    "AUTH_DUPLICATE_PROVIDER_ID",
                    "Error message did not match"
                );
            }
            await clearAll();
        }
    );
    await test(
        "updateUser()",
        "Throw AUTH_DUPLICATE_USER_DATA if user data violates unique key",
        async () => {
            const user1 = new User();
            const user2 = new User();
            await db.insertUser(user1.getSchema());
            await db.insertUser(user2.getSchema());
            try {
                await adapter.updateUser(user2.id, {
                    attributes: {
                        username: user1.username,
                    },
                });
                throw new Error("No error was thrown");
            } catch (e) {
                const error = e as Error;
                validate.isEqual(
                    error.message,
                    "AUTH_DUPLICATE_USER_DATA",
                    "Error message did not match"
                );
            }
            await clearAll();
        }
    );
    await clearAll();
    if (!endProcess) return
    end();
};
