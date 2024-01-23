import type {
	Adapter,
	DatabaseSession,
	RegisteredDatabaseSessionAttributes,
	DatabaseUser,
	RegisteredDatabaseUserAttributes
} from "lucia";

export class MySQLAdapter implements Adapter {
	private controller: Controller;

	private escapedUserTableName: string;
	private escapedSessionTableName: string;

	constructor(controller: Controller, tableNames: TableNames) {
		this.controller = controller;
		this.escapedSessionTableName = escapeName(tableNames.session);
		this.escapedUserTableName = escapeName(tableNames.user);
	}

	public async deleteSession(sessionId: string): Promise<void> {
		await this.controller.execute(`DELETE FROM ${this.escapedSessionTableName} WHERE id = ?`, [
			sessionId
		]);
	}

	public async deleteUserSessions(userId: string): Promise<void> {
		await this.controller.execute(`DELETE FROM ${this.escapedSessionTableName} WHERE user_id = ?`, [
			userId
		]);
	}

	public async getSessionAndUser(
		sessionId: string
	): Promise<[session: DatabaseSession | null, user: DatabaseUser | null]> {
		const [databaseSession, databaseUser] = await Promise.all([
			this.getSession(sessionId),
			this.getUserFromSessionId(sessionId)
		]);
		return [databaseSession, databaseUser];
	}

	public async getUserSessions(userId: string): Promise<DatabaseSession[]> {
		const result = await this.controller.getAll<SessionSchema>(
			`SELECT * FROM ${this.escapedSessionTableName} WHERE user_id = ?`,
			[userId]
		);
		return result.map((val) => {
			return transformIntoDatabaseSession(val);
		});
	}

	public async setSession(databaseSession: DatabaseSession): Promise<void> {
		const value: SessionSchema = {
			id: databaseSession.id,
			user_id: databaseSession.userId,
			expires_at: databaseSession.expiresAt,
			...databaseSession.attributes
		};
		const entries = Object.entries(value).filter(([_, v]) => v !== undefined);
		const columns = entries.map(([k]) => escapeName(k));
		const placeholders = Array(columns.length).fill("?");
		const values = entries.map(([_, v]) => v);
		await this.controller.execute(
			`INSERT INTO ${this.escapedSessionTableName} (${columns.join(
				", "
			)}) VALUES (${placeholders.join(", ")})`,
			values
		);
	}

	public async updateSessionExpiration(sessionId: string, expiresAt: Date): Promise<void> {
		await this.controller.execute(
			`UPDATE ${this.escapedSessionTableName} SET expires_at = ? WHERE id = ?`,
			[expiresAt, sessionId]
		);
	}

	public async deleteExpiredSessions(): Promise<void> {
		await this.controller.execute(
			`DELETE FROM ${this.escapedSessionTableName} WHERE expires_at <= ?`,
			[new Date()]
		);
	}

	private async getSession(sessionId: string): Promise<DatabaseSession | null> {
		const result = await this.controller.get<SessionSchema>(
			`SELECT * FROM ${this.escapedSessionTableName} WHERE id = ?`,
			[sessionId]
		);
		if (!result) return null;
		return transformIntoDatabaseSession(result);
	}

	private async getUserFromSessionId(sessionId: string): Promise<DatabaseUser | null> {
		const result = await this.controller.get<UserSchema>(
			`SELECT ${this.escapedUserTableName}.* FROM ${this.escapedSessionTableName} INNER JOIN ${this.escapedUserTableName} ON ${this.escapedUserTableName}.id = ${this.escapedSessionTableName}.user_id WHERE ${this.escapedSessionTableName}.id = ?`,
			[sessionId]
		);
		if (!result) return null;
		return transformIntoDatabaseUser(result);
	}
}

export interface TableNames {
	user: string;
	session: string;
}

export interface Controller {
	execute(sql: string, args?: any[]): Promise<void>;
	get<T>(sql: string, args?: any[]): Promise<T | null>;
	getAll<T>(sql: string, args?: any[]): Promise<T[]>;
}

interface SessionSchema extends RegisteredDatabaseSessionAttributes {
	id: string;
	user_id: string;
	expires_at: Date | string;
}

interface UserSchema extends RegisteredDatabaseUserAttributes {
	id: string;
}

function transformIntoDatabaseSession(raw: SessionSchema): DatabaseSession {
	const { id, user_id: userId, expires_at: expiresAtResult, ...attributes } = raw;
	return {
		userId,
		id,
		expiresAt:
			expiresAtResult instanceof Date ? expiresAtResult : new Date(expiresAtResult + " GMT"),
		attributes
	};
}

function transformIntoDatabaseUser(raw: UserSchema): DatabaseUser {
	const { id, ...attributes } = raw;
	return {
		id,
		attributes
	};
}

function escapeName(val: string): string {
	return "`" + val + "`";
}
