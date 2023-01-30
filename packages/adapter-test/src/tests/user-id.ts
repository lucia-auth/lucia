import type { Adapter } from "lucia-auth";
import { test, end, validate } from "./../test.js";
import { User } from "../model.js";
import { Database } from "./../index.js";

export const testAdapterUserIdGeneration = async (
	adapter: Adapter,
	db: Database,
	endProcess = true
) => {
	const clearAll = async () => {
		await db.clearSessions();
		await db.clearUsers();
	};
	await clearAll();
	await test(
		"setUser()",
		"Insert a user with a null user id into Users DB",
		async () => {
			const user = new User();
			const createdUser = await adapter.setUser(null, {
				username: user.username
			});
			user.update({
				id: createdUser.id
			});
			const users = await db.getUsers();
			validate.includesSomeItem(
				users,
				user.validateSchema,
				"Target does not exist in Users DB",
				user.getSchema()
			);
			await clearAll();
		}
	);
	await clearAll();
	if (!endProcess) return;
	end();
};
