import type { SessionSchema, UserSchema, Adapter } from "lucia-auth/types";
import { test, end, validate } from "./../test.js";
import { User } from "./../db.js";
import { Database } from "../index.js";
import { testUserAdapter } from "./user.js";
import { testSessionAdapter } from "./session.js";

const INVALID_INPUT = "INVALID_INPUT";

export const testAdapter = async (adapter: Adapter, db: Database, endProcess = true) => {
	const clearAll = async () => {
		await db.clearSessions();
		await db.clearUsers();
	};
	await clearAll();
	await testUserAdapter(adapter, db, false);
	await testSessionAdapter(adapter, db, false);
	await test("getSessionAndUserBySessionId()", "Return the correct user and session", async () => {
		if (!adapter.getSessionAndUserBySessionId) return;
		const user = new User();
		const session = user.createSession();
		await db.insertUser(user.getSchema());
		await db.insertSession(session.getSchema());
		const returnedData = await adapter.getSessionAndUserBySessionId(session.id);
		validate.isNotNull(returnedData, "Target was not returned");
		validate.isTrue(
			user.validateSchema(returnedData?.user as UserSchema),
			"Target (user) was not the expected value",
			user.getSchema(),
			returnedData?.user
		);
		validate.isTrue(
			session.validateSchema(returnedData?.session as SessionSchema),
			"Target (session) was not the expected value",
			session.getSchema(),
			returnedData?.session
		);
		await clearAll();
	});
	await test("getSessionAndUserBySessionId()", "Return null if session id is invalid", async () => {
		if (!adapter.getSessionAndUserBySessionId) return;
		const user = await adapter.getSessionAndUserBySessionId(INVALID_INPUT);
		validate.isNull(user, "Null was not returned");
		await clearAll();
	});
	await clearAll();
	if (!endProcess) return;
	end();
};
