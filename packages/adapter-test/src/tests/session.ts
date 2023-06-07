import { start, finish, method, afterEach } from "../test.js";
import assert from "node:assert/strict";

import type { SessionSchema, SessionAdapter } from "lucia";
import type { Database } from "../database.js";

export const testSessionAdapter = async (
	adapter: SessionAdapter,
	database: Database
) => {
	const Session = database.session();

	afterEach(database.clear);

	start();

	await method("getSession()", async (test) => {
		await test("Returns target session", async () => {
			const session = database.generateSession(null);
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
			await Session.insert(session1);
			await Session.insert(session2);
			const result = await adapter.getSessionsByUserId(user1.id);
			assert.deepStrictEqual(result, [session1]);
		});
		await test("Returns an empty array if none matches target", async () => {
			const result = await adapter.getSessionsByUserId("*");
			assert.deepStrictEqual(result, []);
		});
	});

	await method("setSession()", async (test) => {
		await test("Inserts session", async () => {
			const session = database.generateSession(null);
			await adapter.setSession(session);
			const storedSession = await Session.get(session.id);
			assert.deepStrictEqual(storedSession, session);
		});
	});

	await method("deleteSession()", async (test) => {
		await test("Deletes target session", async () => {
			const user = database.generateUser();
			const session1 = database.generateSession(user.id);
			const session2 = database.generateSession(user.id);
			await Session.insert(session1);
			await Session.insert(session2);
			await adapter.deleteSession(session1.id);
			const storedSessions = await Session.getAll();
			assert.deepStrictEqual(storedSessions, [session2]);
		});
	});

	await method("deleteSessionsByUserId()", async (test) => {
		await test("Deletes sessions with target user id", async () => {
			const user1 = database.generateUser();
			const user2 = database.generateUser();
			const session1 = database.generateSession(user1.id);
			const session2 = database.generateSession(user2.id);
			await Session.insert(session1, session2);
			await adapter.deleteSessionsByUserId(user1.id);
			const storedSessions = await Session.getAll();
			assert.deepStrictEqual(storedSessions, [session2]);
		});
	});

	await method("updateSession()", async (test) => {
		await test("Updates session 'country' field", async () => {
			const session = database.generateSession(null);
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

	finish();
};
