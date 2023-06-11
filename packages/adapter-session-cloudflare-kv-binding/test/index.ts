import { testSessionAdapter, Database } from "@lucia-auth/adapter-test";
import { LuciaError } from "lucia";

import { KVNamespace } from "@miniflare/kv";
import { MemoryStorage } from "@miniflare/storage-memory";

import {
	cloudflareKvBindingAdapter,
	DEFAULT_SESSION_PREFIX,
	DEFAULT_USER_SESSIONS_PREFIX,
	sAdd
} from "../src/cloudflare-kv-binding.js";

import type { QueryHandler } from "@lucia-auth/adapter-test";
import type { SessionSchema } from "lucia";

const ns = new KVNamespace(new MemoryStorage());

const sessionKey = (sessionId: string) => {
	return [DEFAULT_SESSION_PREFIX, sessionId].join(":");
};
const userSessionsKey = (userId: string) => {
	return [DEFAULT_USER_SESSIONS_PREFIX, userId].join(":");
};

const adapter = cloudflareKvBindingAdapter(ns)(LuciaError);

const queryHandler: QueryHandler = {
	session: {
		get: async () => {
			const list = await ns.list({ prefix: sessionKey("") });
			const sessionData = await Promise.all(
				list.keys.map(({ name }) => ns.get(name, { type: "json" }))
			);
			const sessions = sessionData.filter(
				(val: SessionSchema | null) => val !== null
			);
			return sessions;
		},
		insert: async (session) => {
			await Promise.all([
				ns.put(sessionKey(session.id), JSON.stringify(session)),
				sAdd(ns, userSessionsKey(session.user_id), session.id)
			]);
		},
		clear: async () => {
			const list = await ns.list();
			await Promise.all(list.keys.map(({ name }) => ns.delete(name)));
		}
	}
};

await testSessionAdapter(adapter, new Database(queryHandler));

process.exit(0);
