import type { Adapter } from "lucia-sveltekit/types";
import clc from "cli-color";

const test = async (
    name: string,
    description: string,
    func: () => Promise<void>
) => {
    console.log(
        `\n${clc.bold.blue("[Test]")} ${clc.bold(name)} : ${description}`
    );
    try {
        await func();
        console.log(`${clc.green.bold("[Success]")} ${name}`);
    } catch (e) {
        const error = e as Error;
        console.error(`${clc.red("[Error]")} ${error.message}`);
        console.error(`${clc.bold.red("[Failed]")} ${name}`);
        throw new Error();
    }
};

const end = () => {
    console.log(`${clc.green.bold("Success!")} Completed all tests`);
    process.exit();
};

export interface UserSchema {
    id: string;
    identifier_token: string;
    hashed_password: string | null;
    username: string;
    email: string;
}

export interface RefreshTokenSchema {
    refresh_token: string;
    user_id: string;
}

export interface Database {
    getRefreshTokens: () => Promise<RefreshTokenSchema[]>;
    getUsers: () => Promise<UserSchema[]>;
    clearRefreshTokens: () => Promise<void>;
    clearUsers: () => Promise<void>;
    insertRefreshToken: (data: RefreshTokenSchema) => Promise<void>;
    insertUser: (data: UserSchema) => Promise<void>;
}

const testUser1: UserSchema = {
    id: "123456",
    identifier_token: "test:user1@example.com",
    hashed_password: "hashed_123456_1",
    username: "user1",
    email: "user1@example.com",
};

const testUser2: UserSchema = {
    id: "654321",
    identifier_token: "test:user2@example.com",
    hashed_password: null,
    username: "user2",
    email: "user2@example.com",
};

const testUser1_refreshToken1: RefreshTokenSchema = {
    refresh_token:
        "fZOXWInurbtx1gyiPwXoEzEEzIOj1ym4SokIjkUUMEh41sgROQbzWbUjS98n64VtUgEdYdFjpeWpt0iwVhWlfJtKRXDmWPN6kJXmjNkKII3RBwb1V7dDd5kTeFZNaytix4flJ7XhG8o3NIEhUojNdN1Vs1kwApCzJhayHGmUOg3YuDuWt4XWwPOmuw7rJeARgo2NJh1EORDc66xZBY7BlUVN6TGVvHMZyF5q8uLP7yykpWf0oLZNF73FwilmsxzP3pWG6z9000B1DaScrA1UXGjq",
    user_id: testUser1.id,
};

const testUser1_refreshToken2: RefreshTokenSchema = {
    refresh_token:
        "dqWwiORX2P4lOYsOwoHiNnPQA7Vq6l5QeQ2krVjsx3KZS67bAG83FCXf33ZxENCtI5uDCwaa3gORyLNOr4sREALo0qM8wh8sR1QSEU9bVqEghVQ55XGtN5xraEWvWGZrsmTv9ZL3pw4zszvEQ6lWyEnF8Ht7N60XL25HDbzJRW7LU3fq4VUF83KE6fC5MvH2GnVotpshYgEOxmbk77ouJiu8kcMTefyr9t1i8BT4YqrAFbikGQKPLFVuigvPLxsGRKKijW4KSqK4SsdarCrl5uGh",
    user_id: testUser1.id,
};

const testUser2_refreshToken1: RefreshTokenSchema = {
    refresh_token:
        "IV2p1BxTCHbyKbimgC5ZDDvyz3dcQOTKwQV4TU7s5dy4UrOmVkvbAplyGe1SIbTebd6gHAGjm6ObBLJ4Hroz3MDbEThE4pHYu1AWYmHXbaGYhvhd5Ah1SebiUj9T1YdIhUxC7NhmWb1LWwbnevrqTg83GvULwaHx5X5FlvzNx07RBFs6ffaWNNpME5PCvwzpfKr2MHbBLVT3VZb2Ve659nIib1gAhdxSKdydoOdBjkDRXnUa4NMOBZPdzEjX81oev0rUYwCYDhhqrfESKK0lrBwb",
    user_id: testUser2.id,
};

