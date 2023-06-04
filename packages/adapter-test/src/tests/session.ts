import { LuciaError, SessionSchema, type SessionAdapter } from "lucia";
import { Database } from "../database.js";
import { test, describe } from "node:test";
import assert from "node:assert/strict";

export const testSessionAdapter = async (
	adapter: SessionAdapter,
	database: Database
) => {
	const Session = database.session();
	describe("getSession()", async () => {
		await test("Return the matching session", async () => {
			const session = database.generateSession(null);
			await Session.insert(session);
			const sessionResult = await adapter.getSession(session.id);
			assert.deepStrictEqual(sessionResult, session);
		});
		await test("Return null if session id is invalid", async () => {
			const session = await adapter.getSession("*");
			assert.deepStrictEqual(session, null);
		});
	});
	describe("getSessionsByUserId()", () => {
		test("Return sessions with target user id", async () => {
			const user1 = database.generateUser();
			const user2 = database.generateUser();
			const session1 = database.generateSession(user1.id);
			const session2 = database.generateSession(user2.id);
			await Session.insert(session1);
			await Session.insert(session2);
			const result = await adapter.getSessionsByUserId(user1.id);
			assert.deepStrictEqual(result, [session1]);
		});
		test("Returns an empty array if no sessions exist", async () => {
			const result = await adapter.getSessionsByUserId("*");
			assert.deepStrictEqual(result, []);
		});
	});
	describe("setSession()", () => {
		test("Insert session into session table", async () => {
			const session = database.generateSession(null);
			await adapter.setSession(session);
			const storedSession = await Session.get(session.id);
			assert.deepStrictEqual(storedSession, session);
		});
		test("Optionally throw AUTH_INVALID_USER_ID if user id doesn't exist", async () => {
			const session = database.generateSession(null);
			try {
				await adapter.setSession(session);
			} catch (e) {
				assert.deepStrictEqual(e, new LuciaError("AUTH_INVALID_USER_ID"));
			}
		});
	});
	describe("deleteSession()", () => {
		test("Delete session from session table", async () => {
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
	describe("deleteSessionsByUserId()", () => {
		test("Delete session by user id from session table", async () => {
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
	describe("updateSession()", () => {
		test("Update 'country' field of session", async () => {
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
		test("Return updated session or null", async () => {
			const session = database.generateSession(null);
			await Session.insert(session);
			const result = await adapter.updateSession(session.id, {
				country: "YY"
			});
			if (result) {
				const expectedSession = {
					...session,
					country: "YY"
				} satisfies SessionSchema;
				assert.deepStrictEqual(result, expectedSession);
			} else {
				assert.deepStrictEqual(result, null);
			}
		});
	});
};
