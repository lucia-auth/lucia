import type { Kysely } from "kysely";
import { Dialect, convertKey, convertSession } from "./utils.js";
import type { Adapter, AdapterFunction, UserSchema } from "lucia-auth";
import type {
	KyselyLuciaDatabase,
	KyselySession,
	KyselyUser
} from "./types.js";
import type { DatabaseError as PgDatabaseError } from "pg";
import type { QueryError as MySQLError } from "mysql2";
export * from "./types.js";

type SQLiteError = {
	message: string;
	code: string;
};

type IsValidKyselySchema<KyselyDatabase> = KyselyDatabase extends {
	user: any;
	session: any;
}
	? KyselyDatabase["user"] extends KyselyUser
		? KyselyDatabase["session"] extends KyselySession
			? true
			: false
		: false
	: false;

// Kysely<{user: any, session: any, some_table: any}> doesn't extend Kysely<KyselyLuciaDatabase>
// nor does Kysely<{user: UserWithCustomAttributes, session: any}>

// this infers the Database schema from the Kysely type and uses conditional types to check the
const adapter =
	<DB extends Kysely<any>>(
		db: DB extends Kysely<infer KyselyDatabase>
			? IsValidKyselySchema<KyselyDatabase> extends true
				? DB
				: never
			: never,
		dialect: Dialect
	): AdapterFunction<Adapter> =>
	(LuciaError) => {
		const kysely = db as Kysely<KyselyLuciaDatabase>;
		return {
			getUser: async (userId) => {
				const data = await kysely
					.selectFrom("user")
					.selectAll()
					.where("id", "=", userId)
					.executeTakeFirst();
				return data ?? null;
			},
			getUserByKey: async (key) => {
				const data = await kysely
					.selectFrom("key")
					.innerJoin("user", "user.id", "key.user_id")
					.selectAll("user")
					.where("key.id", "=", key)
					.executeTakeFirst();
				if (!data) return null;
				return data;
			},
			getSessionAndUserBySessionId: async (sessionId) => {
				const data = await kysely
					.selectFrom("session")
					.innerJoin("user", "user.id", "session.user_id")
					.selectAll("user")
					.select([
						"session.id as _session_id",
						"session.active_expires as _session_active_expires",
						"session.idle_expires as _session_idle_expires",
						"session.user_id as _session_user_id"
					])
					.where("session.id", "=", sessionId)
					.executeTakeFirst();
				if (!data) return null;
				const {
					_session_active_expires,
					_session_id,
					_session_idle_expires,
					_session_user_id,
					...user
				} = data;
				return {
					user,
					session: convertSession({
						id: _session_id,
						user_id: _session_user_id,
						active_expires: _session_active_expires,
						idle_expires: _session_idle_expires
					})
				};
			},
			getSession: async (sessionId) => {
				const data = await kysely
					.selectFrom("session")
					.selectAll()
					.where("id", "=", sessionId)
					.executeTakeFirst();
				if (!data) return null;
				return convertSession(data);
			},
			getSessionsByUserId: async (userId) => {
				const data = await kysely
					.selectFrom("session")
					.selectAll()
					.where("user_id", "=", userId)
					.execute();
				return data.map((session) => convertSession(session));
			},
			setUser: async (userId, attributes) => {
				if (dialect === "pg") {
					const user = await kysely
						.insertInto("user")
						.values({
							id: userId ?? undefined,
							...attributes
						})
						.returningAll()
						.executeTakeFirstOrThrow();
					return user;
				}
				const id = userId ?? crypto.randomUUID();
				await kysely
					.insertInto("user")
					.values({
						id,
						...attributes
					})
					.executeTakeFirstOrThrow();
				return {
					id,
					...attributes
				} as UserSchema;
			},
			deleteUser: async (userId) => {
				await kysely.deleteFrom("user").where("id", "=", userId).execute();
			},
			setSession: async (sessionId, data) => {
				try {
					await kysely
						.insertInto("session")
						.values({
							id: sessionId,
							user_id: data.userId,
							active_expires: data.activePeriodExpires,
							idle_expires: data.idlePeriodExpires
						})
						.execute();
				} catch (e) {
					if (dialect === "pg") {
						const error = e as Partial<PgDatabaseError>;
						if (
							error.code === "23503" &&
							error.detail?.includes("Key (user_id)")
						) {
							throw new LuciaError("AUTH_INVALID_USER_ID");
						}
						if (error.code === "23505" && error.detail?.includes("Key (id)")) {
							throw new LuciaError("AUTH_DUPLICATE_SESSION_ID");
						}
					}
					if (dialect === "mysql2") {
						const error = e as Partial<MySQLError>;
						if (
							error.errno === 1452 &&
							error.message?.includes("(`user_id`)")
						) {
							throw new LuciaError("AUTH_INVALID_USER_ID");
						}
						if (
							error.code === "ER_DUP_ENTRY" &&
							error.message?.includes("PRIMARY")
						) {
							throw new LuciaError("AUTH_DUPLICATE_SESSION_ID");
						}
					}
					if (dialect === "better-sqlite3") {
						const error = e as Partial<SQLiteError>;
						if (error.code === "SQLITE_CONSTRAINT_FOREIGNKEY") {
							const result = await kysely
								.selectFrom("user")
								.select("id")
								.where("id", "is", data.userId)
								.executeTakeFirst();
							if (!result) throw new LuciaError("AUTH_INVALID_USER_ID"); // foreign key error on user_id column
						}
						if (
							error.code === "SQLITE_CONSTRAINT_PRIMARYKEY" &&
							error.message?.includes(".id")
						) {
							throw new LuciaError("AUTH_DUPLICATE_SESSION_ID");
						}
					}
					throw e;
				}
			},
			deleteSession: async (...sessionIds) => {
				await kysely
					.deleteFrom("session")
					.where("id", "in", sessionIds)
					.execute();
			},
			deleteSessionsByUserId: async (userId) => {
				await kysely
					.deleteFrom("session")
					.where("user_id", "=", userId)
					.execute();
			},
			updateUserAttributes: async (userId, attributes) => {
				if (Object.keys(attributes).length === 0) {
					const user = await kysely
						.selectFrom("user")
						.where("id", "=", userId)
						.selectAll()
						.executeTakeFirst();
					if (!user) throw new LuciaError("AUTH_INVALID_USER_ID");
					return user;
				}
				if (dialect === "mysql2") {
					await kysely
						.updateTable("user")
						.set(attributes)
						.where("id", "=", userId)
						.executeTakeFirst();
					const user = await kysely
						.selectFrom("user")
						.selectAll()
						.where("id", "=", userId)
						.executeTakeFirst();
					if (!user) throw new LuciaError("AUTH_INVALID_USER_ID");
					return user;
				}
				try {
					const user = await kysely
						.updateTable("user")
						.set(attributes)
						.where("id", "=", userId)
						.returningAll()
						.executeTakeFirst();
					if (!user) throw new LuciaError("AUTH_INVALID_USER_ID");
					return user;
				} catch (e) {
					console.log(e);
					throw e;
				}
			},
			setKey: async (key, data) => {
				try {
					await kysely
						.insertInto("key")
						.values({
							id: key,
							user_id: data.userId,
							hashed_password: data.hashedPassword,
							primary:
								dialect === "better-sqlite3"
									? Number(data.isPrimary)
									: data.isPrimary
						})
						.execute();
				} catch (e) {
					if (dialect === "pg") {
						const error = e as Partial<PgDatabaseError>;
						if (
							error.code === "23503" &&
							error.detail?.includes("Key (user_id)")
						) {
							throw new LuciaError("AUTH_INVALID_USER_ID");
						}
						if (error.code === "23505" && error.detail?.includes("Key (id)")) {
							throw new LuciaError("AUTH_DUPLICATE_KEY");
						}
					}
					if (dialect === "mysql2") {
						const error = e as Partial<MySQLError>;
						if (
							error.errno === 1452 &&
							error.message?.includes("(`user_id`)")
						) {
							throw new LuciaError("AUTH_INVALID_USER_ID");
						}
						if (
							error.code === "ER_DUP_ENTRY" &&
							error.message?.includes("PRIMARY")
						) {
							throw new LuciaError("AUTH_DUPLICATE_KEY");
						}
					}
					if (dialect === "better-sqlite3") {
						const error = e as Partial<SQLiteError>;
						if (error.code === "SQLITE_CONSTRAINT_FOREIGNKEY") {
							const result = await kysely
								.selectFrom("user")
								.select("id")
								.where("id", "is", data.userId)
								.executeTakeFirst();
							if (!result) throw new LuciaError("AUTH_INVALID_USER_ID"); // foreign key error on user_id column
						}
						if (
							error.code === "SQLITE_CONSTRAINT_PRIMARYKEY" &&
							error.message?.includes(".id")
						) {
							throw new LuciaError("AUTH_DUPLICATE_KEY");
						}
					}
				}
			},
			getKey: async (key) => {
				const data = await kysely
					.selectFrom("key")
					.selectAll()
					.where("id", "=", key)
					.executeTakeFirst();
				return data ? convertKey(data) : null;
			},
			getKeysByUserId: async (userId) => {
				const data = await kysely
					.selectFrom("key")
					.selectAll()
					.where("user_id", "=", userId)
					.execute();
				return data.map((val) => convertKey(val));
			},
			updateKeyPassword: async (key, hashedPassword) => {
				if (dialect === "mysql2") {
					const data = await kysely
						.selectFrom("key")
						.selectAll()
						.where("id", "=", key)
						.executeTakeFirst();
					if (!data) throw new LuciaError("AUTH_INVALID_KEY");
					await kysely
						.updateTable("key")
						.set({
							hashed_password: hashedPassword
						})
						.where("id", "=", key)
						.executeTakeFirst();
					return;
				}
				const data = await kysely
					.updateTable("key")
					.set({
						hashed_password: hashedPassword
					})
					.where("id", "=", key)
					.returning("id")
					.executeTakeFirst();
				if (!data) throw new LuciaError("AUTH_INVALID_KEY");
			},
			deleteKeysByUserId: async (userId) => {
				await kysely.deleteFrom("key").where("user_id", "=", userId).execute();
			},
			deleteNonPrimaryKey: async (key) => {
				await kysely
					.deleteFrom("key")
					.where("id", "=", key)
					.where(
						"primary",
						"=",
						dialect === "better-sqlite3" ? Number(false) : false
					)
					.executeTakeFirst();
			}
		};
	};

export default adapter;
