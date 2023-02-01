import type { UserAdapter } from "lucia-auth";
import { test, end, INVALID_INPUT } from "../test.js";
import { Database, type LuciaQueryHandler } from "../database.js";
import { isNull, isEmptyArray, compareErrorMessage } from "../validate.js";

export const testUserAdapter = async (
	adapter: UserAdapter,
	queryHandler: LuciaQueryHandler,
	endProcess = true
) => {
	const database = new Database(queryHandler);
	const clearAll = database.clear;
	await clearAll();
	await test("getUser()", "Return the correct user", async () => {
		const user = database.user();
		await user.set();
		const returnedUser = await adapter.getUser(user.value.id);
		user.compare(returnedUser);
		await clearAll();
	});
	await test("getUser()", "Return null if user id is invalid", async () => {
		const user = await adapter.getUser(INVALID_INPUT);
		isNull(user);
		await clearAll();
	});
	await test(
		"setUser()",
		"Set to add user only and insert a user into user table",
		async () => {
			const user = database.user();
			await adapter.setUser(
				user.value.id,
				{ username: user.value.username },
				null
			);
			await user.exists();
			await clearAll();
		}
	);
	await test(
		"setUser()",
		"Set to add user only and return the created user",
		async () => {
			const user = database.user();
			const result = await adapter.setUser(
				user.value.id,
				{ username: user.value.username },
				null
			);
			user.compare(result);
			await clearAll();
		}
	);
	await test(
		"setUser()",
		"Set to add user and key, and insert a user into user table",
		async () => {
			const user = database.user();
			const key = user.key({
				isPrimary: true,
				hasPassword: true
			});
			await adapter.setUser(
				user.value.id,
				{ username: user.value.username },
				key.value
			);
			await user.exists();
			await clearAll();
		}
	);
	await test(
		"setUser()",
		"Set to add user and key, and return the created user",
		async () => {
			const user = database.user();
			const key = user.key({
				isPrimary: true,
				hasPassword: true
			});
			const result = await adapter.setUser(
				user.value.id,
				{ username: user.value.username },
				key.value
			);
			user.compare(result);
			await clearAll();
		}
	);
	await test(
		"setUser()",
		"Throw AUTH_DUPLICATE_KEY_ID and user not stored if key already exists",
		async () => {
			const refKey = database.user().key({
				isPrimary: false,
				hasPassword: true
			});
			await refKey.set();
			const user = database.user();
			const key = user.key({
				isPrimary: true,
				hasPassword: true
			});
			key.update({
				id: refKey.value.id
			});
			await compareErrorMessage(async () => {
				await adapter.setUser(
					user.value.id,
					{ username: user.value.username },
					key.value
				);
			}, "AUTH_DUPLICATE_KEY_ID");
			await user.notExits();
			await clearAll();
		}
	);
	await test("deleteUser()", "Delete a user from user table", async () => {
		const user1 = database.user();
		await user1.set();
		const user2 = database.user();
		await user2.set();
		await adapter.deleteUser(user1.value.id);
		await user1.notExits();
		await user2.exists();
		await clearAll();
	});
	await test("updateUserAttributes()", "Update user attributes", async () => {
		const user = database.user();
		await user.set();
		user.update({
			username: "user_UPDATED"
		});
		await adapter.updateUserAttributes(user.value.id, {
			username: user.value.username
		});
		await user.exists();
		await clearAll();
	});
	await test(
		"updateUserAttributes()",
		"Throw AUTH_INVALID_USER_ID if user id is invalid",
		async () => {
			await compareErrorMessage(async () => {
				await adapter.updateUserAttributes(INVALID_INPUT, {
					username: ""
				});
			}, "AUTH_INVALID_USER_ID");
			await clearAll();
		}
	);
	await test("getKey()", "Returns the correct key", async () => {
		const key = database.user().key({
			isPrimary: false,
			hasPassword: true
		});
		await key.set();
		const result = await adapter.getKey(key.value.id);
		key.compare(result);
		await clearAll();
	});
	await test("setKey()", "Insert a new key with password", async () => {
		const user = database.user();
		await user.set();
		const key = user.key({
			isPrimary: false,
			hasPassword: true
		});
		await adapter.setKey(key.value);
		await key.exists();
		await clearAll();
	});
	await test("setKey()", "Insert a new key with null password", async () => {
		const user = database.user();
		await user.set();
		const key = user.key({
			isPrimary: false,
			hasPassword: false
		});
		await adapter.setKey(key.value);
		await key.exists();
		await clearAll();
	});
	await test("setKey()", "Insert a new primary key", async () => {
		const user = database.user();
		await user.set();
		const key = user.key({
			isPrimary: true,
			hasPassword: false
		});
		await adapter.setKey(key.value);
		await key.exists();
		await clearAll();
	});
	await test(
		"setKey()",
		"Throw AUTH_INVALID_USER_ID if user id is invalid",
		async () => {
			const key = database.user().key({
				isPrimary: false,
				hasPassword: true
			});
			await compareErrorMessage(async () => {
				await adapter.setKey(key.value);
			}, "AUTH_INVALID_USER_ID");
			await clearAll();
		}
	);
	await test(
		"setKey()",
		"Throw AUTH_DUPLICATE_KEY_ID if key already exists",
		async () => {
			const key = database.user().key({
				isPrimary: false,
				hasPassword: true
			});
			await key.set();
			await compareErrorMessage(async () => {
				await adapter.setKey(key.value);
			}, "AUTH_DUPLICATE_KEY_ID");
			await clearAll();
		}
	);
	await test("getKeysByUserId()", "Returns the correct key", async () => {
		const key1 = database.user().key({
			isPrimary: false,
			hasPassword: true
		});
		const key2 = database.user().key({
			isPrimary: false,
			hasPassword: true
		});
		await key1.set();
		await key2.set();
		const sessions = await adapter.getKeysByUserId(key1.value.user_id);
		key1.find(sessions);
		await clearAll();
	});
	await test(
		"getKeysByUserId()",
		"Returns an empty array if no sessions exist",
		async () => {
			const keys = await adapter.getKeysByUserId(INVALID_INPUT);
			isEmptyArray(keys);
			await clearAll();
		}
	);
	await test("updateKeyPassword()", "Updates key password", async () => {
		const key = database.user().key({
			isPrimary: false,
			hasPassword: true
		});
		await key.set();
		key.update({
			hashed_password: "UPDATED_PASSWORD"
		});
		await adapter.updateKeyPassword(key.value.id, key.value.hashed_password);
		await key.exists();
		await clearAll();
	});
	await test(
		"updateKeyPassword()",
		"Throw AUTH_INVALID_KEY_ID if key is invalid",
		async () => {
			await compareErrorMessage(async () => {
				await adapter.updateKeyPassword(INVALID_INPUT, null);
			}, "AUTH_INVALID_KEY_ID");
			await clearAll();
		}
	);
	await test("deleteNonPrimaryKey()", "Delete target key", async () => {
		const key1 = database.user().key({
			isPrimary: false,
			hasPassword: true
		});
		await key1.set();
		const key2 = database.user().key({
			isPrimary: false,
			hasPassword: true
		});
		await key2.set();
		await adapter.deleteNonPrimaryKey(key1.value.id);
		await key1.notExits();
		await key2.exists();
		await clearAll();
	});
	await test(
		"deleteNonPrimaryKey()",
		"Avoid deleting primary key",
		async () => {
			const key = database.user().key({
				isPrimary: true,
				hasPassword: true
			});
			await key.set();
			await adapter.deleteNonPrimaryKey(key.value.id);
			await key.exists();
			await clearAll();
		}
	);
	await test("deleteKeysByUserId()", "Delete keys of target user", async () => {
		const key1 = database.user().key({
			isPrimary: false,
			hasPassword: false
		});
		const key2 = database.user().key({
			isPrimary: false,
			hasPassword: false
		});
		await key1.set();
		await key2.set();
		await adapter.deleteKeysByUserId(key1.value.user_id);
		await key1.notExits();
		await key2.exists();
		await clearAll();
	});
	await test("deleteKeysByUserId()", "Delete primary keys", async () => {
		const key = database.user().key({
			isPrimary: false,
			hasPassword: false
		});
		await key.set();
		await adapter.deleteKeysByUserId(key.value.user_id);
		await key.notExits();
		await clearAll();
	});
	await clearAll();
	if (endProcess) {
		end();
	}
};