const isSameObj = (obj1: Record<string, any>, obj2: Record<string, any>) => {
    for (const keys in obj1) {
        if (obj1[keys] !== obj2[keys]) return false;
    }
    for (const keys in obj2) {
        if (obj2[keys] !== obj1[keys]) return false;
    }
    return true;
};

const invalidInput = "invalidinput";

const arrayIncludesObj = (target: Record<any, any>, arr: Record<any, any>[]) =>
    arr.some((val) => isSameObj(target, val));

const isTrueValidation = (result: boolean, error: string, ...log: any[]) => {
    if (result) return;
    console.log(...log);
    throw new Error(error);
};

const validate = {
    arrayIncludesObj: (
        target: Record<any, any>,
        db: Record<any, any>[],
        error: string
    ) => {
        return isTrueValidation(
            arrayIncludesObj(target, db),
            error,
            target,
            db
        );
    },
    arrayNotIncludesObj: (
        target: Record<any, any>,
        db: Record<any, any>[],
        error: string
    ) => {
        return isTrueValidation(
            !arrayIncludesObj(target, db),
            error,
            target,
            db
        );
    },
    isSameObj: (
        obj1: Record<string, any>,
        obj2: Record<string, any>,
        error: string
    ) => {
        return isTrueValidation(isSameObj(obj1, obj2), error, obj1, obj2);
    },
    isNotSameObj: (
        obj1: Record<string, any>,
        obj2: Record<string, any>,
        error: string
    ) => {
        return isTrueValidation(!isSameObj(obj1, obj2), error, obj1, obj2);
    },
    isNull: (target: any, error: string) => {
        return isTrueValidation(target === null, error, target);
    },
    isNotNull: (target: any, error: string) => {
        return isTrueValidation(target !== null, error, target);
    },
    isEqual: (
        p1: string | number | null | undefined,
        p2: string | number | null | undefined,
        error: string
    ) => {
        return isTrueValidation(p1 === p2, error, p1, p2);
    },
    isNotEqual: (
        p1: string | number | null | undefined,
        p2: string | number | null | undefined,
        error: string
    ) => {
        return isTrueValidation(p1 !== p2, error), p1, p2;
    },
};

