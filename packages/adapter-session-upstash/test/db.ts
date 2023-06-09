/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { LuciaQueryHandler } from "@lucia-auth/adapter-test";
import { Redis } from "@upstash/redis";
import dotenv from "dotenv";
import { LuciaError, SessionSchema } from "lucia-auth";
import { resolve } from "path";
import { upstashAdapter } from "../src";

dotenv.config({
	path: `${resolve()}/.env`
});

const url = process.env.URL;
const token = process.env.TOKEN;

if (!url || !token) throw new Error(".env is not set up");

const upstash = new Redis({
	url,
	token
});

export const adapter = upstashAdapter(upstash)(LuciaError);

export const queryHandler: LuciaQueryHandler = {
	session: {
		get: async () => {
			const allKeys = await upstash.keys("*");
			const sessionIds = allKeys.filter((key) => key.length > 20);
			const sessionData = (await Promise.all(
				sessionIds.map((id) => upstash.get(id))
			)) as SessionSchema[];

			return sessionData;
		},
		insert: async (session) => {
			await Promise.all([
				upstash.set(session.id, JSON.stringify(session)),
				upstash.lpush(session.user_id, session.id)
			]);
		},
		clear: async () => {
			await upstash.flushall();
		}
	}
};
