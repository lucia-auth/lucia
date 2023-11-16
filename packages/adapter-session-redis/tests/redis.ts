import { testAdapter, databaseUser } from "@lucia-auth/adapter-test";
import { RedisSessionAdapter } from "../src/drivers/redis.js";
import dotenv from "dotenv";
import { resolve } from "path";
import { createClient } from "redis";

import type { Adapter, DatabaseSession, DatabaseUser } from "lucia";
import type { RedisClientType } from "redis";

dotenv.config({
	path: `${resolve()}/.env`
});

class RedisAdapter extends RedisSessionAdapter implements Adapter {
	constructor(client: RedisClientType<any, any, any>) {
		super(client);
	}

	public async getSessionAndUser(
		sessionId: string
	): Promise<[session: DatabaseSession | null, user: DatabaseUser | null]> {
		const session = await this.getSession(sessionId);
		if (!session) return [null, null];
		return [session, databaseUser];
	}
}

const client = createClient({
	socket: {
		port: Number(process.env.REDIS_PORT)
	}
});

await client.connect();

const adapter = new RedisAdapter(client);

await client.flushAll();

await testAdapter(adapter);

await client.flushAll();

process.exit(0);
