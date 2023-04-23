import type { SessionSchema, UserSchema, KeySchema } from "lucia-auth";
import { ColumnValue } from "./query.js";

export const transformDatabaseSession = (
	session: PostgresSessionSchema
): SessionSchema => {
	return {
		id: session.id,
		user_id: session.user_id,
		active_expires: Number(session.active_expires),
		idle_expires: Number(session.idle_expires)
	};
};

export const transformDatabaseKey = (key: PostgresKeySchema): KeySchema => {
	return {
		id: key.id,
		user_id: key.user_id,
		primary_key: Boolean(key.primary_key),
		hashed_password: key.hashed_password,
		expires: key.expires === null ? null : Number(key.expires)
	};
};

type PgSchema<_Schema extends Record<string, ColumnValue>> = {
	[K in keyof _Schema]: Extract<_Schema[K], number> extends never
		? _Schema[K]
		: _Schema[K] | string;
};

export type PostgresSessionSchema = PgSchema<SessionSchema>;
export type PostgresKeySchema = PgSchema<KeySchema>;
export type PostgresUserSchema = PgSchema<UserSchema>;
