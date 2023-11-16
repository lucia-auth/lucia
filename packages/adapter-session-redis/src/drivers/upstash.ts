import { Controller, RedisSessionAdapter } from "../base.js";

import type { Redis } from "@upstash/redis";

export class UpstashSessionAdapter extends RedisSessionAdapter {
	constructor(
		client: Redis,
		prefixes?: {
			session: string;
			userSessions: string;
		}
	) {
		super(new UpstashController(client), prefixes);
	}
}

class UpstashController implements Controller {
	private client: Redis;
	constructor(client: Redis) {
		this.client = client;
	}

	public async get(key: string): Promise<string | null> {
		return this.client.get(key);
	}

	public async del(key: string): Promise<void> {
		await this.client.del(key);
	}

	public async set(key: string, value: string, expiresAt: Date): Promise<void> {
		await this.client.set(key, value, {
			exat: Math.floor(expiresAt.getTime() / 1000)
		});
	}

	public async sadd(key: string, value: string): Promise<void> {
		await this.client.sadd(key, value);
	}

	public async smembers(key: string): Promise<string[]> {
		return await this.client.smembers(key);
	}

	public async srem(key: string, value: string): Promise<void> {
		await this.client.srem(key, value);
	}
}