export const testAdapter = async (adapter: Adapter, db: Database) => {
    await db.clearRefreshTokens();
    await db.clearUsers();
    await test("getUserById()", "Return the correct user", async () => {
        await db.insertUser(testUser1);
        const user = await adapter.getUserById(testUser1.id);
        validate.isNotNull(user, "Target was not returned");
        validate.isSameObj(user as any, testUser1, "Target was not returned");
        await db.clearUsers();
    });
    await test(
        "getUserById()",
        "Return null if user id is invalid",
        async () => {
            const user = await adapter.getUserById(invalidInput);
            validate.isNull(user, "Returned data was not null");
        }
    );
    await test(
        "getUserByRefreshToken()",
        "Return the correct user",
        async () => {
            await db.insertUser(testUser1);
            await db.insertRefreshToken(testUser1_refreshToken1);
            const user = await adapter.getUserByRefreshToken(
                testUser1_refreshToken1.refresh_token
            );
            validate.isNotNull(user, "Target was not returned");
            validate.isSameObj(
                user as any,
                testUser1,
                "Target was not returned"
            );
            await db.clearRefreshTokens();
            await db.clearUsers();
        }
    );
    await test(
        "getUserByRefreshToken()",
        "Return null if user id is invalid",
        async () => {
            const user = await adapter.getUserById(invalidInput);
            validate.isNull(user, "");
        }
    );
    await test(
        "getUserByIdentifierToken()",
        "Return the correct user",
        async () => {
            await db.insertUser(testUser1);
            const user = await adapter.getUserByIdentifierToken(
                testUser1.identifier_token
            );
            validate.isNotNull(user, "Target was not returned");
            validate.isSameObj(
                user as any,
                testUser1,
                "Target was not returned"
            );
            await db.clearRefreshTokens();
            await db.clearUsers();
        }
    );
    await test(
        "getUserByIdentifierToken()",
        "Return null if user id is invalid",
        async () => {
            const user = await adapter.getUserByIdentifierToken(invalidInput);
            validate.isNull(user, "Null was not returned");
        }
    );
    await test("setUser()", "Insert a user into Users DB", async () => {
        await adapter.setUser(testUser1.id, {
            identifier_token: testUser1.identifier_token,
            hashed_password: testUser1.hashed_password,
            user_data: {
                username: testUser1.username,
                email: testUser1.email,
            },
        });
        const users = await db.getUsers();
        validate.arrayIncludesObj(
            testUser1,
            users,
            "Target does not exist in Users DB"
        );
        await db.clearUsers();
    });
    await test(
        "setUser()",
        "Insert a user into Users DB with a null password",
        async () => {
            await adapter.setUser(testUser2.id, {
                identifier_token: testUser2.identifier_token,
                hashed_password: testUser2.hashed_password,
                user_data: {
                    username: testUser2.username,
                    email: testUser2.email,
                },
            });
            const users = await db.getUsers();
            validate.arrayIncludesObj(
                testUser2,
                users,
                "Target does not exist in Users DB"
            );
            await db.clearUsers();
        }
    );
    await test(
        "setUser()",
        "Throw AUTH_DUPLICATE_IDENTIFIER_TOKEN or AUTH_DUPLICATE_USER_DATA if identifier token violates unique key",
        async () => {
            await db.insertUser(testUser1);
            try {
                await adapter.setUser(testUser2.id, {
                    identifier_token: testUser1.identifier_token,
                    hashed_password: testUser2.hashed_password,
                    user_data: {
                        username: testUser2.username,
                        email: testUser2.email,
                    },
                });
            } catch (e) {
                const error = e as Error;
                try {
                    validate.isEqual(
                        error.message,
                        "AUTH_DUPLICATE_IDENTIFIER_TOKEN",
                        "Error message did not match"
                    );
                } catch {
                    validate.isEqual(
                        error.message,
                        "AUTH_DUPLICATE_USER_DATA",
                        "Error message did not match"
                    );
                }
                await db.clearUsers();
                return
            }
            throw new Error("No error was thrown");
        }
    );
    await test(
        "setUser()",
        "Throw AUTH_DUPLICATE_USER_DATA if user data violates unique key",
        async () => {
            await db.insertUser(testUser1);
            try {
                await adapter.setUser(testUser2.id, {
                    identifier_token: testUser2.identifier_token,
                    hashed_password: testUser2.hashed_password,
                    user_data: {
                        username: testUser2.username,
                        email: testUser1.email,
                    },
                });
            } catch (e) {
                const error = e as Error;
                validate.isEqual(
                    error.message,
                    "AUTH_DUPLICATE_USER_DATA",
                    "Error message did not match"
                );
                await db.clearUsers();
                return
            }
            throw new Error("No error was thrown");
        }
    );
    await test("deleteUser()", "Delete a user from Users DB", async () => {
        await db.insertUser(testUser1);
        await db.insertUser(testUser2);
        await adapter.deleteUser(testUser1.id);
        const users = await db.getUsers();
        validate.arrayNotIncludesObj(
            testUser1,
            users,
            "Target was not deleted from Users DB"
        );
        validate.arrayIncludesObj(
            testUser2,
            users,
            "Non-target was deleted from Users DB"
        );
        await db.clearUsers();
    });
    await test(
        "setRefreshToken()",
        "Insert a user's refresh token into Refresh_Token DB",
        async () => {
            await db.insertUser(testUser1);
            await adapter.setRefreshToken(
                testUser1_refreshToken1.refresh_token,
                testUser1_refreshToken1.user_id
            );
            const refreshTokens = await db.getRefreshTokens();
            validate.arrayIncludesObj(
                testUser1_refreshToken1,
                refreshTokens,
                "Target was not inserted into refresh_token DB"
            );
            await db.clearRefreshTokens();
            await db.clearUsers();
        }
    );
    await test(
        "deleteRefreshToken()",
        "Delete a token from Refresh_Token DB",
        async () => {
            await db.insertUser(testUser1);
            await db.insertRefreshToken(testUser1_refreshToken1);
            await db.insertRefreshToken(testUser1_refreshToken2);
            await adapter.deleteRefreshToken(
                testUser1_refreshToken1.refresh_token
            );
            const refreshTokens = await db.getRefreshTokens();
            validate.arrayNotIncludesObj(
                testUser1_refreshToken1,
                refreshTokens,
                "Target was not deleted from refresh_token DB"
            );
            validate.arrayIncludesObj(
                testUser1_refreshToken2,
                refreshTokens,
                "Non-target was not deleted from refresh_token DB"
            );
            await db.clearRefreshTokens();
            await db.clearUsers();
        }
    );
    await test(
        "deleteUserRefreshTokens()",
        "Delete a user's refresh tokens",
        async () => {
            await db.insertUser(testUser1);
            await db.insertUser(testUser2);
            await db.insertRefreshToken(testUser1_refreshToken1);
            await db.insertRefreshToken(testUser2_refreshToken1);
            await adapter.deleteUserRefreshTokens(
                testUser1_refreshToken1.user_id
            );
            const refreshTokens = await db.getRefreshTokens();
            validate.arrayNotIncludesObj(
                testUser1_refreshToken1,
                refreshTokens,
                "Target was not deleted from refresh_token DB"
            );
            validate.arrayIncludesObj(
                testUser2_refreshToken1,
                refreshTokens,
                "Non-target was not deleted from refresh_token DB"
            );
            await db.clearRefreshTokens();
            await db.clearUsers();
        }
    );
    await test("updateUser()", "Update a user's identifier token", async () => {
        await db.insertUser(testUser1);
        await adapter.updateUser(testUser1.id, {
            identifier_token: "update:" + testUser1.email,
        });
        const users = await db.getUsers();
        const updatedUser1: UserSchema = {
            id: testUser1.id,
            identifier_token: "update:" + testUser1.email,
            hashed_password: testUser1.hashed_password,
            username: testUser1.username,
            email: testUser1.email,
        };
        validate.arrayIncludesObj(
            updatedUser1,
            users,
            "Target was not updated"
        );
        await db.clearUsers();
    });
    await test("updateUser()", "Update a user's hashed password", async () => {
        await db.insertUser(testUser1);
        await adapter.updateUser(testUser1.id, {
            hashed_password: "hashed_123456_2",
        });
        const users = await db.getUsers();
        const updatedUser1: UserSchema = {
            id: testUser1.id,
            identifier_token: testUser1.identifier_token,
            hashed_password: "hashed_123456_2",
            username: testUser1.username,
            email: testUser1.email,
        };
        validate.arrayIncludesObj(
            updatedUser1,
            users,
            "Target was not updated"
        );
        await db.clearUsers();
    });
    await test(
        "updateUser()",
        "Update user's hashed password to null",
        async () => {
            await db.insertUser(testUser1);
            await adapter.updateUser(testUser1.id, {
                hashed_password: null,
            });
            const users = await db.getUsers();
            const updatedUser1: UserSchema = {
                id: testUser1.id,
                identifier_token: testUser1.identifier_token,
                hashed_password: null,
                username: testUser1.username,
                email: testUser1.email,
            };
            validate.arrayIncludesObj(
                updatedUser1,
                users,
                "Target was not updated"
            );
            await db.clearUsers();
        }
    );
    await test("updateUser()", "Update user's user data", async () => {
        await db.insertUser(testUser1);
        await adapter.updateUser(testUser1.id, {
            user_data: {
                username: "updatedUser1",
            },
        });
        const users = await db.getUsers();
        const updatedUser1: UserSchema = {
            id: testUser1.id,
            identifier_token: testUser1.identifier_token,
            hashed_password: testUser1.hashed_password,
            username: "updatedUser1",
            email: testUser1.email,
        };
        validate.arrayIncludesObj(
            updatedUser1,
            users,
            "Target was not updated"
        );
        await db.clearUsers();
    });
    await test(
        "updateUser()",
        "Throw AUTH_INVALID_USER_ID if user id is invalid",
        async () => {
            try {
                await adapter.updateUser(invalidInput, {});
                throw new Error("No error was thrown");
            } catch (e) {
                const error = e as Error;
                validate.isEqual(
                    error.message,
                    "AUTH_INVALID_USER_ID",
                    "Error message did not match"
                );
            }
        }
    );
    end();
};
