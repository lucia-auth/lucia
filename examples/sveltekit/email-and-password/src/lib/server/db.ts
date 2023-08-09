import sqlite from 'better-sqlite3';
import fs from 'fs';
import { Kysely, SqliteDialect } from 'kysely';

import type { ColumnType } from 'kysely';

export const sqliteDatabase = sqlite(':memory:');
sqliteDatabase.exec(fs.readFileSync('schema.sql', 'utf8'));

const dialect = new SqliteDialect({
	database: sqliteDatabase
});

export const db = new Kysely<Database>({
	dialect
});

type Database = {
	user: UserTable;
	user_session: SessionTable;
	user_key: KeyTable;
	email_verification_token: VerificationTokenTable;
	password_reset_token: VerificationTokenTable;
};

type UserTable = {
	id: string;
	email: string;
	email_verified: number;
};

type SessionTable = {
	id: string;
	user_id: string;
	idle_expires: ColumnType<bigint, number>;
	active_expires: ColumnType<bigint, number>;
};

type KeyTable = {
	id: string;
	user_id: string;
	hashed_password: null | string;
};

type VerificationTokenTable = {
	id: string;
	user_id: string;
	expires: ColumnType<bigint, number>;
};
