import type { UserAdapter, UserSchema } from "lucia-sveltekit/types";
import { test, end, validate } from "../test.js";
import { User } from "../db.js";
import { Database } from "../index.js";

const INVALID_INPUT = "INVALID_INPUT";

export const testUserAdapter = async (adapter: UserAdapter, db: Database, endProcess = true) => {
	const clearAll = async () => {
		await db.clearSessions();
		await db.clearUsers();
	};
	await clearAll();
	await test("getUser()", "Return the correct user", async () => {
		const user = new User();
		await db.insertUser(user.getSchema());
		const returnedUser = await adapter.getUser(user.id);
		const nonNullReturnedUser = validate.isNotNull(returnedUser, "Target was not returned");
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
	await test("getUserByProviderId()", "Return null if user id is invalid", async () => {
		const user = await adapter.getUserByProviderId(INVALID_INPUT);
		validate.isNull(user, "Null was not returned");
		await clearAll();
	});
	await test("setUser()", "Insert a user into user table", async () => {
		const user = new User();
		await adapter.setUser(user.id, {
			providerId: user.providerId,
			hashedPassword: user.hashedPassword,
			attributes: {
				username: user.username
			}
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
	await test("setUser()", "Insert a user into table user with a null password", async () => {
		const user = new User(true);
		await adapter.setUser(user.id, {
			providerId: user.providerId,
			hashedPassword: user.hashedPassword,
			attributes: {
				username: user.username
			}
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
			providerId: user.providerId,
			hashedPassword: user.hashedPassword,
			attributes: {
				username: user.username
			}
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
			providerId: "update:" + user.username
		});
		user.update({
			provider_id: "update:" + user.username
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
			hashedPassword: "NEW_HASHED"
		});
		user.update({
			hashed_password: "NEW_HASHED"
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
	await test("updateUser()", "Update user's hashed password to null", async () => {
		const user = new User();
		await db.insertUser(user.getSchema());
		await adapter.updateUser(user.id, {
			hashedPassword: null
		});
		user.update({
			hashed_password: null
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
	await test("updateUser()", "Update user's user data", async () => {
		const user = new User();
		await db.insertUser(user.getSchema());
		const newUsername = new User().username;
		await adapter.updateUser(user.id, {
			attributes: {
				username: newUsername
			}
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
		"setUser()",
		"Throw AUTH_DUPLICATE_PROVIDER_ID if provider id violates unique key",
		async () => {
			const user1 = new User();
			const user2 = new User();
			await db.insertUser(user1.getSchema());
			try {
				await adapter.setUser(user2.id, {
					providerId: user1.providerId,
					hashedPassword: user2.hashedPassword,
					attributes: {
						username: user2.username
					}
				});
			} catch (e) {
				const error = e as Error;
				validate.isEqual(
					error.message,
					"AUTH_DUPLICATE_PROVIDER_ID",
					"Error message did not match"
				);
				await clearAll();
				return;
			}
			throw new Error("No error was thrown");
		}
	);
	await test("updateUser()", "Throw AUTH_INVALID_USER_ID if user id is invalid", async () => {
		try {
			await adapter.updateUser(INVALID_INPUT, {});
			throw new Error("No error was thrown");
		} catch (e) {
			const error = e as Error;
			validate.isEqual(error.message, "AUTH_INVALID_USER_ID", "Error message did not match");
		}
		await clearAll();
	});
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
	await clearAll();
	if (!endProcess) return;
	end();
};
