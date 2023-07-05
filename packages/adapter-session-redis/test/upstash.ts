import { Database, testSessionAdapter } from "@lucia-auth/adapter-test";
import { Redis } from "@upstash/redis";
import dotenv from "dotenv";
import { LuciaError } from "lucia";
import { resolve } from "path";

import {
	DEFAULT_SESSION_PREFIX,
	DEFAULT_USER_SESSIONS_PREFIX,
	upstashSessionAdapter
} from "../src/drivers/upstash";

import type { QueryHandler } from "@lucia-auth/adapter-test";
import type { SessionSchema } from "lucia";

dotenv.config({
	path: `${resolve()}/.env`
});

const url = process.env.URL;
const token = process.env.TOKEN;

if (!url || !token) throw new Error(".env is not set up");

const upstashClient = new Redis({
	url,
	token
});

const sessionKey = (sessionId: string) => {
	return [DEFAULT_SESSION_PREFIX, sessionId].join(":");
};
const userSessionsKey = (userId: string) => {
	return [DEFAULT_USER_SESSIONS_PREFIX, userId].join(":");
};

const adapter = upstashSessionAdapter(upstashClient)(LuciaError);

const queryHandler: QueryHandler = {
	session: {
		get: async () => {
			const keys = await upstashClient.keys(sessionKey("*"));

			const pipeline = upstashClient.pipeline();
			keys.forEach((key) => pipeline.get(key));
			const sessions = pipeline.exec<SessionSchema>();
			return sessions;
		},
		insert: async (session) => {
			const pipeline = upstashClient.pipeline();
			pipeline.set(sessionKey(session.id), JSON.stringify(session));
			pipeline.sadd(userSessionsKey(session.user_id), session.id);
			await pipeline.exec();
		},
		clear: async () => {
			await upstashClient.flushall();
		}
	}
};

await testSessionAdapter(adapter, new Database(queryHandler));

process.exit(0);
