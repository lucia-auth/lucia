import { Adapter, AdapterFunction } from "lucia-auth";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type {
	PgAuthKeyTable,
	PgAuthSessionTable,
	PgAuthUserTable
} from "./schema";
import { eq } from "drizzle-orm/expressions";

export const adapter =
	({
		db,
		users,
		sessions,
		keys
	}: {
		db: PostgresJsDatabase | NodePgDatabase;
		users: PgAuthUserTable;
		sessions: PgAuthSessionTable;
		keys: PgAuthKeyTable;
	}): AdapterFunction<Adapter> =>
	(LuciaError) => {
		return {
			getUser(userId) {
				return db.select().from(users).where(eq(users.id, userId));
			}
		};
	};
