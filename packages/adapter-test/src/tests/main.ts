import type { SessionSchema, UserSchema } from "lucia-sveltekit/types";
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
        await db.insertUser(user.getDbSchema());
        const returnedUser = await adapter.getUserById(user.id);
        const nonNullReturnedUser = validate.isNotNull(
            returnedUser,
            "Target was not returned"
        );
        validate.isTrue(
            user.validateSchema(nonNullReturnedUser),
            "Target was not returned"
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
            await db.insertUser(user.getDbSchema());
            await db.insertRefreshToken(refreshToken.getDbSchema());
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
        await db.insertUser(user.getDbSchema());
        const returnedUser = await adapter.getUserByProviderId(user.providerId);
        validate.isNotNull(
            returnedUser,
            "Target was not returned"
        )
        validate.isTrue(
            user.validateSchema(returnedUser as UserSchema),
            "Target was not returned"
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
        await db.insertUser(user.getDbSchema());
        await db.insertSession(session.getDbSchema())
        const returnedUser = await adapter.getUserByAccessToken(session.accessToken);
        validate.isNotNull(
            returnedUser,
            "Target was not returned"
        )
        validate.isTrue(
            user.validateSchema(returnedUser as UserSchema),
            "Target was not returned"
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
            await db.insertUser(user.getDbSchema());
            await db.insertSession(session.getDbSchema());
            let returnedSession = await adapter.getSessionByAccessToken(
                session.accessToken
            );
            returnedSession = validate.isNotNull(
                session,
                "Target was not returned"
            ) as SessionSchema;
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
            await db.insertUser(user.getDbSchema());
            await db.insertSession(session.getDbSchema());
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
                userEmail: user.user_email,
            },
        });
        const users = await db.getUsers();
        validate.includesSomeItem(
            users,
            user.validateDbSchema,
            "Target does not exist in user table",
            user.getDbSchema()
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
                    userEmail: user.user_email,
                },
            });
            const users = await db.getUsers();
            validate.includesSomeItem(
                users,
                user.validateDbSchema,
                "Target does not exist in user table",
                user.getDbSchema()
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
                userEmail: user.user_email,
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
            await db.insertUser(user1.getDbSchema());
            try {
                await adapter.setUser(user2.id, {
                    providerId: user1.providerId,
                    hashedPassword: user2.hashedPassword,
                    userData: {
                        username: user2.username,
                        userEmail: user2.user_email,
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
            await db.insertUser(user1.getDbSchema());
            try {
                await adapter.setUser(user2.id, {
                    providerId: user2.providerId,
                    hashedPassword: user2.hashedPassword,
                    userData: {
                        username: user2.username,
                        userEmail: user1.user_email,
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
        await db.insertUser(user1.getDbSchema());
        await db.insertUser(user2.getDbSchema());
        await adapter.deleteUser(user1.id);
        const users = await db.getUsers();
        validate.notIncludesSomeItem(
            users,
            user1.validateDbSchema,
            "Target does not exist in user table",
            user1.getDbSchema()
        );
        validate.includesSomeItem(
            users,
            user2.validateDbSchema,
            "Non-target was deleted from user table",
            user2.getDbSchema()
        );
        await clearAll();
    });
    await test(
        "setSession()",
        "Insert a user's session into session table",
        async () => {
            const user = new User();
            const session = user.createSession();
            await db.insertUser(user.getDbSchema());
            await adapter.setSession(
                session.userId,
                session.accessToken,
                session.expires
            );
            const sessions = await db.getSessions();
            validate.includesSomeItem(
                sessions,
                session.validateDbSchema,
                "Non-target was deleted from user table",
                session.getDbSchema()
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
            await db.insertUser(user1.getDbSchema());
            await db.insertUser(user2.getDbSchema());
            await db.insertSession(user1Session.getDbSchema());
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
            await db.insertUser(user.getDbSchema());
            await db.insertSession(session.getDbSchema());
            await adapter.deleteSessionsByUserId(session.userId);
            const sessions = await db.getSessions();
            validate.notIncludesSomeItem(
                sessions,
                session.validateDbSchema,
                "Target was not deleted from user table",
                session.getDbSchema()
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
            await db.insertUser(user.getDbSchema());
            await db.insertSession(session.getDbSchema());
            await adapter.deleteSessionByAccessToken(session.accessToken);
            const sessions = await db.getSessions();
            validate.notIncludesSomeItem(
                sessions,
                session.validateDbSchema,
                "Target does not exist in user table",
                session.getDbSchema()
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
            await db.insertUser(user.getDbSchema());
            await adapter.setRefreshToken(
                refreshToken.refreshToken,
                refreshToken.userId
            );
            const refreshTokens = await db.getRefreshTokens();
            validate.includesSomeItem(
                refreshTokens,
                refreshToken.validateDbSchema,
                "Target was not inserted into refresh_token table",
                refreshToken.getDbSchema()
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
            await db.insertUser(user.getDbSchema());
            await db.insertRefreshToken(refreshToken1.getDbSchema());
            await db.insertRefreshToken(refreshToken2.getDbSchema());
            await adapter.deleteRefreshToken(refreshToken1.refreshToken);
            const refreshTokens = await db.getRefreshTokens();
            validate.notIncludesSomeItem(
                refreshTokens,
                refreshToken1.validateDbSchema,
                "Target was not deleted from refresh_token table",
                refreshToken2.getDbSchema()
            );
            validate.includesSomeItem(
                refreshTokens,
                refreshToken2.validateDbSchema,
                "Non-target was not deleted from refresh_token table",
                refreshToken2.getDbSchema()
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
            await db.insertUser(user1.getDbSchema());
            await db.insertUser(user2.getDbSchema());
            await db.insertRefreshToken(user1RefreshToken.getDbSchema());
            await db.insertRefreshToken(user2RefreshToken.getDbSchema());
            await adapter.deleteRefreshTokensByUserId(user1RefreshToken.userId);
            const refreshTokens = await db.getRefreshTokens();
            validate.notIncludesSomeItem(
                refreshTokens,
                user1RefreshToken.validateDbSchema,
                "Target was not deleted from refresh_token table",
                user1RefreshToken.getDbSchema()
            );
            validate.includesSomeItem(
                refreshTokens,
                user2RefreshToken.validateDbSchema,
                "Non-target was not deleted from refresh_token table",
                user2RefreshToken.getDbSchema()
            );
            await clearAll();
        }
    );
    await test("updateUser()", "Update a user's provider id", async () => {
        const user = new User();
        await db.insertUser(user.getDbSchema());
        await adapter.updateUser(user.id, {
            providerId: "update:" + user.user_email,
        });
        user.update({
            providerId: "update:" + user.user_email,
        });
        const users = await db.getUsers();
        validate.includesSomeItem(
            users,
            user.validateDbSchema,
            "Target was not updated",
            user.getDbSchema()
        );
        await clearAll();
    });
    await test("updateUser()", "Update a user's hashed password", async () => {
        const user = new User();
        await db.insertUser(user.getDbSchema());
        await adapter.updateUser(user.id, {
            hashedPassword: "NEW_HASHED",
        });
        user.update({
            hashedPassword: "NEW_HASHED",
        });
        const users = await db.getUsers();
        validate.includesSomeItem(
            users,
            user.validateDbSchema,
            "Target was not updated",
            user.getDbSchema()
        );
        await clearAll();
    });
    await test(
        "updateUser()",
        "Update user's hashed password to null",
        async () => {
            const user = new User();
            await db.insertUser(user.getDbSchema());
            await adapter.updateUser(user.id, {
                hashedPassword: null,
            });
            user.update({
                hashedPassword: null,
            });
            const users = await db.getUsers();
            validate.includesSomeItem(
                users,
                user.validateDbSchema,
                "Target was not updated",
                user.getDbSchema()
            );
            await clearAll();
        }
    );
    await test("updateUser()", "Update user's user data", async () => {
        const user = new User();
        await db.insertUser(user.getDbSchema());
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
            user.validateDbSchema,
            "Target was not updated",
            user.getDbSchema()
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
            await db.insertUser(user1.getDbSchema())
            await db.insertUser(user2.getDbSchema())
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
            await db.insertUser(user1.getDbSchema())
            await db.insertUser(user2.getDbSchema())
            try {
                await adapter.updateUser(user2.id, {
                    userData: {
                        userEmail: user1.user_email
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
