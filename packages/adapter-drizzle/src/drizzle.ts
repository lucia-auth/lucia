import type { Adapter, InitializeAdapter } from "lucia";

import { MySqlDatabase } from "drizzle-orm/mysql-core";
import { PgDatabase } from "drizzle-orm/pg-core";
import { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import type { AnyMySqlTable, MySqlTableFn } from "drizzle-orm/mysql-core";
import type { AnyPgTable, PgTableFn } from "drizzle-orm/pg-core";
import type { AnySQLiteTable, SQLiteTableFn } from "drizzle-orm/sqlite-core";
import { DrizzleError, is } from "drizzle-orm";

import { mySqlDrizzleAdapter } from "./drivers/mysql.js";
import { pgDrizzleAdapter } from "./drivers/pg.js";
import { SQLiteDrizzleAdapter } from "./drivers/sqlite.js";

export type AnyMySqlDatabase = MySqlDatabase<any, any>;
export type AnyPgDatabase = PgDatabase<any, any, any>;
export type AnySQLiteDatabase = BaseSQLiteDatabase<any, any, any, any>;

export type SqlFlavorOptions =
	| AnyMySqlDatabase
	| AnyPgDatabase
	| AnySQLiteDatabase;

export type TableFn<Flavor> = Flavor extends AnyMySqlDatabase
	? MySqlTableFn
	: Flavor extends AnyPgDatabase
	? PgTableFn
	: Flavor extends AnySQLiteDatabase
	? SQLiteTableFn
	: AnySQLiteTable;

export type myDrizzleError = InstanceType<typeof DrizzleError>;

export function drizzleAdapter<SqlFlavor extends SqlFlavorOptions>(
	db: SqlFlavor,
	modelNames?: {
		user: string;
		session: string | null;
		key: string;
	},
	table?: TableFn<SqlFlavor>
): InitializeAdapter<Adapter> {
	const getModelNames = () => {
		if (!modelNames) {
			return {
				user: "auth_user",
				session: "user_session",
				key: "user_key"
			};
		}
		return modelNames;
	};

	modelNames = getModelNames();

	if (is(db, MySqlDatabase)) {
		return mySqlDrizzleAdapter(db, table as MySqlTableFn, modelNames);
	} else if (is(db, PgDatabase)) {
		return pgDrizzleAdapter(db, table as PgTableFn, modelNames);
	} else if (is(db, BaseSQLiteDatabase)) {
		return SQLiteDrizzleAdapter(db, table as SQLiteTableFn, modelNames);
	}

	throw new Error(
		`Unsupported database type (${typeof db}) in Drizzle adapter.`
	);
}
