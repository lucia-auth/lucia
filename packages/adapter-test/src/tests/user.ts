import { LuciaError, type UserAdapter } from "lucia-auth";
import { test, end, INVALID_INPUT } from "../test.js";
import { Database, type LuciaQueryHandler } from "../database.js";
import {
	isNull,
	isEmptyArray,
	expectErrorMessage,
	expectError
} from "../validate.js";

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
		await user.commit();
		const returnedUser = await adapter.getUser(user.value.id);
		user.compare(returnedUser);
		await clearAll();
	});
	await test("getUser()", "Return null if user id is invalid", async () => {
		const result = await adapter.getUser(INVALID_INPUT);
		isNull(result);
		await clearAll();
	});
	await test("setUser()", "Insert user", async () => {
		const user = database.user();
		await adapter.setUser(
			user.value.id,
			{ username: user.value.username },
			null
		);
		await user.exists();
		await clearAll();
	});
	await test(
		"setUser()",
		"Insert user - Return the created user or void",
		async () => {
			const user = database.user();
			const result = await adapter.setUser(
				user.value.id,
				{ username: user.value.username },
				null
			);
			if (result !== undefined) {
				user.compare(result);
			}
			await clearAll();
		}
	);
	await test("setUser()", "Insert user and persistent key", async () => {
		const user = database.user();
		const key = user.key({
			primary: true,
			passwordDefined: true,
			oneTime: false
		});
		await adapter.setUser(
			user.value.id,
			{ username: user.value.username },
			key.value
		);
		await user.exists();
		await clearAll();
	});
	await test(
		"setUser()",
		"Insert user and persistent key - Return created user or void",
		async () => {
			const user = database.user();
			const key = user.key({
				primary: true,
				passwordDefined: true,
				oneTime: false
			});
			const result = await adapter.setUser(
				user.value.id,
				{ username: user.value.username },
				key.value
			);
			if (result !== undefined) {
				user.compare(result);
			}
			await clearAll();
		}
	);
	await test(
		"setUser()",
		"Throw AUTH_DUPLICATE_KEY_ID if key already exists",
		async () => {
			const refKey = database.user().key({
				primary: false,
				passwordDefined: true,
				oneTime: false
			});
			await refKey.commit();
			const user = database.user();
			const key = user.key({
				primary: true,
				passwordDefined: true,
				oneTime: false
			});
			key.update({
				id: refKey.value.id
			});
			await expectErrorMessage(async () => {
				await adapter.setUser(
					user.value.id,
					{ username: user.value.username },
					key.value
				);
			}, "AUTH_DUPLICATE_KEY_ID");
			await clearAll();
		}
	);
	await test("setUser()", "User not stored if key insert errors", async () => {
		const refKey = database.user().key({
			primary: false,
			passwordDefined: true,
			oneTime: false
		});
		await refKey.commit();
		const user = database.user();
		const key = user.key({
			primary: true,
			passwordDefined: true,
			oneTime: false
		});
		key.update({
			id: refKey.value.id
		});
		await expectError(async () => {
			await adapter.setUser(
				user.value.id,
				{ username: user.value.username },
				key.value
			);
		});
		await key.notExits();
		await clearAll();
	});
	await test("deleteUser()", "Delete a user from user table", async () => {
		const user1 = database.user();
		await user1.commit();
		const user2 = database.user();
		await user2.commit();
		await adapter.deleteUser(user1.value.id);
		await user1.notExits();
		await user2.exists();
		await clearAll();
	});
	await test("updateUserAttributes()", "Update user attributes", async () => {
		const user = database.user();
		await user.commit();
		user.update({
			username: "UPDATED"
		});
		await adapter.updateUserAttributes(user.value.id, {
			username: user.value.username
		});
		await user.exists();
		await clearAll();
	});
	await test(
		"updateUserAttributes()",
		"Returns updated user or void",
		async () => {
			const user = database.user();
			await user.commit();
			user.update({
				username: "UPDATED"
			});
			const returnedUser = await adapter.updateUserAttributes(user.value.id, {
				username: user.value.username
			});
			if (returnedUser !== undefined) {
				user.compare(returnedUser);
			}
			await clearAll();
		}
	);
	await test(
		"updateUserAttributes()",
		"Throw INVALID_USER_ID or return void if user id is invalid",
		async () => {
			const user = database.user();
			await user.commit();
			expectErrorMessage(async () => {
				const returnedUser = await adapter.updateUserAttributes(INVALID_INPUT, {
					username: user.value.username
				});
				if (returnedUser === undefined) {
					throw new LuciaError("AUTH_INVALID_USER_ID");
				}
			}, "AUTH_INVALID_USER_ID");
			await clearAll();
		}
	);
	await test("getKey()", "Returns the correct persistent key", async () => {
		const key = database.user().key({
			primary: false,
			passwordDefined: true,
			oneTime: false
		});
		await key.commit();
		const result = await adapter.getKey(key.value.id, async () => false);
		key.compare(result);
		await clearAll();
	});
	await test("getKey()", "Returns the correct single use key", async () => {
		const key = database.user().key({
			primary: false,
			passwordDefined: true,
			oneTime: true
		});
		await key.commit();
		const result = await adapter.getKey(key.value.id, async () => false);
		key.compare(result);
		await clearAll();
	});
	await test("getKey()", "Return null if key id is invalid", async () => {
		const result = await adapter.getUser(INVALID_INPUT);
		isNull(result);
		await clearAll();
	});
	await test(
		"setKey()",
		"Insert a new persistent key with password",
		async () => {
			const user = database.user();
			await user.commit();
			const key = user.key({
				primary: false,
				passwordDefined: true,
				oneTime: false
			});
			await adapter.setKey(key.value);
			await key.exists();
			await clearAll();
		}
	);
	await test(
		"setKey()",
		"Insert a new persistent key with null password",
		async () => {
			const user = database.user();
			await user.commit();
			const key = user.key({
				primary: false,
				passwordDefined: false,
				oneTime: false
			});
			await adapter.setKey(key.value);
			await key.exists();
			await clearAll();
		}
	);
	await test(
		"setKey()",
		"Insert a new single use key with null password",
		async () => {
			const user = database.user();
			await user.commit();
			const key = user.key({
				primary: false,
				passwordDefined: false,
				oneTime: true
			});
			await adapter.setKey(key.value);
			await key.exists();
			await clearAll();
		}
	);
	await test("setKey()", "Insert a new primary persistent key", async () => {
		const user = database.user();
		await user.commit();
		const key = user.key({
			primary: true,
			passwordDefined: false,
			oneTime: false
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
				primary: false,
				passwordDefined: true,
				oneTime: false
			});
			await expectErrorMessage(async () => {
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
				primary: false,
				passwordDefined: true,
				oneTime: false
			});
			await key.commit();
			await expectErrorMessage(async () => {
				await adapter.setKey(key.value);
			}, "AUTH_DUPLICATE_KEY_ID");
			await clearAll();
		}
	);
	await test("getKeysByUserId()", "Returns the correct key", async () => {
		const key1 = database.user().key({
			primary: false,
			passwordDefined: true,
			oneTime: false
		});
		const key2 = database.user().key({
			primary: false,
			passwordDefined: true,
			oneTime: false
		});
		await key1.commit();
		await key2.commit();
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
			primary: false,
			passwordDefined: true,
			oneTime: false
		});
		await key.commit();
		key.update({
			hashed_password: "UPDATED"
		});
		await adapter.updateKeyPassword(key.value.id, key.value.hashed_password);
		await key.exists();
		await clearAll();
	});
	await test(
		"updateKeyPassword()",
		"Throw AUTH_INVALID_KEY_ID if key id is invalid",
		async () => {
			const key = database.user().key({
				primary: false,
				passwordDefined: true,
				oneTime: false
			});
			await key.commit();
			key.update({
				hashed_password: "UPDATED"
			});
			const returnedKey = await adapter.updateKeyPassword(
				key.value.id,
				key.value.hashed_password
			);
			if (returnedKey !== undefined) {
				key.compare(returnedKey);
			}
			await clearAll();
		}
	);
	await test(
		"updateKeyPassword()",
		"Throw AUTH_INVALID_KEY_ID or return void if key id is invalid",
		async () => {
			const key = database.user().key({
				primary: false,
				passwordDefined: true,
				oneTime: false
			});
			await key.commit();
			expectErrorMessage(async () => {
				const returnedKey = await adapter.updateKeyPassword(
					INVALID_INPUT,
					key.value.hashed_password
				);
				if (returnedKey === undefined) {
					throw new LuciaError("AUTH_INVALID_KEY_ID");
				}
			}, "AUTH_INVALID_KEY_ID");
			await clearAll();
		}
	);
	await test("deleteNonPrimaryKey()", "Delete target key", async () => {
		const key1 = database.user().key({
			primary: false,
			passwordDefined: true,
			oneTime: false
		});
		await key1.commit();
		const key2 = database.user().key({
			primary: false,
			passwordDefined: true,
			oneTime: false
		});
		await key2.commit();
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
				primary: true,
				passwordDefined: true,
				oneTime: false
			});
			await key.commit();
			await adapter.deleteNonPrimaryKey(key.value.id);
			await key.exists();
			await clearAll();
		}
	);
	await test("deleteKeysByUserId()", "Delete keys of target user", async () => {
		const key1 = database.user().key({
			primary: false,
			passwordDefined: false,
			oneTime: false
		});
		const key2 = database.user().key({
			primary: false,
			passwordDefined: false,
			oneTime: false
		});
		await key1.commit();
		await key2.commit();
		await adapter.deleteKeysByUserId(key1.value.user_id);
		await key1.notExits();
		await key2.exists();
		await clearAll();
	});
	await test("deleteKeysByUserId()", "Delete primary keys", async () => {
		const key = database.user().key({
			primary: false,
			passwordDefined: false,
			oneTime: false
		});
		await key.commit();
		await adapter.deleteKeysByUserId(key.value.user_id);
		await key.notExits();
		await clearAll();
	});
	await clearAll();
	if (endProcess) {
		end();
	}
};
