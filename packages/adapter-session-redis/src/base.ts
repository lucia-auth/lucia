import type { DatabaseSession, DatabaseSessionAttributes, SessionAdapter } from "lucia";

export class RedisSessionAdapter implements SessionAdapter {
	private controller: Controller;
	private sessionPrefix: string;
	private userSessionsPrefix: string;

	constructor(
		controller: Controller,
		prefixes?: {
			session: string;
			userSessions: string;
		}
	) {
		this.controller = controller;
		this.sessionPrefix = prefixes?.session ?? "session";
		this.userSessionsPrefix = prefixes?.userSessions ?? "user_sessions";
	}

	private sessionKey(sessionId: string): string {
		return [this.sessionPrefix, sessionId].join(":");
	}
	private userSessionsKey(userId: string): string {
		return [this.userSessionsPrefix, userId].join(":");
	}

	public async deleteSession(sessionId: string): Promise<void> {
		const sessionData = await this.controller.get(this.sessionKey(sessionId));
		if (!sessionData) return;
		const session = JSON.parse(sessionData) as SessionSchema;
		await Promise.all([
			this.controller.del(this.sessionKey(sessionId)),
			this.controller.srem(this.userSessionsKey(session.user_id), sessionId)
		]);
	}

	public async deleteUserSessions(userId: string): Promise<void> {
		const sessionIds = await this.controller.smembers(this.userSessionsKey(userId));
		await Promise.all([
			...sessionIds.map((sessionId) => this.controller.del(this.sessionKey(sessionId))),
			this.controller.del(this.userSessionsKey(userId))
		]);
	}

	public async getSession(sessionId: string): Promise<DatabaseSession | null> {
		const sessionData = await this.controller.get(this.sessionKey(sessionId));
		if (!sessionData) return null;
		return transformIntoDatabaseSession(JSON.parse(sessionData) as SessionSchema);
	}

	public async getUserSessions(userId: string): Promise<DatabaseSession[]> {
		const sessionIds = await this.controller.smembers(this.userSessionsKey(userId));
		const sessionData = await Promise.all(
			sessionIds.map((sessionId) => this.controller.get(this.sessionKey(sessionId)))
		);
		const sessions = sessionData
			.filter((val): val is NonNullable<typeof val> => val !== null)
			.map((val) => transformIntoDatabaseSession(JSON.parse(val) as SessionSchema));
		return sessions;
	}

	public async setSession(session: DatabaseSession): Promise<void> {
		const databaseSession: SessionSchema = {
			id: session.id,
			expires_at: Math.floor(session.expiresAt.getTime() / 1000),
			user_id: session.userId,
			...session.attributes
		};
		await Promise.all([
			this.controller.sadd(this.userSessionsKey(session.userId), session.id),
			this.controller.set(
				this.sessionKey(session.id),
				JSON.stringify(databaseSession),
				session.expiresAt
			)
		]);
	}

	public async updateSessionExpiration(sessionId: string, expiresAt: Date): Promise<void> {
		const sessionData = await this.controller.get(this.sessionKey(sessionId));
		if (!sessionData) return;
		const session = JSON.parse(sessionData) as SessionSchema;
		session.expires_at = Math.floor(expiresAt.getTime() / 1000);
		await this.controller.set(this.sessionKey(sessionId), JSON.stringify(session), expiresAt);
	}
}

export interface Controller {
	sadd(key: string, value: string): Promise<void>;
	srem(key: string, value: string): Promise<void>;
	smembers(key: string): Promise<string[]>;

	get(key: string): Promise<string | null>;
	del(key: string): Promise<void>;
	set(key: string, value: string, expiresAt: Date): Promise<void>;
}

interface SessionSchema extends DatabaseSessionAttributes {
	id: string;
	expires_at: number;
	user_id: string;
}

function transformIntoDatabaseSession(data: SessionSchema): DatabaseSession {
	const { id, user_id: userId, expires_at: expiresAtUnix, ...attributes } = data;
	return {
		id,
		userId,
		expiresAt: new Date(expiresAtUnix * 1000),
		attributes
	};
}
