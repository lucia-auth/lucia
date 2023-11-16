import { testAdapter, databaseUser } from "@lucia-auth/adapter-test";
import { UpstashSessionAdapter } from "../src/drivers/upstash.js";
import dotenv from "dotenv";
import { resolve } from "path";
import { Redis } from "@upstash/redis";

import type { Adapter, DatabaseSession, DatabaseUser } from "lucia";

dotenv.config({
	path: `${resolve()}/.env`
});

class UpstashAdapter extends UpstashSessionAdapter implements Adapter {
	constructor(client: Redis) {
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

const client = new Redis({
	url: process.env.UPSTASH_URL ?? "",
	token: process.env.UPSTASH_TOKEN ?? ""
});

const adapter = new UpstashAdapter(client);

await client.flushall();

await testAdapter(adapter);

await client.flushall();

process.exit(0);
