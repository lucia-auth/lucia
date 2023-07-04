import type { KeySchema, SessionSchema, UserSchema } from "lucia-auth";

export const transformToSqliteValue = <_Obj extends Record<any, any>>(
	obj: _Obj
): {
	[K in keyof _Obj]: _Obj[K] extends boolean
		? number | Exclude<_Obj[K], boolean>
		: _Obj[K];
} => {
	return Object.fromEntries(
		Object.entries(obj).map(([key, val]) => {
			if (typeof val !== "boolean") return [key, val];
			return [key, Number(val)];
		})
	) as any;
};

export const transformDatabaseSession = (
	session: SQLiteSessionSchema
): SessionSchema => {
	return {
		id: session.id,
		user_id: session.user_id,
		active_expires: Number(session.active_expires),
		idle_expires: Number(session.idle_expires)
	};
};

export const transformDatabaseKey = (key: SQLiteKeySchema): KeySchema => {
	return {
		id: key.id,
		user_id: key.user_id,
		primary_key: Boolean(key.primary_key),
		hashed_password: key.hashed_password,
		expires: key.expires === null ? null : Number(key.expires)
	};
};

export type SQLiteUserSchema = UserSchema;
export type SQLiteSessionSchema = SessionSchema;
export type SQLiteKeySchema = TransformToSQLiteSchema<KeySchema>;

export type ReplaceBooleanWithNumber<T> = Extract<T, boolean> extends never
	? T
	: Exclude<T, boolean> | number;

export type TransformToSQLiteSchema<_Schema extends {}> = {
	[K in keyof _Schema]: ReplaceBooleanWithNumber<_Schema[K]>;
};
