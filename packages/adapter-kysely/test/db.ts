import { LuciaQueryHandler } from "@lucia-auth/adapter-test";
import { Kysely } from "kysely";
import { KyselyLuciaDatabase, KyselyUser } from "../src/index.js";
import {
	type Dialect,
	convertKey,
	convertKeySchemaToKyselyValues,
	convertSession
} from "../src/utils.js";

type User = KyselyUser & {
	username: string;
};

export type KyselyDatabase = Omit<KyselyLuciaDatabase, "user"> & {
	user: User;
};

export const createQueryHandler = (
	kysely: Kysely<KyselyDatabase>,
	dialect: Dialect
): LuciaQueryHandler => {
	return {
		user: {
			get: async () => {
				const result = await kysely.selectFrom("user").selectAll().execute();
				if (!result) throw new Error("Failed to fetch from database");
				return result;
			},
			insert: async (user) => {
				await kysely.insertInto("user").values(user).execute();
			},
			clear: async () => {
				await kysely.deleteFrom("user").execute();
			}
		},
		session: {
			get: async () => {
				const result = await kysely.selectFrom("session").selectAll().execute();
				if (!result) throw new Error("Failed to fetch from database");
				return result.map((val) => convertSession(val));
			},
			insert: async (session) => {
				await kysely.insertInto("session").values(session).execute();
			},
			clear: async () => {
				await kysely.deleteFrom("session").execute();
			}
		},
		key: {
			get: async () => {
				const result = await kysely.selectFrom("key").selectAll().execute();
				if (!result) throw new Error("Failed to fetch from database");
				return result.map((val) => convertKey(val));
			},
			insert: async (key) => {
				await kysely
					.insertInto("key")
					.values(convertKeySchemaToKyselyValues(key, dialect))
					.execute();
			},
			clear: async () => {
				await kysely.deleteFrom("key").execute();
			}
		}
	} as const;
};
