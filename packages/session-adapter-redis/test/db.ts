import type { Database } from "@lucia-auth/adapter-test";
import type { SessionSchema } from "lucia-auth/adapter";

import { createClient } from "redis";
import redis from "../src/index.js";

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
	userSessions: userSessionInstance
});

export const db: Database = {
	getUsers: async () => {
		return {} as any;
	},
	getSessions: async () => {
		const sessionIds = await sessionInstance.keys("*");
		const sessionData = await Promise.all(sessionIds.map((id) => sessionInstance.get(id)));
		const sessions = sessionData
			.filter((val): val is string => val !== null)
			.map((data) => JSON.parse(data) as SessionSchema);
		return sessions;
	},
	insertUser: async () => {},
	insertSession: async (session) => {
		await Promise.all([
			sessionInstance.set(session.id, JSON.stringify(session)),
			userSessionInstance.lPush(session.user_id, session.id)
		]);
	},
	clearUsers: async () => {},
	clearSessions: async () => {
		await Promise.all([sessionInstance.flushAll(), userSessionInstance.flushAll()]);
	}
};
