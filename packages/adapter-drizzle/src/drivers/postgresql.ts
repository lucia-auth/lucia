import { eq, lte } from "drizzle-orm";

import type { Adapter, DatabaseSession, DatabaseUser } from "lucia";
import type { PgColumn, PgDatabase, PgTableWithColumns } from "drizzle-orm/pg-core";
import type { InferSelectModel } from "drizzle-orm";

export class DrizzlePostgreSQLAdapter<TUserId> implements Adapter<TUserId> {
	private db: PgDatabase<any, any>;

	private sessionTable: PostgreSQLSessionTable<TUserId>;
	private userTable: PostgreSQLUserTable<TUserId>;

	constructor(
		db: PgDatabase<any, any>,
		sessionTable: PostgreSQLSessionTable<TUserId>,
		userTable: PostgreSQLUserTable<TUserId>
	) {
		this.db = db;
		this.sessionTable = sessionTable;
		this.userTable = userTable;
	}

	public async deleteSession(sessionId: string): Promise<void> {
		await this.db.delete(this.sessionTable).where(eq(this.sessionTable.id, sessionId));
	}

	public async deleteUserSessions(userId: TUserId): Promise<void> {
		await this.db.delete(this.sessionTable).where(eq(this.sessionTable.userId, userId));
	}

	public async getSessionAndUser(
		sessionId: string
	): Promise<[session: DatabaseSession<TUserId> | null, user: DatabaseUser<TUserId> | null]> {
		const [databaseSession, databaseUser] = await Promise.all([
			this.getSession(sessionId),
			this.getUserFromSessionId(sessionId)
		]);
		return [databaseSession, databaseUser];
	}

	public async getUserSessions(userId: TUserId): Promise<DatabaseSession<TUserId>[]> {
		const result = await this.db
			.select()
			.from(this.sessionTable)
			.where(eq(this.sessionTable.userId, userId));
		return result.map((val) => {
			return transformIntoDatabaseSession(val);
		});
	}

	public async setSession(session: DatabaseSession<TUserId>): Promise<void> {
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

	private async getSession(sessionId: string): Promise<DatabaseSession<TUserId> | null> {
		const result = await this.db
			.select()
			.from(this.sessionTable)
			.where(eq(this.sessionTable.id, sessionId));
		if (result.length !== 1) return null;
		return transformIntoDatabaseSession(result[0]);
	}

	private async getUserFromSessionId(sessionId: string): Promise<DatabaseUser<TUserId> | null> {
		const { _, $inferInsert, $inferSelect, getSQL, ...userColumns } = this.userTable;
		const result = await this.db
			.select(userColumns)
			.from(this.sessionTable)
			.innerJoin(this.userTable, eq(this.sessionTable.userId, this.userTable.id))
			.where(eq(this.sessionTable.id, sessionId));
		if (result.length !== 1) return null;
		return transformIntoDatabaseUser(result[0]);
	}
}

export type PostgreSQLUserTable<TUserId> = PgTableWithColumns<{
	dialect: "pg";
	columns: {
		id: PgColumn<
			{
				name: any;
				tableName: any;
				dataType: any;
				columnType: any;
				data: TUserId;
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

export type PostgreSQLSessionTable<TUserId> = PgTableWithColumns<{
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
				data: TUserId;
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

function transformIntoDatabaseSession<TUserId>(
	raw: InferSelectModel<PostgreSQLSessionTable<TUserId>>
): DatabaseSession<TUserId> {
	const { id, userId, expiresAt, ...attributes } = raw;
	return {
		userId,
		id,
		expiresAt,
		attributes
	};
}

function transformIntoDatabaseUser<TUserId>(
	raw: InferSelectModel<PostgreSQLUserTable<TUserId>>
): DatabaseUser<TUserId> {
	const { id, ...attributes } = raw;
	return {
		id,
		attributes
	};
}
