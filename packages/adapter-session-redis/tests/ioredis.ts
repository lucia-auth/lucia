import { testAdapter, databaseUser } from "@lucia-auth/adapter-test";
import { IoredisSessionAdapter } from "../src/drivers/ioredis.js";
import dotenv from "dotenv";
import { resolve } from "path";
import { Redis } from "ioredis";

import type { Adapter, DatabaseSession, DatabaseUser } from "lucia";

dotenv.config({
	path: `${resolve()}/.env`
});

class IoredisAdapter extends IoredisSessionAdapter implements Adapter {
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

const client = new Redis(Number(process.env.REDIS_PORT));
const adapter = new IoredisAdapter(client);

await client.flushall();

await testAdapter(adapter);

await client.flushall();

process.exit(0);
