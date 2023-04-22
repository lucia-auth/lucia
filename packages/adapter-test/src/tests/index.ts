import type { Adapter } from "lucia-auth";
import { test, end, INVALID_INPUT } from "./../test.js";
import { testUserAdapter } from "./user.js";
import { testSessionAdapter } from "./session.js";
import { Database, type LuciaQueryHandler } from "../database.js";
import { isNull } from "../validate.js";

export const testAdapter = async (
	adapter: Adapter,
	queryHandler: LuciaQueryHandler,
	endProcess = true
) => {
	const database = new Database(queryHandler);
	const clearAll = database.clear;
	await clearAll();
	await testUserAdapter(adapter, queryHandler, false);
	await testSessionAdapter(adapter, queryHandler, false);
	await test(
		"getSessionAndUserBySessionId()",
		"Return the correct user and session",
		async () => {
			if (!adapter.getSessionAndUserBySessionId) return;
			const user = database.user();
			const session = user.session();
			await session.commit(); // this will set user as well
			const result = await adapter.getSessionAndUserBySessionId(
				session.value.id
			);
			user.compare(result?.user);
			session.compare(result?.session);
			await clearAll();
		}
	);
	await test(
		"getSessionAndUserBySessionId()",
		"Return null if session id is invalid",
		async () => {
			if (!adapter.getSessionAndUserBySessionId) return;
			const result = await adapter.getSessionAndUserBySessionId(INVALID_INPUT);
			isNull(result);
			await clearAll();
		}
	);
	await clearAll();
	if (endProcess) {
		end();
	}
};
