import type { LuciaQueryHandler } from "@lucia-auth/adapter-test";
import type { SessionSchema } from "lucia-auth";

import { createClient } from "redis";
import redis from "../src/index.js";
import { LuciaError } from "lucia-auth";

const redisNamespaces = {
	session: "session",
	userSession: "userSession"
};

const redisClient = createClient({
	socket: {
		port: 6379
	}
});

// @ts-expect-error await is available in the current context
await redisClient.connect();

export const adapter = redis(redisClient, { namespaces: redisNamespaces })(
	LuciaError
);

export const queryHandler: LuciaQueryHandler = {
	session: {
		get: async () => {
			const sessionIds = await redisClient.keys(`${redisNamespaces.session}:*`);
			const sessionData = await Promise.all(
				sessionIds.map((id) => redisClient.get(id))
			);
			return sessionData
				.filter((val): val is string => val !== null)
				.map((data) => JSON.parse(data) as SessionSchema);
		},
		insert: async (session) => {
			await Promise.all([
				redisClient.lPush(
					`${redisNamespaces.userSession}:${session.user_id}`,
					session.id
				),
				redisClient.set(
					`${redisNamespaces.session}:${session.id}`,
					JSON.stringify(session)
				)
			]);
		},
		clear: async () => {
			await redisClient.flushAll();
		}
	}
};
