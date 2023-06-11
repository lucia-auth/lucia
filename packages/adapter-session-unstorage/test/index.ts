import { testSessionAdapter, Database } from "@lucia-auth/adapter-test";
import { LuciaError } from "lucia";

import { createStorage } from "unstorage";

import {
	unstorageAdapter,
	DEFAULT_SESSION_PREFIX,
	DEFAULT_USER_SESSIONS_PREFIX,
	sAdd
} from "../src/unstorage.js";

import type { QueryHandler } from "@lucia-auth/adapter-test";
import type { SessionSchema } from "lucia";

const storage = createStorage(/* opts */);

const sessionKey = (sessionId: string) => {
	return [DEFAULT_SESSION_PREFIX, sessionId].join(":");
};
const userSessionsKey = (userId: string) => {
	return [DEFAULT_USER_SESSIONS_PREFIX, userId].join(":");
};

const adapter = unstorageAdapter(storage, "cloudflarKvBinding")(LuciaError);

const queryHandler: QueryHandler = {
	session: {
		get: async () => {
			const keys = await storage.getKeys(sessionKey(""));
			const sessionData = await Promise.all(
				keys.map((key) => storage.getItemRaw(key))
			);
			const sessions = sessionData
				.filter((val: string | null) => val !== null)
				.map((val: string) => JSON.parse(val)) as SessionSchema[];
			return sessions;
		},
		insert: async (session) => {
			await Promise.all([
				storage.setItem(sessionKey(session.id), JSON.stringify(session)),
				sAdd(storage, userSessionsKey(session.user_id), session.id)
			]);
		},
		clear: async () => {
			const keys = await storage.getKeys();
			await Promise.all(keys.map((key) => storage.removeItem(key)));
		}
	}
};

await testSessionAdapter(adapter, new Database(queryHandler));

process.exit(0);
