import type { Kv, KvKeyPart } from "@deno/kv";
import type { DatabaseUser, DatabaseSession, Adapter } from "lucia";

export class DenoKvAdapter implements Adapter {
	private kv: Kv;
	private userPrefix: KvKeyPart[];
	private sessionPrefix: KvKeyPart[];
	private userIdBySessionPrefix: KvKeyPart[];

	constructor(
		kv: Kv,
		userPrefix: KvKeyPart[],
		sessionPrefix: KvKeyPart[],
		userIdBySessionPrefix: KvKeyPart[] = ["denoKvAdapter", "userIdBySessionId"]
	) {
		this.kv = kv;
		this.userPrefix = userPrefix;
		this.sessionPrefix = sessionPrefix;
		this.userIdBySessionPrefix = userIdBySessionPrefix;
	}

	private userIdBySessionKey(sessionId: string): KvKeyPart[] {
		return [...this.userIdBySessionPrefix, sessionId];
	}

	private userKey(userId: string): KvKeyPart[] {
		return [...this.userPrefix, userId];
	}

	private sessionKey(userId: string, sessionId: string): KvKeyPart[] {
		return [...this.sessionPrefix, userId, sessionId];
	}

	private userSessionsKey(userId: string): KvKeyPart[] {
		return [...this.sessionPrefix, userId];
	}

	public async getUserIdFromSessionId(sessionId: string): Promise<string | null> {
		const userId = await this.kv.get<string>(this.userIdBySessionKey(sessionId));
		return userId.value;
	}

	public async getUserById(userId: string): Promise<DatabaseUser | null> {
		const userData = await this.kv.get<DatabaseUser>(this.userKey(userId));
		return userData.value;
	}

	public async getUserFromSessionId(sessionId: string): Promise<DatabaseUser | null> {
		const userId = await this.getUserIdFromSessionId(sessionId);
		if (!userId) return null;

		const userData = await this.kv.get<DatabaseUser>(this.userKey(userId));
		return userData.value;
	}

	public async getSession(sessionId: string): Promise<DatabaseSession | null> {
		const userId = await this.getUserIdFromSessionId(sessionId);
		if (!userId) return null;
		const sessionData = await this.kv.get<DatabaseSession>(this.sessionKey(userId, sessionId));
		return sessionData.value;
	}

	public async getSessionFromUserAndSessionIds(
		userId: string,
		sessionId: string
	): Promise<DatabaseSession | null> {
		const sessionData = await this.kv.get<DatabaseSession>(this.sessionKey(userId, sessionId));
		return sessionData.value;
	}

	public async getSessionAndUser(
		sessionId: string
	): Promise<[DatabaseSession | null, DatabaseUser | null]> {
		const userId = await this.getUserIdFromSessionId(sessionId);
		if (!userId) return [null, null];
		const [databaseSession, databaseUser] = await Promise.all([
			this.getSessionFromUserAndSessionIds(userId, sessionId),
			this.getUserById(userId)
		]);
		return [databaseSession, databaseUser];
	}

	public async getUserSessions(userId: string): Promise<DatabaseSession[]> {
		const iter = this.kv.list<DatabaseSession>({ prefix: this.userSessionsKey(userId) });
		const sessions = [];
		for await (const session of iter) {
			sessions.push(session.value);
		}
		return sessions;
	}

	public async setSession(session: DatabaseSession) {
		await this.kv.set(this.sessionKey(session.userId, session.id), session);
		await this.kv.set(this.userIdBySessionKey(session.id), session.userId);
	}

	public async updateSessionExpiration(sessionId: string, expiresAt: Date) {
		const currentSession = await this.getSession(sessionId);
		if (!currentSession) return;
		await this.kv.set(this.sessionKey(currentSession.userId, sessionId), {
			...currentSession,
			expiresAt
		});
	}

	public async deleteSession(sessionId: string) {
		const userId = await this.getUserIdFromSessionId(sessionId);
		if (!userId) return;
		await this.kv.delete(this.sessionKey(userId, sessionId));
		await this.kv.delete(this.userIdBySessionKey(sessionId));
	}

	public async deleteUserSessions(userId: string) {
		const iter = this.kv.list<DatabaseSession>({ prefix: this.userSessionsKey(userId) });
		const sessions = [];
		for await (const res of iter) sessions.push(res);

		for (const session of sessions) {
			const sessionId = session.value.id;
			await this.kv.delete(session.key);
			await this.kv.delete(this.userIdBySessionKey(sessionId));
		}
	}
}
