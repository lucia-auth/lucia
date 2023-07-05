import { Database, testSessionAdapter } from "@lucia-auth/adapter-test";
import dotenv from "dotenv";
import { LuciaError } from "lucia";
import { resolve } from "path";
import { createClient } from "redis";

import {
	DEFAULT_SESSION_PREFIX,
	DEFAULT_USER_SESSIONS_PREFIX,
	redisSessionAdapter
} from "../src/drivers/redis.js";

import type { QueryHandler } from "@lucia-auth/adapter-test";
import type { SessionSchema } from "lucia";

dotenv.config({
	path: `${resolve()}/.env`
});

const redisClient = createClient({
	socket: {
		port: Number(process.env.REDIS_PORT)
	}
});

redisClient.on("error", (err) => console.log("Redis Client Error", err));

const sessionKey = (sessionId: string) => {
	return [DEFAULT_SESSION_PREFIX, sessionId].join(":");
};
const userSessionsKey = (userId: string) => {
	return [DEFAULT_USER_SESSIONS_PREFIX, userId].join(":");
};

const adapter = redisSessionAdapter(redisClient)(LuciaError);

const queryHandler: QueryHandler = {
	session: {
		get: async () => {
			const keys = await redisClient.keys(sessionKey("*"));
			const sessionData = await Promise.all(
				keys.map((key) => redisClient.get(key))
			);
			const sessions = sessionData
				.filter((val): val is string => val !== null)
				.map((data) => JSON.parse(data) as SessionSchema);
			return sessions;
		},
		insert: async (session) => {
			await Promise.all([
				redisClient.set(sessionKey(session.id), JSON.stringify(session)),
				redisClient.sAdd(userSessionsKey(session.user_id), session.id)
			]);
		},
		clear: async () => {
			await redisClient.flushAll();
		}
	}
};

await redisClient.connect();

await testSessionAdapter(adapter, new Database(queryHandler));

process.exit(0);
