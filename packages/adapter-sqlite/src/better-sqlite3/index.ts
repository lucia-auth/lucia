import type { Adapter, AdapterFunction } from "lucia-auth";

import type { Database } from "better-sqlite3";
const adapter =
	(db: Database): AdapterFunction<Adapter> =>
	(LuciaError) => {
		return {
			getUser: async (userId) => {
				const data = db
					.prepare("SELECT * FROM auth_user WHERE id = ?;")
					.get(userId);
				return data ?? null;
			},
			getSessionAndUserBySessionId: async (sessionId) => {
				const data = db
					.prepare(
						`SELECT
auth_user.*,
auth_session.id as _session_id,
auth_session.active_expires as _session_active_expires,
auth_session.idle_expires as _session_idle_expires,
auth_session.user_id as _session_user_id
FROM auth_session
INNER JOIN auth_user ON auth_user.id = auth_session.user_id
WHERE auth_session.id = ?;`
					)
					.get(sessionId);
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
					session: transformSessionData({
						id: _session_id,
						user_id: _session_user_id,
						active_expires: _session_active_expires,
						idle_expires: _session_idle_expires
					})
				};
			},
			getSession: async (sessionId) => {
				const data = await db
					.prepare("SELECT * FROM auth_session WHERE id = ?")
					.get(sessionId);
				if (!data) return null;
				return transformSessionData(data);
			},
			getSessionsByUserId: async (userId) => {
				const data = db
					.prepare("SELECT * FROM auth_session where user_id = ?")
					.get(userId) as any[];
				return data.map((val) => transformSessionData(val));
			},
			setUser: async (userId, attributes, key) => {
				const user = {
					id: userId,
					...attributes
				};
				const userColumns = Object.keys(user) as (keyof typeof user)[];
				try {
					if (key) {
						const keyColumns = Object.keys(key) as (keyof typeof key)[];
						try {
							db.exec("BEGIN TRANSACTION");
							const databaseResult = db
								.prepare(
									`
	INSERT INTO auth_user (${userColumns})
	VALUES (${userColumns.map(() => "?")})
	RETURNING *`
								)
								.get(
									...userColumns.map((column) => sanitizeValue(user[column]))
								);
							db.prepare(
								`
	INSERT INTO auth_key (${keyColumns})
	VALUES (${keyColumns.map(() => "?")})`
							).run(...keyColumns.map((column) => sanitizeValue(key[column])));
							db.exec("COMMIT");
							return databaseResult;
						} catch (e) {
							if (db.inTransaction) db.prepare("ROLLBACK").run();
							throw e;
						}
					} else {
						const databaseUser = db
							.prepare(
								`
	INSERT INTO auth_user (${userColumns})
	VALUES (${userColumns.map(() => "?")}) RETURNING *`
							)
							.get(...userColumns.map((column) => sanitizeValue(user[column])));
						if (!databaseUser) return;
						return databaseUser;
					}
				} catch (e) {
					if (
						typeof e === "object" &&
						e &&
						"message" in e &&
						e.message === "UNIQUE constraint failed: auth_key.id"
					) {
						throw new LuciaError("AUTH_DUPLICATE_KEY_ID");
					}
					throw e;
				}

				// try {
				// 	// const userResult = await kysely.transaction().execute(async (trx) => {
				// 	// 	await trx
				// 	// 			.insertInto("auth_user")
				// 	// 			.values({
				// 	// 				id: userId,
				// 	// 				...attributes
				// 	// 			})
				// 	// 			.executeTakeFirstOrThrow();
				// 	// 	if (key) {
				// 	// 		await trx
				// 	// 			.insertInto("auth_key")
				// 	// 			.values(transformKeySchemaToKyselyExpectedValue(key, dialect))
				// 	// 			.execute();
				// 	// 	}
				// 	// 	return result;
				// 	// });
				// 	if (userResult) return userResult;
				// 	const result = await kysely
				// 		.selectFrom("auth_user")
				// 		.selectAll()
				// 		.where("id", "=", userId)
				// 		.executeTakeFirst();
				// 	if (!result) throw new LuciaError("AUTH_INVALID_USER_ID");
				// 	return result;
				// } catch (e) {
				// 	if (dialect === "pg") {
				// 		const error = e as Partial<PgDatabaseError>;
				// 		if (error.code === "23505" && error.detail?.includes("Key (id)")) {
				// 			throw new LuciaError("AUTH_DUPLICATE_KEY_ID");
				// 		}
				// 	}
				// 	if (dialect === "mysql2") {
				// 		const error = e as Partial<MySQLError>;
				// 		if (
				// 			error.code === "ER_DUP_ENTRY" &&
				// 			error.message?.includes("PRIMARY")
				// 		) {
				// 			throw new LuciaError("AUTH_DUPLICATE_KEY_ID");
				// 		}
				// 	}
				// 	if (dialect === "better-sqlite3") {
				// 		const error = e as Partial<SQLiteError>;
				// 		if (
				// 			error.code === "SQLITE_CONSTRAINT_PRIMARYKEY" &&
				// 			error.message?.includes(".id")
				// 		) {
				// 			throw new LuciaError("AUTH_DUPLICATE_KEY_ID");
				// 		}
				// 	}
				// 	throw e;
				// }
			}
			// deleteUser: async (userId) => {
			// 	await kysely.deleteFrom("auth_user").where("id", "=", userId).execute();
			// },
			// setSession: async (session) => {
			// 	try {
			// 		await kysely.insertInto("auth_session").values(session).execute();
			// 	} catch (e) {
			// 		if (dialect === "pg") {
			// 			const error = e as Partial<PgDatabaseError>;
			// 			if (
			// 				error.code === "23503" &&
			// 				error.detail?.includes("Key (user_id)")
			// 			) {
			// 				throw new LuciaError("AUTH_INVALID_USER_ID");
			// 			}
			// 			if (error.code === "23505" && error.detail?.includes("Key (id)")) {
			// 				throw new LuciaError("AUTH_DUPLICATE_SESSION_ID");
			// 			}
			// 		}
			// 		if (dialect === "mysql2") {
			// 			const error = e as Partial<MySQLError>;
			// 			if (
			// 				error.errno === 1452 &&
			// 				error.message?.includes("(`user_id`)")
			// 			) {
			// 				throw new LuciaError("AUTH_INVALID_USER_ID");
			// 			}
			// 			if (
			// 				error.code === "ER_DUP_ENTRY" &&
			// 				error.message?.includes("PRIMARY")
			// 			) {
			// 				throw new LuciaError("AUTH_DUPLICATE_SESSION_ID");
			// 			}
			// 		}
			// 		if (dialect === "better-sqlite3") {
			// 			const error = e as Partial<SQLiteError>;
			// 			if (error.code === "SQLITE_CONSTRAINT_FOREIGNKEY") {
			// 				const result = await kysely
			// 					.selectFrom("auth_user")
			// 					.select("id")
			// 					.where("id", "=", session.user_id)
			// 					.executeTakeFirst();
			// 				if (!result) throw new LuciaError("AUTH_INVALID_USER_ID"); // foreign key error on user_id column
			// 			}
			// 			if (
			// 				error.code === "SQLITE_CONSTRAINT_PRIMARYKEY" &&
			// 				error.message?.includes(".id")
			// 			) {
			// 				throw new LuciaError("AUTH_DUPLICATE_SESSION_ID");
			// 			}
			// 		}
			// 		throw e;
			// 	}
			// },
			// deleteSession: async (sessionId) => {
			// 	await kysely
			// 		.deleteFrom("auth_session")
			// 		.where("id", "=", sessionId)
			// 		.execute();
			// },
			// deleteSessionsByUserId: async (userId) => {
			// 	await kysely
			// 		.deleteFrom("auth_session")
			// 		.where("user_id", "=", userId)
			// 		.execute();
			// },
			// updateUserAttributes: async (userId, attributes) => {
			// 	if (Object.keys(attributes).length === 0) {
			// 		const user = await kysely
			// 			.selectFrom("auth_user")
			// 			.where("id", "=", userId)
			// 			.selectAll()
			// 			.executeTakeFirst();
			// 		if (!user) throw new LuciaError("AUTH_INVALID_USER_ID");
			// 		return user;
			// 	}
			// 	if (dialect === "mysql2") {
			// 		await kysely
			// 			.updateTable("auth_user")
			// 			.set(attributes)
			// 			.where("id", "=", userId)
			// 			.executeTakeFirst();
			// 		const user = await kysely
			// 			.selectFrom("auth_user")
			// 			.selectAll()
			// 			.where("id", "=", userId)
			// 			.executeTakeFirst();
			// 		if (!user) throw new LuciaError("AUTH_INVALID_USER_ID");
			// 		return user;
			// 	}
			// 	const user = await kysely
			// 		.updateTable("auth_user")
			// 		.set(attributes)
			// 		.where("id", "=", userId)
			// 		.returningAll()
			// 		.executeTakeFirst();
			// 	if (!user) throw new LuciaError("AUTH_INVALID_USER_ID");
			// 	return user;
			// },
			// setKey: async (key) => {
			// 	try {
			// 		await kysely
			// 			.insertInto("auth_key")
			// 			.values(transformKeySchemaToKyselyExpectedValue(key, dialect))
			// 			.execute();
			// 	} catch (e) {
			// 		if (dialect === "pg") {
			// 			const error = e as Partial<PgDatabaseError>;
			// 			if (
			// 				error.code === "23503" &&
			// 				error.detail?.includes("Key (user_id)")
			// 			) {
			// 				throw new LuciaError("AUTH_INVALID_USER_ID");
			// 			}
			// 			if (error.code === "23505" && error.detail?.includes("Key (id)")) {
			// 				throw new LuciaError("AUTH_DUPLICATE_KEY_ID");
			// 			}
			// 		}
			// 		if (dialect === "mysql2") {
			// 			const error = e as Partial<MySQLError>;
			// 			if (
			// 				error.errno === 1452 &&
			// 				error.message?.includes("(`user_id`)")
			// 			) {
			// 				throw new LuciaError("AUTH_INVALID_USER_ID");
			// 			}
			// 			if (
			// 				error.code === "ER_DUP_ENTRY" &&
			// 				error.message?.includes("PRIMARY")
			// 			) {
			// 				throw new LuciaError("AUTH_DUPLICATE_KEY_ID");
			// 			}
			// 		}
			// 		if (dialect === "better-sqlite3") {
			// 			const error = e as Partial<SQLiteError>;
			// 			if (error.code === "SQLITE_CONSTRAINT_FOREIGNKEY") {
			// 				const result = await kysely
			// 					.selectFrom("auth_user")
			// 					.select("id")
			// 					.where("id", "=", key.user_id)
			// 					.executeTakeFirst();
			// 				if (!result) throw new LuciaError("AUTH_INVALID_USER_ID"); // foreign key error on user_id column
			// 			}
			// 			if (
			// 				error.code === "SQLITE_CONSTRAINT_PRIMARYKEY" &&
			// 				error.message?.includes(".id")
			// 			) {
			// 				throw new LuciaError("AUTH_DUPLICATE_KEY_ID");
			// 			}
			// 		}
			// 		throw e;
			// 	}
			// },
			// getKey: async (key, shouldDataBeDeleted) => {
			// 	return await kysely.transaction().execute(async (trx) => {
			// 		const data = await trx
			// 			.selectFrom("auth_key")
			// 			.selectAll()
			// 			.where("id", "=", key)
			// 			.executeTakeFirst();
			// 		if (!data) return null;
			// 		const transformedKeyData = transformKeyData(data);
			// 		const dataShouldBeDeleted = await shouldDataBeDeleted(
			// 			transformedKeyData
			// 		);
			// 		if (dataShouldBeDeleted) {
			// 			await trx
			// 				.deleteFrom("auth_key")
			// 				.where("id", "=", data.id)
			// 				.executeTakeFirst();
			// 		}
			// 		return transformedKeyData;
			// 	});
			// },
			// getKeysByUserId: async (userId) => {
			// 	const data = await kysely
			// 		.selectFrom("auth_key")
			// 		.selectAll()
			// 		.where("user_id", "=", userId)
			// 		.execute();
			// 	return data.map((val) => transformKeyData(val));
			// },
			// updateKeyPassword: async (key, hashedPassword) => {
			// 	if (dialect === "mysql2") {
			// 		const data = await kysely
			// 			.selectFrom("auth_key")
			// 			.selectAll()
			// 			.where("id", "=", key)
			// 			.executeTakeFirst();
			// 		if (!data) throw new LuciaError("AUTH_INVALID_KEY_ID");
			// 		await kysely
			// 			.updateTable("auth_key")
			// 			.set({
			// 				hashed_password: hashedPassword
			// 			})
			// 			.where("id", "=", key)
			// 			.executeTakeFirst();
			// 		return;
			// 	}
			// 	const data = await kysely
			// 		.updateTable("auth_key")
			// 		.set({
			// 			hashed_password: hashedPassword
			// 		})
			// 		.where("id", "=", key)
			// 		.returning("id")
			// 		.executeTakeFirst();
			// 	if (!data) throw new LuciaError("AUTH_INVALID_KEY_ID");
			// },
			// deleteKeysByUserId: async (userId) => {
			// 	await kysely
			// 		.deleteFrom("auth_key")
			// 		.where("user_id", "=", userId)
			// 		.execute();
			// },
			// deleteNonPrimaryKey: async (key) => {
			// 	await kysely
			// 		.deleteFrom("auth_key")
			// 		.where("id", "=", key)
			// 		.where(
			// 			"primary_key",
			// 			"=",
			// 			dialect === "better-sqlite3" ? Number(false) : false
			// 		)
			// 		.executeTakeFirst();
			// }
		};
	};

export default adapter;

import type { KeySchema, SessionSchema } from "lucia-auth";
import type { Selectable } from "kysely";

export const transformSessionData = (session: any): SessionSchema => {
	return {
		id: session.id,
		user_id: session.user_id,
		active_expires: Number(session.active_expires),
		idle_expires: Number(session.idle_expires)
	};
};

export type Dialect = "pg" | "mysql2" | "better-sqlite3";

export const transformKeyData = (key: any): KeySchema => {
	return {
		id: key.id,
		user_id: key.user_id,
		primary_key: Boolean(key.primary_key),
		hashed_password: key.hashed_password,
		expires: key.expires === null ? null : Number(key.expires)
	};
};

export const transformKeySchemaToKyselyExpectedValue = (
	key: KeySchema,
	dialect: Dialect
): Selectable<any> => {
	return {
		id: key.id,
		user_id: key.user_id,
		primary_key: dialect === "pg" ? key.primary_key : Number(key.primary_key),
		hashed_password: key.hashed_password,
		expires: key.expires
	};
};

const sanitizeValue = (val: unknown) => {
	if (typeof val === "boolean") return Number(val);
	return val;
};
