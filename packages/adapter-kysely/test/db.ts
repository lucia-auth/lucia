import { LuciaQueryHandler } from "@lucia-auth/adapter-test";
import { Kysely } from "kysely";
import { KyselyLuciaDatabase, KyselyUser } from "../src/index.js";
import {
	type Dialect,
	transformKeySchemaToKyselyExpectedValue,
	transformKeyData,
	transformSessionData
} from "../src/utils.js";

export type KyselyDatabase = KyselyLuciaDatabase<{ username: string }>;

export const createQueryHandler = (
	kysely: Kysely<KyselyDatabase>,
	dialect: Dialect
): LuciaQueryHandler => {
	return {
		user: {
			get: async () => {
				const result = await kysely
					.selectFrom("auth_user")
					.selectAll()
					.execute();
				if (!result) throw new Error("Failed to fetch from database");
				return result;
			},
			insert: async (user) => {
				await kysely.insertInto("auth_user").values(user).execute();
			},
			clear: async () => {
				await kysely.deleteFrom("auth_user").execute();
			}
		},
		session: {
			get: async () => {
				const result = await kysely
					.selectFrom("auth_session")
					.selectAll()
					.execute();
				if (!result) throw new Error("Failed to fetch from database");
				return result.map((val) => transformSessionData(val));
			},
			insert: async (session) => {
				await kysely.insertInto("auth_session").values(session).execute();
			},
			clear: async () => {
				await kysely.deleteFrom("auth_session").execute();
			}
		},
		key: {
			get: async () => {
				const result = await kysely
					.selectFrom("auth_key")
					.selectAll()
					.execute();
				if (!result) throw new Error("Failed to fetch from database");
				return result.map((val) => transformKeyData(val));
			},
			insert: async (key) => {
				await kysely
					.insertInto("auth_key")
					.values(transformKeySchemaToKyselyExpectedValue(key, dialect))
					.execute();
			},
			clear: async () => {
				await kysely.deleteFrom("auth_key").execute();
			}
		}
	} as const;
};
