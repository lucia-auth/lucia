import { LuciaError } from "lucia";
import assert from "node:assert/strict";
import { start, finish, method, afterEach } from "../test.js";

import type { Database } from "../database.js";
import type { Adapter, SessionSchema, KeySchema, UserSchema } from "lucia";

export const testAdapter = async (adapter: Adapter, database: Database) => {
	await database.clear();

	const User = database.user();
	const Session = database.session();
	const Key = database.key();

	afterEach(database.clear);

	start();

	await method("getUser()", async (test) => {
		await test("Returns target user", async () => {
			const user = database.generateUser();
			await User.insert(user);
			const result = await adapter.getUser(user.id);
			assert.deepStrictEqual(result, user);
		});
		await test("Returns null if invalid target user id", async () => {
			const user = database.generateUser();
			await User.insert(user);
			const result = await adapter.getUser("*");
			assert.deepStrictEqual(result, null);
		});
	});

	await method("setUser()", async (test) => {
		await test("Inserts user only", async () => {
			const user = database.generateUser();
			await adapter.setUser(user, null);
			const storedUser = await User.get(user.id);
			assert.deepStrictEqual(storedUser, user);
		});
		await test("Inserts user and key", async () => {
			const user = database.generateUser();
			const key = database.generateKey(user.id);
			await adapter.setUser(user, key);
			const storedUser = await User.get(user.id);
			const storedKey = await Key.get(key.id);
			assert.deepStrictEqual(storedUser, user);
			assert.deepStrictEqual(storedKey, key);
		});
		await test("Throws DUPLICATE_KEY_ID on duplicate key id", async () => {
			const user1 = database.generateUser();
			const key1 = database.generateKey(user1.id);
			await User.insert(user1);
			await Key.insert(key1);
			const user2 = database.generateUser();
			const key2 = database.generateKey(user2.id, {
				id: key1.id
			});
			await assert.rejects(async () => {
				await adapter.setUser(user2, key2);
			}, new LuciaError("AUTH_DUPLICATE_KEY_ID"));
		});

		await test("Does not insert key if errors", async () => {
			const user1 = database.generateUser();
			const key1 = database.generateKey(user1.id);
			await User.insert(user1);
			await Key.insert(key1);
			const user2 = database.generateUser();
			const key2 = database.generateKey(user2.id, {
				id: key1.id
			});
			await assert.rejects(async () => {
				await adapter.setUser(user2, key2);
			}, new LuciaError("AUTH_DUPLICATE_KEY_ID"));
			const storedUsers = await User.getAll();
			assert.deepStrictEqual(storedUsers, [user1]);
		});
	});

	await method("deleteUser()", async (test) => {
		await test("Deletes target user", async () => {
			const user1 = database.generateUser();
			const user2 = database.generateUser();
			await User.insert(user1, user2);
			await adapter.deleteUser(user2.id);
			const storedUsers = await User.getAll();
			assert.deepStrictEqual(storedUsers, [user1]);
		});
		await test("Does not throw on invalid user id", async () => {
			const user = database.generateUser();
			await adapter.deleteUser(user.id);
		});
	});

	await method("updateUser()", async (test) => {
		await test("Updates user 'username' field", async () => {
			const user = database.generateUser();
			await User.insert(user);
			await adapter.updateUser(user.id, {
				username: "Y"
			});
			const updatedUser = {
				...user,
				username: "Y"
			} satisfies UserSchema;
			const storedUser = await User.get(user.id);
			assert.deepStrictEqual(storedUser, updatedUser);
		});
	});

	await method("getKey()", async (test) => {
		await test("Returns target key", async () => {
			const user = database.generateUser();
			const key = database.generateKey(user.id);
			await User.insert(user);
			await Key.insert(key);
			const result = await adapter.getKey(key.id);
			assert.deepStrictEqual(result, key);
		});
		await test("Returns null if invalid target key id", async () => {
			const result = await adapter.getKey("*");
			assert.deepStrictEqual(result, null);
		});
	});

	await method("setKey()", async (test) => {
		await test("Inserts key", async () => {
			const user = database.generateUser();
			const key = database.generateKey(user.id);
			await User.insert(user);
			await adapter.setKey(key);
			const storedKey = await Key.get(key.id);
			assert.deepStrictEqual(storedKey, key);
		});
		await test("Throws AUTH_DUPLICATE_KEY_ID on duplicate key id", async () => {
			const user = database.generateUser();
			const key1 = database.generateKey(user.id);
			await User.insert(user);
			await adapter.setKey(key1);
			const key2 = database.generateKey(user.id, {
				id: key1.id
			});
			await assert.rejects(async () => {
				await adapter.setKey(key2);
			}, new LuciaError("AUTH_DUPLICATE_KEY_ID"));
		});
		await test("Optionally throws AUTH_INVALID_USER_ID on invalid user id", async () => {
			const key = database.generateKey(null);
			try {
				await adapter.setKey(key);
			} catch (e) {
				assert.deepStrictEqual(e, new LuciaError("AUTH_INVALID_USER_ID"));
			}
		});
	});

	await method("updateKey", async (test) => {
		await test("Updates key 'hashed_password' field", async () => {
			const user = database.generateUser();
			const key = database.generateKey(user.id);
			await User.insert(user);
			await Key.insert(key);
			await adapter.updateKey(key.id, {
				hashed_password: "HASHED"
			});
			const updatedKey = {
				...key,
				hashed_password: "HASHED"
			} satisfies KeySchema;
			const storedKey = await Key.get(key.id);
			assert.deepStrictEqual(storedKey, updatedKey);
		});
	});

	await method("getKeysByUserId()", async (test) => {
		await test("Returns keys with target user id", async () => {
			const user1 = database.generateUser();
			const user2 = database.generateUser();
			const key1 = database.generateKey(user1.id);
			const key2 = database.generateKey(user2.id);
			await User.insert(user1, user2);
			await Key.insert(key1, key2);
			const result = await adapter.getKeysByUserId(user1.id);
			assert.deepStrictEqual(result, [key1]);
		});
		await test("Returns an empty array if none matches target", async () => {
			const user = database.generateUser();
			const key = database.generateKey(user.id);
			await User.insert(user);
			await Key.insert(key);
			const result = await adapter.getKeysByUserId("*");
			assert.deepStrictEqual(result, []);
		});
	});

	await method("deleteKeysByUserId()", async (test) => {
		await test("Deletes keys with target user id", async () => {
			const user1 = database.generateUser();
			const user2 = database.generateUser();
			const key1 = database.generateKey(user1.id);
			const key2 = database.generateKey(user2.id);
			await User.insert(user1, user2);
			await Key.insert(key1, key2);
			await adapter.deleteKeysByUserId(user1.id);
			const storedKeys = await Key.getAll();
			assert.deepStrictEqual(storedKeys, [key2]);
		});
		await test("Does not throw on invalid user id", async () => {
			const user = database.generateUser();
			await adapter.deleteKeysByUserId(user.id);
		});
	});

	await method("deleteKey()", async (test) => {
		await test("Deletes target key", async () => {
			const user = database.generateUser();
			const key1 = database.generateKey(user.id);
			const key2 = database.generateKey(user.id);
			await User.insert(user);
			await Key.insert(key1);
			await Key.insert(key2);
			await adapter.deleteKey(key1.id);
			const storedKeys = await Key.getAll();
			assert.deepStrictEqual(storedKeys, [key2]);
		});
		await test("Does not throw on invalid key id", async () => {
			const user = database.generateUser();
			const key = database.generateKey(user.id);
			await adapter.deleteKey(key.id);
		});
	});

	await method("getSession()", async (test) => {
		await test("Returns target session", async () => {
			const user = database.generateUser();
			const session = database.generateSession(user.id);
			await User.insert(user);
			await Session.insert(session);
			const sessionResult = await adapter.getSession(session.id);
			assert.deepStrictEqual(sessionResult, session);
		});
		await test("Returns null if invalid target session id", async () => {
			const session = await adapter.getSession("*");
			assert.deepStrictEqual(session, null);
		});
	});

	await method("getSessionsByUserId()", async (test) => {
		await test("Return sessions with target user id", async () => {
			const user1 = database.generateUser();
			const user2 = database.generateUser();
			const session1 = database.generateSession(user1.id);
			const session2 = database.generateSession(user2.id);
			await User.insert(user1, user2);
			await Session.insert(session1, session2);
			const result = await adapter.getSessionsByUserId(user1.id);
			assert.deepStrictEqual(result, [session1]);
		});
		await test("Returns an empty array if none matches target", async () => {
			const user = database.generateUser();
			const session = database.generateSession(user.id);
			await User.insert(user);
			await Session.insert(session);
			const result = await adapter.getSessionsByUserId("*");
			assert.deepStrictEqual(result, []);
		});
	});

	await method("setSession()", async (test) => {
		await test("Inserts session", async () => {
			const user = database.generateUser();
			await User.insert(user);
			const session = database.generateSession(user.id);
			await adapter.setSession(session);
			const storedSession = await Session.get(session.id);
			assert.deepStrictEqual(storedSession, session);
		});
		await test("Optionally throws AUTH_INVALID_USER_ID on invalid user id", async () => {
			const session = database.generateSession(null);
			try {
				await adapter.setSession(session);
			} catch (e) {
				assert.deepStrictEqual(e, new LuciaError("AUTH_INVALID_USER_ID"));
			}
		});
	});

	await method("deleteSession()", async (test) => {
		await test("Deletes target session", async () => {
			const user = database.generateUser();
			const session1 = database.generateSession(user.id);
			const session2 = database.generateSession(user.id);
			await User.insert(user);
			await Session.insert(session1);
			await Session.insert(session2);
			await adapter.deleteSession(session1.id);
			const storedSessions = await Session.getAll();
			assert.deepStrictEqual(storedSessions, [session2]);
		});
		await test("Does not throw on invalid session id", async () => {
			const user = database.generateUser();
			const session = database.generateSession(user.id);
			await adapter.deleteSession(session.id);
		});
	});

	await method("deleteSessionsByUserId()", async (test) => {
		await test("Deletes sessions with target user id", async () => {
			const user1 = database.generateUser();
			const user2 = database.generateUser();
			const session1 = database.generateSession(user1.id);
			const session2 = database.generateSession(user2.id);
			await User.insert(user1, user2);
			await Session.insert(session1, session2);
			await adapter.deleteSessionsByUserId(user1.id);
			const storedSessions = await Session.getAll();
			assert.deepStrictEqual(storedSessions, [session2]);
		});
		await test("Does not throw on invalid user id", async () => {
			const user = database.generateUser();
			await adapter.deleteSessionsByUserId(user.id);
		});
	});

	await method("updateSession()", async (test) => {
		await test("Updates session 'country' field", async () => {
			const user = database.generateUser();
			const session = database.generateSession(user.id);
			await User.insert(user);
			await Session.insert(session);
			await adapter.updateSession(session.id, {
				country: "YY"
			});
			const expectedSession = {
				...session,
				country: "YY"
			} satisfies SessionSchema;
			const storedSession = await Session.get(expectedSession.id);
			assert.deepStrictEqual(storedSession, expectedSession);
		});
	});

	await method("getSessionAndUser()", async (test, skip) => {
		if (!adapter.getSessionAndUser) return skip();
		await test("Returns target session and user", async () => {
			if (!adapter.getSessionAndUser) return;
			const user = database.generateUser();
			const session = database.generateSession(user.id);
			await User.insert(user);
			await Session.insert(session);
			const [sessionResult, userResult] = await adapter.getSessionAndUser(
				session.id
			);
			assert.deepStrictEqual(sessionResult, session);
			assert.deepStrictEqual(userResult, user);
		});

		await test("Returns null, null if invalid target session id", async () => {
			if (!adapter.getSessionAndUser) return;
			const [sessionResult, userResult] = await adapter.getSessionAndUser("*");
			assert.deepStrictEqual(sessionResult, null);
			assert.deepStrictEqual(userResult, null);
		});
	});

	finish();
};
