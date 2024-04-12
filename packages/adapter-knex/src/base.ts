import type { Knex } from "knex";
import type { DatabaseSession, DatabaseUser, UserId } from "lucia";

type KnexAdapterTables = {
	users: string;
	sessions: string;
};

export type KnexUserTable = {
	userId: UserId;
};

export type KnexSessionTable = {
	userId: UserId;
	sessionId: string;
	expiresAtTimestamp: Date;
};

export default abstract class BaseKnexAdapter {
	protected readonly knex: Knex;
	protected readonly tables: KnexAdapterTables;

	public constructor(knex: Knex, tables: KnexAdapterTables) {
		this.knex = knex;
		this.tables = tables;
	}

	protected transformIntoDatabaseSession(raw: KnexSessionTable): DatabaseSession {
		const { sessionId, userId, expiresAtTimestamp, ...attributes } = raw;
		const expiresAt = new Date(expiresAtTimestamp);

		return { id: sessionId, userId, expiresAt, attributes };
	}

	protected transformIntoDatabaseUser(raw: KnexUserTable): DatabaseUser {
		const { userId, ...attributes } = raw;
		return { id: userId, attributes };
	}

	public async getUserSessions(userId: string): Promise<DatabaseSession[]> {
		const results = await this.knex<KnexSessionTable>(this.tables.sessions)
			.select("*")
			.where("userId", "=", userId);

		return results.map((result) => this.transformIntoDatabaseSession(result));
	}

	public async setSession(session: DatabaseSession): Promise<void> {
		await this.knex<KnexSessionTable>(this.tables.sessions).insert({
			sessionId: session.id,
			userId: session.userId,
			expiresAtTimestamp: session.expiresAt,
			...session.attributes
		});
	}

	public async updateSessionExpiration(
		sessionId: string,
		expiresAtTimestamp: Date
	): Promise<void> {
		await this.knex<KnexSessionTable>(this.tables.sessions)
			.update("expiresAtTimestamp", expiresAtTimestamp)
			.where("sessionId", "=", sessionId);
	}

	public async deleteSession(sessionId: string): Promise<void> {
		await this.knex<KnexSessionTable>(this.tables.sessions)
			.del()
			.where("sessionId", "=", sessionId);
	}

	public async deleteUserSessions(userId: string): Promise<void> {
		await this.knex<KnexSessionTable>(this.tables.sessions).del().where("userId", "=", userId);
	}

	public async deleteExpiredSessions(): Promise<void> {
		await this.knex<KnexSessionTable>(this.tables.sessions)
			.del()
			.where("expiresAtTimestamp", "<=", new Date());
	}
}
