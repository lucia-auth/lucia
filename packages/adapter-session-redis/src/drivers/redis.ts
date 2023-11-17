import { Controller, RedisSessionAdapter as RedisCoreSessionAdapter } from "../base.js";

import type { RedisClientType } from "redis";

export class RedisSessionAdapter extends RedisCoreSessionAdapter {
	constructor(
		client: RedisClientType<any, any, any>,
		prefixes?: {
			session: string;
			userSessions: string;
		}
	) {
		super(new RedisController(client), prefixes);
	}
}

class RedisController implements Controller {
	private client: RedisClientType<any, any, any>;

	constructor(client: RedisClientType<any, any, any>) {
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
			EXAT: Math.floor(expiresAt.getTime() / 1000)
		});
	}

	public async sadd(key: string, value: string): Promise<void> {
		await this.client.sAdd(key, value);
	}

	public async smembers(key: string): Promise<string[]> {
		return await this.client.sMembers(key);
	}

	public async srem(key: string, value: string): Promise<void> {
		await this.client.sRem(key, value);
	}
}
