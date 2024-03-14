import { eq, lte } from "drizzle-orm";

import type { Adapter, DatabaseSession, DatabaseUser, UserId } from "lucia";
import type { PgColumn, PgDatabase, PgTableWithColumns } from "drizzle-orm/pg-core";
import type { InferSelectModel } from "drizzle-orm";

export class DrizzlePostgreSQLAdapter implements Adapter {
	private db: PgDatabase<any, any, any>;

	private sessionTable: PostgreSQLSessionTable;
	private userTable: PostgreSQLUserTable;

	constructor(
		db: PgDatabase<any, any, any>,
		sessionTable: PostgreSQLSessionTable,
		userTable: PostgreSQLUserTable
	) {
		this.db = db;
		this.sessionTable = sessionTable;
		this.userTable = userTable;
	}

	public async deleteSession(sessionId: string): Promise<void> {
		await this.db.delete(this.sessionTable).where(eq(this.sessionTable.id, sessionId));
	}

	public async deleteUserSessions(userId: UserId): Promise<void> {
		await this.db.delete(this.sessionTable).where(eq(this.sessionTable.userId, userId));
	}

	public async getSessionAndUser(
		sessionId: string
	): Promise<[session: DatabaseSession | null, user: DatabaseUser | null]> {
		const result = await this.db
			.select({
				user: this.userTable,
				session: this.sessionTable
			})
			.from(this.sessionTable)
			.innerJoin(this.userTable, eq(this.sessionTable.userId, this.userTable.id))
			.where(eq(this.sessionTable.id, sessionId));
		if (result.length !== 1) return [null, null];
		return [
			transformIntoDatabaseSession(result[0].session),
			transformIntoDatabaseUser(result[0].user)
		];
	}

	public async getUserSessions(userId: UserId): Promise<DatabaseSession[]> {
		const result = await this.db
			.select()
			.from(this.sessionTable)
			.where(eq(this.sessionTable.userId, userId));
		return result.map((val) => {
			return transformIntoDatabaseSession(val);
		});
	}

	public async setSession(session: DatabaseSession): Promise<void> {
		await this.db.insert(this.sessionTable).values({
			id: session.id,
			userId: session.userId,
			expiresAt: session.expiresAt,
			...session.attributes
		});
	}

	public async updateSessionExpiration(sessionId: string, expiresAt: Date): Promise<void> {
		await this.db
			.update(this.sessionTable)
			.set({
				expiresAt
			})
			.where(eq(this.sessionTable.id, sessionId));
	}

	public async deleteExpiredSessions(): Promise<void> {
		await this.db.delete(this.sessionTable).where(lte(this.sessionTable.expiresAt, new Date()));
	}
}

export type PostgreSQLUserTable = PgTableWithColumns<{
	dialect: "pg";
	columns: {
		id: PgColumn<
			{
				name: any;
				tableName: any;
				dataType: any;
				columnType: any;
				data: UserId;
				driverParam: any;
				notNull: true;
				hasDefault: boolean; // must be boolean instead of any to allow default values
				enumValues: any;
				baseColumn: any;
			},
			object
		>;
	};
	schema: any;
	name: any;
}>;

export type PostgreSQLSessionTable = PgTableWithColumns<{
	dialect: "pg";
	columns: {
		id: PgColumn<
			{
				dataType: any;
				notNull: true;
				enumValues: any;
				tableName: any;
				columnType: any;
				data: string;
				driverParam: any;
				hasDefault: false;
				name: any;
			},
			object
		>;
		expiresAt: PgColumn<
			{
				dataType: any;
				notNull: true;
				enumValues: any;
				tableName: any;
				columnType: any;
				data: Date;
				driverParam: any;
				hasDefault: false;
				name: any;
			},
			object
		>;
		userId: PgColumn<
			{
				dataType: any;
				notNull: true;
				enumValues: any;
				tableName: any;
				columnType: any;
				data: UserId;
				driverParam: any;
				hasDefault: false;
				name: any;
			},
			object
		>;
	};
	schema: any;
	name: any;
}>;

function transformIntoDatabaseSession(
	raw: InferSelectModel<PostgreSQLSessionTable>
): DatabaseSession {
	const { id, userId, expiresAt, ...attributes } = raw;
	return {
		userId,
		id,
		expiresAt,
		attributes
	};
}

function transformIntoDatabaseUser(raw: InferSelectModel<PostgreSQLUserTable>): DatabaseUser {
	const { id, ...attributes } = raw;
	return {
		id,
		attributes
	};
}
