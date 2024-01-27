import { Adapter, DatabaseSession, DatabaseUser } from "lucia";
import { generateRandomString, alphabet } from "oslo/crypto";
import assert from "node:assert/strict";

export const databaseUser: DatabaseUser = {
	id: generateRandomString(15, alphabet("0-9", "a-z")),
	attributes: {
		username: generateRandomString(15, alphabet("0-9", "a-z"))
	}
};

export async function testAdapter(adapter: Adapter) {
	console.log(`\n\x1B[38;5;63;1m[start]  \x1B[0mRunning adapter tests\x1B[0m\n`);
	const databaseSession: DatabaseSession = {
		userId: databaseUser.id,
		id: generateRandomString(40, alphabet("0-9", "a-z")),
		// get random date with 0ms
		expiresAt: new Date(Math.floor(Date.now() / 1000) * 1000 + 10_000),
		attributes: {
			country: "us"
		}
	};

	await test("getSessionAndUser() returns [null, null] on invalid session id", async () => {
		const result = await adapter.getSessionAndUser(databaseSession.id);
		assert.deepStrictEqual(result, [null, null]);
	});

	await test("getUserSessions() returns empty array on invalid user id", async () => {
		const result = await adapter.getUserSessions(databaseUser.id);
		assert.deepStrictEqual(result, []);
	});

	await test("setSession() creates session and getSessionAndUser() returns created session and associated user", async () => {
		await adapter.setSession(databaseSession);
		const result = await adapter.getSessionAndUser(databaseSession.id);
		assert.deepStrictEqual(result, [databaseSession, databaseUser]);
	});

	await test("deleteSession() deletes session", async () => {
		await adapter.deleteSession(databaseSession.id);
		const result = await adapter.getUserSessions(databaseSession.userId);
		assert.deepStrictEqual(result, []);
	});

	await test("updateSessionExpiration() updates session", async () => {
		await adapter.setSession(databaseSession);
		databaseSession.expiresAt = new Date(databaseSession.expiresAt.getTime() + 10_000);
		await adapter.updateSessionExpiration(databaseSession.id, databaseSession.expiresAt);
		const result = await adapter.getSessionAndUser(databaseSession.id);
		assert.deepStrictEqual(result, [databaseSession, databaseUser]);
	});

	await test("deleteExpiredSessions() deletes all expired sessions", async () => {
		const expiredSession: DatabaseSession = {
			userId: databaseUser.id,
			id: generateRandomString(40, alphabet("0-9", "a-z")),
			expiresAt: new Date(Math.floor(Date.now() / 1000) * 1000 - 10_000),
			attributes: {
				country: "us"
			}
		};
		await adapter.setSession(expiredSession);
		await adapter.deleteExpiredSessions();
		const result = await adapter.getUserSessions(databaseSession.userId);
		assert.deepStrictEqual(result, [databaseSession]);
	});

	await test("deleteUserSessions() deletes all user sessions", async () => {
		await adapter.deleteUserSessions(databaseSession.userId);
		const result = await adapter.getUserSessions(databaseSession.userId);
		assert.deepStrictEqual(result, []);
	});

	console.log(`\n\x1B[32;1m[success]  \x1B[0mAdapter passed all tests\n`);
}

async function test(name: string, runTest: () => Promise<void>): Promise<void> {
	console.log(`\x1B[38;5;63;1m► \x1B[0m${name}\x1B[0m`);
	try {
		await runTest();
		console.log("  \x1B[32m✓ Passed\x1B[0m\n");
	} catch (error) {
		console.log("  \x1B[31m✓ Failed\x1B[0m\n");
		throw error;
	}
}
