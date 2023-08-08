import { Database, testSessionAdapter } from "@lucia-auth/adapter-test";
import dotenv from "dotenv";
import { LuciaError } from "lucia";
import { resolve } from "path";
import { Redis } from "ioredis";

import {
	DEFAULT_SESSION_PREFIX,
	DEFAULT_USER_SESSIONS_PREFIX,
	ioredisSessionAdapter
} from "../src/drivers/ioredis.js";

import type { QueryHandler } from "@lucia-auth/adapter-test";
import type { SessionSchema } from "lucia";

dotenv.config({
	path: `${resolve()}/.env`
});

const ioredisClient = new Redis(Number(process.env.REDIS_PORT));

const sessionKey = (sessionId: string) => {
	return [DEFAULT_SESSION_PREFIX, sessionId].join(":");
};
const userSessionsKey = (userId: string) => {
	return [DEFAULT_USER_SESSIONS_PREFIX, userId].join(":");
};

const adapter = ioredisSessionAdapter(ioredisClient)(LuciaError);

const queryHandler: QueryHandler = {
	session: {
		get: async () => {
			const keys = await ioredisClient.keys(sessionKey("*"));
			const sessionData = await Promise.all(
				keys.map((key) => ioredisClient.get(key))
			);
			const sessions = sessionData
				.filter((val): val is string => val !== null)
				.map((data) => JSON.parse(data) as SessionSchema);
			return sessions;
		},
		insert: async (session) => {
			await Promise.all([
				ioredisClient.set(sessionKey(session.id), JSON.stringify(session)),
				ioredisClient.sadd(userSessionsKey(session.user_id), session.id)
			]);
		},
		clear: async () => {
			await ioredisClient.flushall();
		}
	}
};

await testSessionAdapter(adapter, new Database(queryHandler));

process.exit(0);
