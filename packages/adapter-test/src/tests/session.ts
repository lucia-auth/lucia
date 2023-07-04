import type { SessionAdapter } from "lucia-auth";
import { test, end } from "../test.js";
import { Database, type LuciaQueryHandler } from "../database.js";
import { expectErrorMessage, isEmptyArray, isNull } from "../validate.js";

const INVALID_INPUT = "INVALID_INPUT";

export const testSessionAdapter = async (
	adapter: SessionAdapter,
	queryHandler: LuciaQueryHandler,
	endProcess = true
) => {
	const database = new Database(queryHandler);
	const clearAll = database.clear;
	await test("getSession()", "Return the correct session", async () => {
		const session = database.user().session();
		await session.commit();
		const result = await adapter.getSession(session.value.id);
		session.compare(result);
		await clearAll();
	});
	await test(
		"getSession()",
		"Return null if session id is invalid",
		async () => {
			const session = await adapter.getSession(INVALID_INPUT);
			isNull(session);
			await clearAll();
		}
	);
	await test(
		"getSessionsByUserId()",
		"Return the correct session",
		async () => {
			const session1 = database.user().session();
			await session1.commit();
			const session2 = database.user().session();
			await session2.commit();
			const result = await adapter.getSessionsByUserId(session1.value.user_id);
			session1.find(result);
			await clearAll();
		}
	);
	await test(
		"getSessionsByUserId()",
		"Returns an empty array if no sessions exist",
		async () => {
			const result = await adapter.getSessionsByUserId(INVALID_INPUT);
			isEmptyArray(result);
			await clearAll();
		}
	);
	await test(
		"setSession()",
		"Insert a user's session into session table",
		async () => {
			const user = database.user();
			await user.commit();
			const session = user.session();
			await adapter.setSession(session.value);
			await session.exists();
			await clearAll();
		}
	);
	await test(
		"deleteSessionsByUserId()",
		"Delete a user's session from session table",
		async () => {
			const session1 = database.user().session();
			await session1.commit();
			const session2 = database.user().session();
			await session2.commit();
			await adapter.deleteSessionsByUserId(session1.value.user_id);
			await session1.notExits();
			await session2.exists();
			await clearAll();
		}
	);
	await test(
		"deleteSession()",
		"Delete a user's session from session table",
		async () => {
			const session1 = database.user().session();
			await session1.commit();
			const session2 = database.user().session();
			await session2.commit();
			await adapter.deleteSession(session1.value.id);
			await session1.notExits();
			await session2.exists();
			await clearAll();
		}
	);
	await test(
		"setSession()",
		"Throw AUTH_INVALID_USER_ID if user id doesn't exist",
		async () => {
			const session = database.user().session();
			await expectErrorMessage(async () => {
				await adapter.setSession(session.value);
			}, "AUTH_INVALID_USER_ID");
			await clearAll();
		}
	);
	await test(
		"setSession()",
		"Throw AUTH_DUPLICATE_SESSION_ID if session id is already in use",
		async () => {
			const session1 = database.user().session();
			await session1.commit();
			const user = database.user();
			await user.commit();
			const session2 = user.session();
			session2.update({
				id: session1.value.id
			});
			await expectErrorMessage(async () => {
				await adapter.setSession(session2.value);
			}, "AUTH_DUPLICATE_SESSION_ID");
			await clearAll();
		}
	);
	await clearAll();
	if (endProcess) {
		end();
	}
};
