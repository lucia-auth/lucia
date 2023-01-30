import type { LuciaError, UserAdapter } from "lucia-auth";
import { test, end, validate } from "../test.js";
import { User } from "../model.js";
import { Database } from "../index.js";

const INVALID_INPUT = "INVALID_INPUT";

export const testUserAdapter = async (
	adapter: UserAdapter,
	db: Database,
	endProcess = true
) => {
	const clearAll = async () => {
		await db.clearKeys();
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
	await test("setUser()", "Insert a user into user table", async () => {
		const user = new User();
		await adapter.setUser(user.id, {
			username: user.username
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
	await test("setUser()", "Returns the created user", async () => {
		const user = new User();
		const createdUser = await adapter.setUser(user.id, {
			username: user.username
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
			"Target was not deleted",
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
	await test("updateUserAttributes()", "Update user attributes", async () => {
		const user = new User();
		await db.insertUser(user.getSchema());
		const newUsername = new User().username;
		await adapter.updateUserAttributes(user.id, {
			username: newUsername
		});
		user.update({
			username: newUsername
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
		"updateUserAttributes()",
		"Throw AUTH_INVALID_USER_ID if user id is invalid",
		async () => {
			try {
				await adapter.updateUserAttributes(INVALID_INPUT, {
					username: ""
				});
				throw new Error("No error was thrown");
			} catch (e) {
				const error = e as LuciaError;
				validate.isEqual(
					error.message,
					"AUTH_INVALID_USER_ID",
					"Error message did not match"
				);
			}
			await clearAll();
		}
	);
	await test("getKey()", "Returns the correct key", async () => {
		const user = new User();
		const key = user.createKey(true, false);
		await db.insertUser(user.getSchema());
		await db.insertKey(key.getSchema());
		const returnedKey = await adapter.getKey(key.id);
		const nonNullReturnedKey = validate.isNotNull(
			returnedKey,
			"Target was not returned"
		);
		validate.isTrue(
			key.validateSchema(nonNullReturnedKey),
			"Target was not the expected value",
			user.getSchema(),
			nonNullReturnedKey
		);
		await clearAll();
	});
	await test(
		"setKey()",
		"Insert a new key with non-null password",
		async () => {
			const user = new User();
			const key = user.createKey(false, false);
			await db.insertUser(user.getSchema());
			const createdKey = await adapter.setKey(key.id, {
				userId: user.id,
				isPrimary: key.isPrimary,
				hashedPassword: key.hashedPassword
			});
			const keys = await db.getKeys();
			validate.includesSomeItem(
				keys,
				key.validateSchema,
				"Expected value was not created",
				createdKey,
				user.getSchema()
			);
			await clearAll();
		}
	);
	await test("setKey()", "Insert a new key with null password", async () => {
		const user = new User();
		const key = user.createKey(true, false);
		await db.insertUser(user.getSchema());
		const createdKey = await adapter.setKey(key.id, {
			userId: user.id,
			isPrimary: key.isPrimary,
			hashedPassword: key.hashedPassword
		});
		const keys = await db.getKeys();
		validate.includesSomeItem(
			keys,
			key.validateSchema,
			"Expected value was not created",
			createdKey,
			key.getSchema()
		);
		await clearAll();
	});
	await test("setKey()", "Insert a new primary key", async () => {
		const user = new User();
		const key = user.createKey(true, true);
		await db.insertUser(user.getSchema());
		const createdKey = await adapter.setKey(key.id, {
			userId: user.id,
			isPrimary: key.isPrimary,
			hashedPassword: key.hashedPassword
		});
		const keys = await db.getKeys();
		validate.includesSomeItem(
			keys,
			key.validateSchema,
			"Expected value was not created",
			createdKey,
			key.getSchema()
		);
		await clearAll();
	});
	await test(
		"setKey()",
		"Throw AUTH_INVALID_USER_ID if user id is invalid",
		async () => {
			try {
				const user = new User();
				const key = user.createKey(false, false);
				await db.insertUser(user.getSchema());
				await adapter.setKey(key.id, {
					hashedPassword: key.hashedPassword,
					isPrimary: key.isPrimary,
					userId: INVALID_INPUT
				});
				throw new Error("No error was thrown");
			} catch (e) {
				const error = e as LuciaError;
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
		"setKey()",
		"Throw AUTH_DUPLICATE_KEY if key already exists",
		async () => {
			try {
				const user = new User();
				const key = user.createKey(false, false);
				await db.insertUser(user.getSchema());
				await db.insertKey(key.getSchema());
				await adapter.setKey(key.id, {
					hashedPassword: key.hashedPassword,
					isPrimary: key.isPrimary,
					userId: key.userId
				});
				throw new Error("No error was thrown");
			} catch (e) {
				const error = e as LuciaError;
				validate.isEqual(
					error.message,
					"AUTH_DUPLICATE_KEY",
					"Error message did not match"
				);
			}
			await clearAll();
		}
	);
	await test("getKeysByUserId()", "Returns the correct key", async () => {
		const user1 = new User();
		const user2 = new User();
		const key1 = user1.createKey(false, false);
		const key2 = user2.createKey(false, false);
		await db.insertUser(user1.getSchema());
		await db.insertUser(user2.getSchema());
		await db.insertKey(key1.getSchema());
		await db.insertKey(key2.getSchema());
		const sessions = await adapter.getKeysByUserId(key1.userId);
		validate.includesSomeItem(
			sessions,
			key1.validateSchema,
			"Target is not included in the returned value",
			key1.getSchema()
		);
		await clearAll();
	});
	await test(
		"getKeysByUserId()",
		"Returns an empty array if no sessions exist",
		async () => {
			const keys = await adapter.getKeysByUserId(INVALID_INPUT);
			validate.isEqual(keys.length, 0, "Target was not returned");
		}
	);
	await test("updateKeyPassword()", "Updates key password", async () => {
		const user = new User();
		const key = user.createKey(false, false);
		await db.insertUser(user.getSchema());
		await db.insertKey(key.getSchema());
		const UPDATED_PASSWORD = "UPDATED_PASSWORD";
		await adapter.updateKeyPassword(key.id, UPDATED_PASSWORD);
		key.updateHashedPassword(UPDATED_PASSWORD);
		const keys = await db.getKeys();
		validate.includesSomeItem(
			keys,
			key.validateSchema,
			"Target was not updated",
			key.getSchema()
		);
		await clearAll();
	});
	await test(
		"updateKeyPassword()",
		"Throw AUTH_INVALID_KEY if key is invalid",
		async () => {
			try {
				await adapter.updateKeyPassword(INVALID_INPUT, null);
				throw new Error("No error was thrown");
			} catch (e) {
				const error = e as LuciaError;
				validate.isEqual(
					error.message,
					"AUTH_INVALID_KEY",
					"Error message did not match"
				);
			}
			await clearAll();
		}
	);
	await test("deleteNonPrimaryKey()", "Delete target key", async () => {
		const user = new User();
		const key1 = user.createKey(false, false);
		const key2 = user.createKey(false, false);
		await db.insertUser(user.getSchema());
		await db.insertKey(key1.getSchema());
		await db.insertKey(key2.getSchema());
		await adapter.deleteNonPrimaryKey(key1.id);
		const keys = await db.getKeys();
		validate.notIncludesSomeItem(
			keys,
			key1.validateSchema,
			"Target was not deleted",
			key1.getSchema()
		);
		validate.includesSomeItem(
			keys,
			key2.validateSchema,
			"Non-target was deleted",
			key2.getSchema()
		);
		await clearAll();
	});
	await test(
		"deleteNonPrimaryKey()",
		"Avoid deleting primary key",
		async () => {
			const user = new User();
			const key = user.createKey(false, true);
			await db.insertUser(user.getSchema());
			await db.insertKey(key.getSchema());
			await adapter.deleteNonPrimaryKey(key.id);
			const keys = await db.getKeys();
			validate.includesSomeItem(
				keys,
				key.validateSchema,
				"Non-target was deleted",
				key.getSchema()
			);
			await clearAll();
		}
	);
	await test("deleteKeysByUserId()", "Delete keys of target user", async () => {
		const user1 = new User();
		const user2 = new User();
		const key1 = user1.createKey(false, false);
		const key2 = user2.createKey(false, false);
		await db.insertUser(user1.getSchema());
		await db.insertUser(user2.getSchema());
		await db.insertKey(key1.getSchema());
		await db.insertKey(key2.getSchema());
		await adapter.deleteKeysByUserId(user1.id);
		const keys = await db.getKeys();
		validate.notIncludesSomeItem(
			keys,
			key1.validateSchema,
			"Target was not deleted",
			key1.getSchema()
		);
		validate.includesSomeItem(
			keys,
			key2.validateSchema,
			"Non-target was deleted",
			key2.getSchema()
		);
		await clearAll();
	});
	await test("deleteKeysByUserId()", "Delete primary keys", async () => {
		const user = new User();
		const key = user.createKey(false, true);
		await db.insertUser(user.getSchema());
		await db.insertKey(key.getSchema());
		await adapter.deleteKeysByUserId(user.id);
		const keys = await db.getKeys();
		validate.notIncludesSomeItem(
			keys,
			key.validateSchema,
			"Target was not deleted",
			key.getSchema()
		);
		await clearAll();
	});
	await clearAll();
	if (!endProcess) return;
	end();
};
