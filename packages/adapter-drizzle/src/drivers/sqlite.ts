import { eq, lte } from "drizzle-orm";

import type { Adapter, DatabaseSession, DatabaseUser, UserId } from "lucia";
import type {
	SQLiteColumn,
	BaseSQLiteDatabase,
	SQLiteTableWithColumns
} from "drizzle-orm/sqlite-core";
import type { InferSelectModel } from "drizzle-orm";

export class DrizzleSQLiteAdapter implements Adapter {
	private db: BaseSQLiteDatabase<"async" | "sync", {}>;

	private sessionTable: SQLiteSessionTable;
	private userTable: SQLiteUserTable;

	constructor(
		db: BaseSQLiteDatabase<any, any, any>,
		sessionTable: SQLiteSessionTable,
		userTable: SQLiteUserTable
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
			.where(eq(this.sessionTable.id, sessionId))
			.get();
		if (!result) return [null, null];
		return [
			transformIntoDatabaseSession(result.session),
			transformIntoDatabaseUser(result.user)
		];
	}

	public async getUserSessions(userId: UserId): Promise<DatabaseSession[]> {
		const result = await this.db
			.select()
			.from(this.sessionTable)
			.where(eq(this.sessionTable.userId, userId))
			.all();
		return result.map((val) => {
			return transformIntoDatabaseSession(val);
		});
	}

	public async setSession(session: DatabaseSession): Promise<void> {
		await this.db
			.insert(this.sessionTable)
			.values({
				id: session.id,
				userId: session.userId,
				expiresAt: Math.floor(session.expiresAt.getTime() / 1000),
				...session.attributes
			})
			.run();
	}

	public async updateSessionExpiration(sessionId: string, expiresAt: Date): Promise<void> {
		await this.db
			.update(this.sessionTable)
			.set({
				expiresAt: Math.floor(expiresAt.getTime() / 1000)
			})
			.where(eq(this.sessionTable.id, sessionId))
			.run();
	}

	public async deleteExpiredSessions(): Promise<void> {
		await this.db
			.delete(this.sessionTable)
			.where(lte(this.sessionTable.expiresAt, Math.floor(Date.now() / 1000)));
	}
}

export type SQLiteUserTable = SQLiteTableWithColumns<{
	dialect: "sqlite";
	columns: {
		id: SQLiteColumn<
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

export type SQLiteSessionTable = SQLiteTableWithColumns<{
	dialect: any;
	columns: {
		id: SQLiteColumn<
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
		expiresAt: SQLiteColumn<
			{
				dataType: any;
				notNull: true;
				enumValues: any;
				tableName: any;
				columnType: any;
				data: number;
				driverParam: any;
				hasDefault: false;
				name: any;
			},
			object
		>;
		userId: SQLiteColumn<
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

function transformIntoDatabaseSession(raw: InferSelectModel<SQLiteSessionTable>): DatabaseSession {
	const { id, userId, expiresAt: expiresAtUnix, ...attributes } = raw;
	return {
		userId,
		id,
		expiresAt: new Date(expiresAtUnix * 1000),
		attributes
	};
}

function transformIntoDatabaseUser(raw: InferSelectModel<SQLiteUserTable>): DatabaseUser {
	const { id, ...attributes } = raw;
	return {
		id,
		attributes
	};
}
