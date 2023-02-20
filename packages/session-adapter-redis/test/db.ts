import type { LuciaQueryHandler } from "@lucia-auth/adapter-test";
import type { SessionSchema } from "lucia-auth/types.js";

import { createClient } from "redis";
import redis from "../src/index.js";
import { LuciaError } from "lucia-auth";

const sessionInstance = createClient({
	socket: {
		port: 6379
	}
});

const userSessionInstance = createClient({
	socket: {
		port: 6380
	}
});

await sessionInstance.connect();
await userSessionInstance.connect();

export const adapter = redis({
	session: sessionInstance,
	userSession: userSessionInstance
})(LuciaError);

export const queryHandler: LuciaQueryHandler = {
	session: {
		get: async () => {
			const sessionIds = await sessionInstance.keys("*");
			const sessionData = await Promise.all(
				sessionIds.map((id) => sessionInstance.get(id))
			);
			const sessions = sessionData
				.filter((val): val is string => val !== null)
				.map((data) => JSON.parse(data) as SessionSchema);

			return sessions;
		},
		insert: async (session) => {
			await Promise.all([
				sessionInstance.set(session.id, JSON.stringify(session)),
				userSessionInstance.lPush(session.user_id, session.id)
			]);
		},
		clear: async () => {
			await Promise.all([
				sessionInstance.flushAll(),
				userSessionInstance.flushAll()
			]);
		}
	}
};
