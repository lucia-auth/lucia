import type {  UserSchema } from "lucia-sveltekit/types";
import type { Adapter } from "lucia-sveltekit/adapter"
import { test, end, validate } from "./../test.js";
import { User } from "./../db.js";
import { Database } from "../index.js";


const INVALID_INPUT = "INVALID_INPUT";

export const testAdapter = async (adapter: Adapter, db: Database) => {
    const clearAll = async () => {
        await Promise.all([db.clearSessions(), db.clearRefreshTokens()]);
        await db.clearUsers();
    };
    await clearAll();
    await test("getUserById()", "Return the correct user", async () => {
        const user = new User();
        await db.insertUser(user.getSchema());
        const returnedUser = await adapter.getUserById(user.id);
        const nonNullReturnedUser = validate.isNotNull(
            returnedUser,
            "Target was not returned"
        );
        validate.isTrue(
            user.validateSchema(nonNullReturnedUser),
            "Target was not the expected value"
        );
        await clearAll();
    });
    await test(
        "getUserById()",
        "Return null if user id is invalid",
        async () => {
            const user = await adapter.getUserById(INVALID_INPUT);
            validate.isNull(user, "Returned data was not null");
            await clearAll();
        }
    );
    await test(
        "getUserByRefreshToken()",
        "Return the correct user",
        async () => {
            const user = new User();
            const refreshToken = user.createRefreshToken();
            await db.insertUser(user.getSchema());
            await db.insertRefreshToken(refreshToken.getSchema());
            const userId = await adapter.getUserIdByRefreshToken(
                refreshToken.refreshToken
            );
            validate.isNotNull(userId, "Target was not returned");
            validate.isEqual(userId, user.id, "Target was not returned");
            await clearAll();
        }
    );
    await test(
        "getUserByRefreshToken()",
        "Return null if user id is invalid",
        async () => {
            const user = await adapter.getUserById(INVALID_INPUT);
            validate.isNull(user, "");
            await clearAll();
        }
    );
    await test("getUserByProviderId()", "Return the correct user", async () => {
        const user = new User();
        await db.insertUser(user.getSchema());
        const returnedUser = await adapter.getUserByProviderId(user.providerId);
        validate.isNotNull(
            returnedUser,
            "Target was not returned"
        )
        validate.isTrue(
            user.validateSchema(returnedUser as UserSchema),
            "Target was not the expected value"
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
    await test("getUserByAccessToken()", "Return the correct user", async () => {
        const user = new User();
        const session = user.createSession()
        await db.insertUser(user.getSchema());
        await db.insertSession(session.getSchema())
        const returnedUser = await adapter.getUserByAccessToken(session.accessToken);
        validate.isNotNull(
            returnedUser,
            "Target was not returned"
        )
        validate.isTrue(
            user.validateSchema(returnedUser as UserSchema),
            "Target was not the expected value",
            user.getSchema(),
            returnedUser
        );
        await clearAll();
    });
    await test(
        "getUserByAccessToken()",
        "Return null if access token is invalid",
        async () => {
            const user = await adapter.getUserByAccessToken(INVALID_INPUT);
            validate.isNull(user, "Null was not returned");
            await clearAll();
        }
    );
    await test(
        "getSessionByAccessToken()",
        "Return the correct session",
        async () => {
            const user = new User();
            const session = user.createSession();
            await db.insertUser(user.getSchema());
            await db.insertSession(session.getSchema());
            let returnedSession = await adapter.getSessionByAccessToken(
                session.accessToken
            );
            returnedSession = validate.isNotNull(
                returnedSession,
                "Target was not returned"
            );
            validate.isTrue(
                session.validateSchema(returnedSession),
                "Target is not the expected value"
            );
            await clearAll();
        }
    );
    await test(
        "getSessionByAccessToken()",
        "Return null if access token in invalid",
        async () => {
            const session = await adapter.getSessionByAccessToken(
                INVALID_INPUT
            );
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
            userData: {
                username: user.username,
                userEmail: user.userEmail,
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
                userData: {
                    username: user.username,
                    userEmail: user.userEmail,
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
    await test("setUser()", "Returns the created user id", async () => {
        const user = new User();
        const createdUserId = await adapter.setUser(user.id, {
            providerId: user.providerId,
            hashedPassword: user.hashedPassword,
            userData: {
                username: user.username,
                userEmail: user.userEmail,
            },
        });
        validate.isNonEmptyString(createdUserId, "Returned value is not a non-empty string")
        await clearAll();
    });
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
                    userData: {
                        username: user2.username,
                        userEmail: user2.userEmail,
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
                    userData: {
                        username: user2.username,
                        userEmail: user1.userEmail,
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
    await test(
        "setSession()",
        "Insert a user's session into session table",
        async () => {
            const user = new User();
            const session = user.createSession();
            await db.insertUser(user.getSchema());
            await adapter.setSession(
                session.userId,
                session.accessToken,
                session.expires
            );
            const sessions = await db.getSessions();
            validate.includesSomeItem(
                sessions,
                session.validateSchema,
                "Non-target was deleted from user table",
                session.getSchema()
            );
            await clearAll();
        }
    );
    await test(
        "setSession()",
        "Throw AUTH_INVALID_USER_ID if user id doesn't exist",
        async () => {
            const session = new User().createSession();
            try {
                await adapter.setSession(
                    INVALID_INPUT,
                    session.accessToken,
                    session.expires
                );
                throw new Error("No error was thrown");
            } catch (e) {
                const error = e as Error;
                validate.isEqual(
                    error.message,
                    "AUTH_INVALID_USER_ID",
                    "Unexpected error message"
                );
            }
            await clearAll();
        }
    );
    await test(
        "setSession()",
        "Throw AUTH_DUPLICATE_ACCESS_TOKEN if access token is already in use",
        async () => {
            const user1 = new User();
            const user2 = new User();
            const user1Session = user1.createSession();
            const user2Session = user1.createSession();
            await db.insertUser(user1.getSchema());
            await db.insertUser(user2.getSchema());
            await db.insertSession(user1Session.getSchema());
            try {
                await adapter.setSession(
                    user2Session.userId,
                    user1Session.accessToken,
                    user2Session.expires
                );
                throw new Error("No error was thrown");
            } catch (e) {
                const error = e as Error;
                validate.isEqual(
                    error.message,
                    "AUTH_DUPLICATE_ACCESS_TOKEN",
                    "Unexpected error message"
                );
            }
            await clearAll();
        }
    );
    await test(
        "deleteSessionsByUserId()",
        "Delete a user's session from session table",
        async () => {
            const user = new User();
            const session = user.createSession();
            await db.insertUser(user.getSchema());
            await db.insertSession(session.getSchema());
            await adapter.deleteSessionsByUserId(session.userId);
            const sessions = await db.getSessions();
            validate.notIncludesSomeItem(
                sessions,
                session.validateSchema,
                "Target was not deleted from user table",
                session.getSchema()
            );
            await clearAll();
        }
    );
    await test(
        "deleteSessionByAccessToken(",
        "Delete a user's session from session table",
        async () => {
            const user = new User();
            const session = user.createSession();
            await db.insertUser(user.getSchema());
            await db.insertSession(session.getSchema());
            await adapter.deleteSessionByAccessToken(session.accessToken);
            const sessions = await db.getSessions();
            validate.notIncludesSomeItem(
                sessions,
                session.validateSchema,
                "Target does not exist in user table",
                session.getSchema()
            );
            await clearAll();
        }
    );
    await test(
        "setRefreshToken()",
        "Insert a user's refresh token into refresh_token table",
        async () => {
            const user = new User();
            const refreshToken = user.createRefreshToken();
            await db.insertUser(user.getSchema());
            await adapter.setRefreshToken(
                refreshToken.refreshToken,
                refreshToken.userId
            );
            const refreshTokens = await db.getRefreshTokens();
            validate.includesSomeItem(
                refreshTokens,
                refreshToken.validateSchema,
                "Target was not inserted into refresh_token table",
                refreshToken.getSchema()
            );
            await clearAll();
        }
    );
    await test(
        "deleteRefreshToken()",
        "Delete a token from refresh_token table",
        async () => {
            const user = new User();
            const refreshToken1 = user.createRefreshToken();
            const refreshToken2 = user.createRefreshToken();
            await db.insertUser(user.getSchema());
            await db.insertRefreshToken(refreshToken1.getSchema());
            await db.insertRefreshToken(refreshToken2.getSchema());
            await adapter.deleteRefreshToken(refreshToken1.refreshToken);
            const refreshTokens = await db.getRefreshTokens();
            validate.notIncludesSomeItem(
                refreshTokens,
                refreshToken1.validateSchema,
                "Target was not deleted from refresh_token table",
                refreshToken2.getSchema()
            );
            validate.includesSomeItem(
                refreshTokens,
                refreshToken2.validateSchema,
                "Non-target was not deleted from refresh_token table",
                refreshToken2.getSchema()
            );
            await clearAll();
        }
    );
    await test(
        "deleteUserRefreshTokens()",
        "Delete a user's refresh tokens",
        async () => {
            const user1 = new User();
            const user2 = new User();
            const user1RefreshToken = user1.createRefreshToken();
            const user2RefreshToken = user2.createRefreshToken();
            await db.insertUser(user1.getSchema());
            await db.insertUser(user2.getSchema());
            await db.insertRefreshToken(user1RefreshToken.getSchema());
            await db.insertRefreshToken(user2RefreshToken.getSchema());
            await adapter.deleteRefreshTokensByUserId(user1RefreshToken.userId);
            const refreshTokens = await db.getRefreshTokens();
            validate.notIncludesSomeItem(
                refreshTokens,
                user1RefreshToken.validateSchema,
                "Target was not deleted from refresh_token table",
                user1RefreshToken.getSchema()
            );
            validate.includesSomeItem(
                refreshTokens,
                user2RefreshToken.validateSchema,
                "Non-target was not deleted from refresh_token table",
                user2RefreshToken.getSchema()
            );
            await clearAll();
        }
    );
    await test("updateUser()", "Update a user's provider id", async () => {
        const user = new User();
        await db.insertUser(user.getSchema());
        await adapter.updateUser(user.id, {
            providerId: "update:" + user.userEmail,
        });
        user.update({
            provider_id: "update:" + user.userEmail,
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
            userData: {
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
            const user1 = new User()
            const user2 = new User()
            await db.insertUser(user1.getSchema())
            await db.insertUser(user2.getSchema())
            try {
                await adapter.updateUser(user2.id, {
                    providerId: user1.providerId
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
            const user1 = new User()
            const user2 = new User()
            await db.insertUser(user1.getSchema())
            await db.insertUser(user2.getSchema())
            try {
                await adapter.updateUser(user2.id, {
                    userData: {
                        userEmail: user1.userEmail
                    }
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
    await clearAll()
    end();
};
