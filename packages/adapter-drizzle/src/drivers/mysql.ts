import { eq, lte } from "drizzle-orm";

import type { Adapter, DatabaseSession, DatabaseUser } from "lucia";
import type { MySqlColumn, MySqlDatabase, MySqlTableWithColumns } from "drizzle-orm/mysql-core";
import type { InferSelectModel } from "drizzle-orm";

export class DrizzleMySQLAdapter implements Adapter {
	private db: MySqlDatabase<any, any>;

	private sessionTable: MySQLSessionTable;
	private userTable: MySQLUserTable;

	constructor(
		db: MySqlDatabase<any, any>,
		sessionTable: MySQLSessionTable,
		userTable: MySQLUserTable
	) {
		this.db = db;
		this.sessionTable = sessionTable;
		this.userTable = userTable;
	}

	public async deleteSession(sessionId: string): Promise<void> {
		await this.db.delete(this.sessionTable).where(eq(this.sessionTable.id, sessionId));
	}

	public async deleteUserSessions(userId: string): Promise<void> {
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

	public async getUserSessions(userId: string): Promise<DatabaseSession[]> {
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

export type MySQLUserTable = MySqlTableWithColumns<{
	dialect: "mysql";
	columns: {
		id: MySqlColumn<
			{
				name: any;
				tableName: any;
				dataType: any;
				columnType: any;
				data: string;
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

export type MySQLSessionTable = MySqlTableWithColumns<{
	dialect: "mysql";
	columns: {
		id: MySqlColumn<
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
		expiresAt: MySqlColumn<
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
		userId: MySqlColumn<
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
	};
	schema: any;
	name: any;
}>;

function transformIntoDatabaseSession(raw: InferSelectModel<MySQLSessionTable>): DatabaseSession {
	const { id, userId, expiresAt, ...attributes } = raw;
	return {
		userId,
		id,
		expiresAt,
		attributes
	};
}

function transformIntoDatabaseUser(raw: InferSelectModel<MySQLUserTable>): DatabaseUser {
	const { id, ...attributes } = raw;
	return {
		id,
		attributes
	};
}
