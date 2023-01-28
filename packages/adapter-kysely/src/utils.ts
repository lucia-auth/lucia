import type { KeySchema, SessionSchema } from "lucia-auth";
import type { Selectable } from "kysely";
import type { KyselyKey, KyselySession } from "./types.js";

export const convertSession = (
	session: Selectable<KyselySession>
): SessionSchema => {
	return {
		id: session.id,
		user_id: session.user_id,
		active_expires: Number(session.active_expires),
		idle_expires: Number(session.idle_expires)
	};
};

export type Dialect = "pg" | "mysql2" | "better-sqlite3";

export const convertKey = (
	key: Selectable<KyselyKey>
): KeySchema => {
	console.log(key)
	return {
		id: key.id,
		user_id: key.user_id,
		primary: Boolean(key.primary),
		hashed_password: key.hashed_password
	};
};
