import { testSessionAdapter, Database } from "@lucia-auth/adapter-test";
import { LuciaError } from "lucia";

import { createStorage } from "unstorage";
import {
	unstorageAdapter,
	DEFAULT_SESSION_PREFIX,
	DEFAULT_USER_SESSIONS_PREFIX
} from "../src/unstorage.js";

import type { QueryHandler } from "@lucia-auth/adapter-test";
import type { SessionSchema } from "lucia";

const client = createStorage();

export const adapter = unstorageAdapter(client)(LuciaError);

export const queryHandler: QueryHandler = {
	session: {
		// Return all Sessions
		get: async () => {
			const sessionIds = await client.getKeys(DEFAULT_SESSION_PREFIX);
			return Promise.all(
				sessionIds.map((id) => client.getItem(id) as Promise<SessionSchema>)
			);
		},
		// Insert a session
		insert: async (session) => {
			await Promise.all([
				client.setItem(`${DEFAULT_SESSION_PREFIX}:${session.id}`, session),
				client.setItem(
					`${DEFAULT_USER_SESSIONS_PREFIX}:${session.user_id}:${
						session.id
					}${Date.now()}`,
					session.id
				)
			]);
		},
		// Clear all sessions and userSessions
		clear: async () => client.clear()
	}
};

await testSessionAdapter(adapter, new Database(queryHandler));

process.exit(0);
