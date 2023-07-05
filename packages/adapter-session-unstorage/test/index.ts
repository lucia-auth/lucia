import { testSessionAdapter, Database } from "@lucia-auth/adapter-test";
import { LuciaError } from "lucia";
import { createStorage } from "unstorage";
import {
	unstorageAdapter,
	DEFAULT_SESSION_PREFIX,
	DEFAULT_USER_SESSION_PREFIX
} from "../src/unstorage.js";

import type { QueryHandler } from "@lucia-auth/adapter-test";
import type { SessionSchema } from "lucia";

const storage = createStorage();

export const adapter = unstorageAdapter(storage)(LuciaError);

export const queryHandler: QueryHandler = {
	session: {
		get: async () => {
			const sessionIds = await storage.getKeys(DEFAULT_SESSION_PREFIX);
			return Promise.all(
				sessionIds.map((id) => storage.getItem(id) as Promise<SessionSchema>)
			);
		},
		insert: async (session) => {
			await Promise.all([
				storage.setItem(`${DEFAULT_SESSION_PREFIX}:${session.id}`, session),
				storage.setItem(
					[DEFAULT_USER_SESSION_PREFIX, session.user_id, session.id].join(":"),
					""
				)
			]);
		},
		clear: async () => storage.clear()
	}
};

await testSessionAdapter(adapter, new Database(queryHandler));

process.exit(0);
