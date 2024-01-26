import { eq, lte } from "drizzle-orm";

import type { Adapter, DatabaseSession, DatabaseUser } from "lucia";
import type {
	SQLiteColumn,
	BaseSQLiteDatabase,
	SQLiteTableWithColumns
} from "drizzle-orm/sqlite-core";
import type { InferSelectModel } from "drizzle-orm";

export class DrizzleSQLiteAdapter<TUserId> implements Adapter<TUserId> {
	private db: BaseSQLiteDatabase<"async" | "sync", {}>;

	private sessionTable: SQLiteSessionTable<TUserId>;
	private userTable: SQLiteUserTable<TUserId>;

	constructor(
		db: BaseSQLiteDatabase<any, any>,
		sessionTable: SQLiteSessionTable<TUserId>,
		userTable: SQLiteUserTable<TUserId>
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
			.where(eq(this.sessionTable.userId, userId))
			.all();
		return result.map((val) => {
			return transformIntoDatabaseSession(val);
		});
	}

	public async setSession(session: DatabaseSession<TUserId>): Promise<void> {
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

	private async getSession(sessionId: string): Promise<DatabaseSession<TUserId> | null> {
		const result = await this.db
			.select()
			.from(this.sessionTable)
			.where(eq(this.sessionTable.id, sessionId))
			.get();
		if (!result) return null;
		return transformIntoDatabaseSession(result);
	}

	private async getUserFromSessionId(sessionId: string): Promise<DatabaseUser<TUserId> | null> {
		const { _, $inferInsert, $inferSelect, getSQL, ...userColumns } = this.userTable;
		const result = await this.db
			.select(userColumns)
			.from(this.sessionTable)
			.innerJoin(this.userTable, eq(this.sessionTable.userId, this.userTable.id))
			.where(eq(this.sessionTable.id, sessionId))
			.get();
		if (!result) return null;
		return transformIntoDatabaseUser(result);
	}
}

export type SQLiteUserTable<TUserId> = SQLiteTableWithColumns<{
	dialect: "sqlite";
	columns: {
		id: SQLiteColumn<
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

export type SQLiteSessionTable<TUserId> = SQLiteTableWithColumns<{
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
				dataType: "number";
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
				dataType: "string";
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
	raw: InferSelectModel<SQLiteSessionTable<TUserId>>
): DatabaseSession<TUserId> {
	const { id, userId, expiresAt: expiresAtUnix, ...attributes } = raw;
	return {
		userId,
		id,
		expiresAt: new Date(expiresAtUnix * 1000),
		attributes
	};
}

function transformIntoDatabaseUser<TUserId>(
	raw: InferSelectModel<SQLiteUserTable<TUserId>>
): DatabaseUser<TUserId> {
	const { id, ...attributes } = raw;
	return {
		id,
		attributes
	};
}
