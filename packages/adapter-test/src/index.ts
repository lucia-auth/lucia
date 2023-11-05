import { Adapter, DatabaseSession, DatabaseUser } from "lucia";
import { generateRandomString, alphabet } from "oslo/random";
import { TimeSpan } from "oslo";
import assert from "node:assert/strict";

declare module "lucia" {
	interface Register {
		DatabaseUserAttributes: {
			username: string;
		};
		DatabaseSessionAttributes: {
			country: string;
		};
	}
}

export const databaseUser: DatabaseUser = {
	userId: generateRandomString(15, alphabet("0-9", "a-z")),
	attributes: {
		username: generateRandomString(15, alphabet("0-9", "a-z"))
	}
};

export async function testAdapter(adapter: Adapter) {
	console.log(
		`\n\x1B[38;5;63;1m[start] \x1B[0;2m Running adapter tests\x1B[0m\n`
	);
	const databaseSession: DatabaseSession = {
		userId: databaseUser.userId,
		sessionId: generateRandomString(40, alphabet("0-9", "a-z")),
		// get random date with 0ms
		expiresAt: new Date(new TimeSpan(30, "d").milliseconds()),
		attributes: {
			country: "us"
		}
	};
	const result1 = await adapter.getSessionAndUser(databaseSession.sessionId);
	testEquality(
		"getSessionAndUser() returns [null, null] on invalid session id",
		result1,
		[null, null]
	);

	const result2 = await adapter.getUserSessions(databaseUser.userId);
	testEquality(
		"getUserSessions() returns empty array on invalid user id",
		result2,
		[]
	);

	await adapter.setSession(databaseSession);
	const result3 = await adapter.getSessionAndUser(databaseSession.sessionId);
	testEquality(
		"setSession() creates session and getSessionAndUser() returns created session and associated user",
		result3,
		[databaseSession, databaseUser]
	);

	await adapter.deleteSession(databaseSession.sessionId);
	const result4 = await adapter.getUserSessions(databaseSession.userId);
	testEquality("deleteSession() deletes session", result4, []);

	await adapter.setSession(databaseSession);
	databaseSession.expiresAt = new Date(new TimeSpan(100, "d").milliseconds());
	await adapter.updateSession(databaseSession.sessionId, {
		expiresAt: databaseSession.expiresAt
	});
	const result5 = await adapter.getSessionAndUser(databaseSession.sessionId);
	testEquality("updateSession() updates session", result5, [
		databaseSession,
		databaseUser
	]);

	await adapter.deleteUserSessions(databaseSession.userId);
	const result6 = await adapter.getUserSessions(databaseSession.userId);
	testEquality("deleteUserSessions() deletes all user sessions", result6, []);

	console.log(
		`\n\x1B[32;1m[success] \x1B[0;2m Adapter passed all tests\x1B[0m\n`
	);
}

function testEquality(name: string, a: any, b: any) {
	try {
		assert.deepStrictEqual(a, b);
		console.log(`\x1B[32m✓ \x1B[0;2m${name}\x1B[0m`);
	} catch (error) {
		console.log(`\x1B[31m✗ \x1B[0;2m${name}\x1B[0m`);
		throw error;
	}
}
