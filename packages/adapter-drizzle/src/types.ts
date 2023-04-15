import type { AnyTable, ColumnBaseConfig, TableConfig } from "drizzle-orm";
import type { AnySQLiteColumn } from "drizzle-orm/sqlite-core";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import type { AnyMySqlColumn, AnyMySqlTable } from "drizzle-orm/mysql-core";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { MySql2Database } from "drizzle-orm/mysql2";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";

export type Dbs = "pg" | "mysql" | "sqlite";

export type AuthUserTable = Table<{
	columns: {
		id: {
			data: string;
			notNull: true;
		};
	};
	name: "auth_user";
}>;

export type AuthSessionTable = Table<{
	columns: {
		id: {
			data: string;
			notNull: true;
		};
		user_id: {
			data: string;
			notNull: true;
		};
		active_expires: {
			data: number;
			notNull: true;
		};

		idle_expires: {
			data: number;
			notNull: true;
		};
	};
	name: "auth_session";
}>;

export type AuthKeyTable = Table<{
	columns: {
		id: {
			data: string;
			notNull: true;
		};
		user_id: {
			data: string;
			notNull: true;
		};
		primary_key: {
			data: boolean;
			notNull: true;
		};
		hashed_password: {
			data: string;
			notNull: false;
		};
		expires: {
			data: number;
			notNull: false;
		};
	};
	name: "auth_key";
}>;

export type DrizzleAdapterOptions<T extends Dbs> = {
	db: Database[T];
	users: AuthUserTable[T];
	keys: AuthKeyTable[T];
	sessions: AuthSessionTable[T];
	type: T;
};

export type Database = {
	pg: NodePgDatabase | PostgresJsDatabase;
	mysql: MySql2Database;
	sqlite: LibSQLDatabase | BetterSQLite3Database;
};

export type AnyTableWithColumns<T extends Partial<TableConfig>> =
	AnyTable<T> & {
		[Key in keyof T["columns"]]: T["columns"][Key];
	};

// the fact that this has to be done is SO annoying
type MySqlTableWithColumns<T extends Partial<TableConfig<AnyMySqlColumn>>> =
	AnyMySqlTable<T> & {
		[Key in keyof T["columns"]]: T["columns"][Key];
	};

export type AnyColumnNew<T extends Partial<ColumnBaseConfig>> = {
	pg: AnyPgColumn<T>;
	sqlite: AnySQLiteColumn<T>;
	mysql: AnyMySqlColumn<T>;
};

type Column = {
	data: unknown;
	notNull: boolean;
	hasDefault?: boolean;
	tableName?: string;
	driverParam?: unknown;
	name?: string;
};

type DefaultColumnValues = {
	hasDefault: boolean;
	tableName: string;
	driverParam: unknown;
	name: string;
};

export type Table<
	T extends {
		columns: Record<string, Column>;
		name: P;
	},
	P extends string = T["name"]
> = {
	pg: AnyTableWithColumns<{
		name: P;
		columns: {
			[Key in keyof T["columns"]]: AnyPgColumn<
				DefaultColumnValues & T["columns"][Key]
			>;
		};
	}>;
	mysql: MySqlTableWithColumns<{
		name: P;
		columns: {
			[Key in keyof T["columns"]]: AnyMySqlColumn<
				DefaultColumnValues & T["columns"][Key]
			>;
		};
	}>;
	sqlite: AnyTableWithColumns<{
		name: P;
		columns: {
			[Key in keyof T["columns"]]: AnySQLiteColumn<
				DefaultColumnValues & T["columns"][Key]
			>;
		};
	}>;
};
