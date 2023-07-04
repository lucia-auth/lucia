import type { KeySchema, SessionSchema, UserSchema } from "lucia-auth";

export const transformDatabaseSession = (
	session: MySQLSessionSchema
): SessionSchema => {
	return {
		id: session.id,
		user_id: session.user_id,
		active_expires: Number(session.active_expires),
		idle_expires: Number(session.idle_expires)
	};
};

export const transformDatabaseKey = (key: MySQLKeySchema): KeySchema => {
	return {
		id: key.id,
		user_id: key.user_id,
		primary_key: Boolean(key.primary_key),
		hashed_password: key.hashed_password,
		expires: key.expires === null ? null : Number(key.expires)
	};
};

export type MySQLUserSchema = UserSchema;
export type MySQLSessionSchema = SessionSchema;
export type MySQLKeySchema = TransformToMySQLSchema<KeySchema>;

export type ReplaceBooleanWithNumber<T> = Extract<T, boolean> extends never
	? T
	: Exclude<T, boolean> | number;

export type TransformToMySQLSchema<_Schema extends {}> = {
	[K in keyof _Schema]: ReplaceBooleanWithNumber<_Schema[K]>;
};
