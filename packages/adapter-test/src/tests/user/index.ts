import type { SessionSchema, UserSchema } from "lucia-sveltekit/adapter";
import type { Adapter } from "lucia-sveltekit/adapter";
import { test, end, validate } from "../../test.js";
import { User } from "../../db.js";
import { Database } from "../../index.js";

const INVALID_INPUT = "INVALID_INPUT";

export const testUserAdapter = async (adapter: Adapter, db: Database, endProcess = true) => {
    const clearAll = async () => {
        await db.clearSessions();
        await db.clearUsers();
    };
    await clearAll();
    await test("getUser()", "Return the correct user", async () => {
        const user = new User();
        await db.insertUser(user.getSchema());
        const returnedUser = await adapter.getUser(user.id);
        const nonNullReturnedUser = validate.isNotNull(
            returnedUser,
            "Target was not returned"
        );
        validate.isTrue(
            user.validateSchema(nonNullReturnedUser),
            "Target was not the expected value",
            user.getSchema(),
            nonNullReturnedUser
        );
        await clearAll();
    });
    await test("getUser()", "Return null if user id is invalid", async () => {
        const user = await adapter.getUser(INVALID_INPUT);
        validate.isNull(user, "Returned data was not null");
        await clearAll();
    });
    await test("getUserByProviderId()", "Return the correct user", async () => {
        const user = new User();
        await db.insertUser(user.getSchema());
        const returnedUser = await adapter.getUserByProviderId(user.providerId);
        validate.isNotNull(returnedUser, "Target was not returned");
        validate.isTrue(
            user.validateSchema(returnedUser as UserSchema),
            "Target was not the expected value",
            user.getSchema(),
            returnedUser
        );
        await clearAll();
    });
    await test(
        "getUserByProviderId()",
        "Return null if user id is invalid",
        async () => {
            const user = await adapter.getUserByProviderId(INVALID_INPUT);
            validate.isNull(user, "Null was not returned");
            await clearAll();
        }
    );
    await test(
        "getSessionAndUserBySessionId()",
        "Return the correct user and session",
        async () => {
            if (!adapter.getSessionAndUserBySessionId) return;
            const user = new User();
            const session = user.createSession();
            await db.insertUser(user.getSchema());
            await db.insertSession(session.getSchema());
            const returnedData = await adapter.getSessionAndUserBySessionId(
                session.id
            );
            validate.isNotNull(returnedData, "Target was not returned");
            validate.isTrue(
                user.validateSchema(returnedData?.user as UserSchema),
                "Target (user) was not the expected value",
                user.getSchema(),
                returnedData?.user
            );
            validate.isTrue(
                session.validateSchema(returnedData?.session as SessionSchema),
                "Target (session) was not the expected value",
                session.getSchema(),
                returnedData?.session
            );
            await clearAll();
        }
    );
    await test(
        "getSessionAndUserBySessionId()",
        "Return null if session id is invalid",
        async () => {
            if (!adapter.getSessionAndUserBySessionId) return;
            const user = await adapter.getSessionAndUserBySessionId(
                INVALID_INPUT
            );
            validate.isNull(user, "Null was not returned");
            await clearAll();
        }
    );
    await test("getSession()", "Return the correct session", async () => {
        const user = new User();
        const session = user.createSession();
        await db.insertUser(user.getSchema());
        await db.insertSession(session.getSchema());
        let returnedSession = await adapter.getSession(session.id);
        returnedSession = validate.isNotNull(
            returnedSession,
            "Target was not returned"
        );
        validate.isTrue(
            session.validateSchema(returnedSession),
            "Target is not the expected value",
            session.getSchema(),
            returnedSession
        );
        await clearAll();
    });
    await test(
        "getSession()",
        "Return null if session id is invalid",
        async () => {
            const session = await adapter.getSession(INVALID_INPUT);
            validate.isNull(session, "Target was not returned");
            await clearAll();
        }
    );
    await test(
        "getSessionsByUserId()",
        "Return the correct session",
        async () => {
            const user = new User();
            const session = user.createSession();
            await db.insertUser(user.getSchema());
            await db.insertSession(session.getSchema());
            const sessions = await adapter.getSessionsByUserId(session.userId);
            validate.includesSomeItem(
                sessions,
                session.validateSchema,
                "Target is not included in the returned value",
                session.getSchema()
            );
            await clearAll();
        }
    );
    await test(
        "getSessionsByUserId()",
        "Returns an empty array if no sessions exist",
        async () => {
            const sessions = await adapter.getSessionsByUserId(INVALID_INPUT);
            validate.isEqual(sessions.length, 0, "Target was not returned");
        }
    );
    await test("setUser()", "Insert a user into user table", async () => {
        const user = new User();
        await adapter.setUser(user.id, {
            providerId: user.providerId,
            hashedPassword: user.hashedPassword,
            attributes: {
                username: user.username,
            },
        });
        const users = await db.getUsers();
        validate.includesSomeItem(
            users,
            user.validateSchema,
            "Target does not exist in user table",
            user.getSchema()
        );
        await clearAll();
    });
    await test(
        "setUser()",
        "Insert a user into table user with a null password",
        async () => {
            const user = new User(true);
            await adapter.setUser(user.id, {
                providerId: user.providerId,
                hashedPassword: user.hashedPassword,
                attributes: {
                    username: user.username,
                },
            });
            const users = await db.getUsers();
            validate.includesSomeItem(
                users,
                user.validateSchema,
                "Target does not exist in user table",
                user.getSchema()
            );
            await clearAll();
        }
    );
    await test("setUser()", "Returns the created user", async () => {
        const user = new User();
        const createdUser = await adapter.setUser(user.id, {
            providerId: user.providerId,
            hashedPassword: user.hashedPassword,
            attributes: {
                username: user.username,
            },
        });
        validate.isTrue(
            user.validateSchema(createdUser),
            "Expected value was not returned",
            createdUser,
            user.getSchema()
        );
        await clearAll();
    });
    await test("deleteUser()", "Delete a user from user table", async () => {
        const user1 = new User();
        const user2 = new User();
        await db.insertUser(user1.getSchema());
        await db.insertUser(user2.getSchema());
        await adapter.deleteUser(user1.id);
        const users = await db.getUsers();
        validate.notIncludesSomeItem(
            users,
            user1.validateSchema,
            "Target does not exist in user table",
            user1.getSchema()
        );
        validate.includesSomeItem(
            users,
            user2.validateSchema,
            "Non-target was deleted from user table",
            user2.getSchema()
        );
        await clearAll();
    });
    await test("updateUser()", "Update a user's provider id", async () => {
        const user = new User();
        await db.insertUser(user.getSchema());
        await adapter.updateUser(user.id, {
            providerId: "update:" + user.username,
        });
        user.update({
            provider_id: "update:" + user.username,
        });
        const users = await db.getUsers();
        validate.includesSomeItem(
            users,
            user.validateSchema,
            "Target was not updated",
            user.getSchema()
        );
        await clearAll();
    });
    await test("updateUser()", "Update a user's hashed password", async () => {
        const user = new User();
        await db.insertUser(user.getSchema());
        await adapter.updateUser(user.id, {
            hashedPassword: "NEW_HASHED",
        });
        user.update({
            hashed_password: "NEW_HASHED",
        });
        const users = await db.getUsers();
        validate.includesSomeItem(
            users,
            user.validateSchema,
            "Target was not updated",
            user.getSchema()
        );
        await clearAll();
    });
    await test(
        "updateUser()",
        "Update user's hashed password to null",
        async () => {
            const user = new User();
            await db.insertUser(user.getSchema());
            await adapter.updateUser(user.id, {
                hashedPassword: null,
            });
            user.update({
                hashed_password: null,
            });
            const users = await db.getUsers();
            validate.includesSomeItem(
                users,
                user.validateSchema,
                "Target was not updated",
                user.getSchema()
            );
            await clearAll();
        }
    );
    await test("updateUser()", "Update user's user data", async () => {
        const user = new User();
        await db.insertUser(user.getSchema());
        const newUsername = new User().username;
        await adapter.updateUser(user.id, {
            attributes: {
                username: newUsername,
            },
        });
        user.update({
            username: newUsername,
        });
        const users = await db.getUsers();
        validate.includesSomeItem(
            users,
            user.validateSchema,
            "Target was not updated",
            user.getSchema()
        );
        await clearAll();
    });
    await clearAll();
    if (!endProcess) return
    end();
};
