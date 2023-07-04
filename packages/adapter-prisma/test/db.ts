import { PrismaClient } from "@prisma/client";
import prisma from "../src/index.js";
import {
	transformDatabaseKey,
	transformDatabaseSession
} from "../src/utils.js";
import { KeySchema, LuciaError } from "lucia-auth";
import type { LuciaQueryHandler } from "@lucia-auth/adapter-test";

const client = new PrismaClient();
export const adapter = prisma(client)(LuciaError);

export const db: LuciaQueryHandler = {
	user: {
		get: async () => {
			return await client.authUser.findMany();
		},
		insert: async (user) => {
			await client.authUser.create({
				data: user
			});
		},
		clear: async () => {
			await client.authUser.deleteMany();
		}
	},
	session: {
		get: async () => {
			const sessions = await client.authSession.findMany();
			return sessions.map((session) => transformDatabaseSession(session));
		},
		insert: async (session) => {
			await client.authSession.create({
				data: session
			});
		},
		clear: async () => {
			await client.authSession.deleteMany();
		}
	},
	key: {
		get: async () => {
			const keys = (await client.authKey.findMany()) as unknown as KeySchema[];
			return keys.map((key) => transformDatabaseKey(key));
		},
		insert: async (key) => {
			await client.authKey.create({
				data: key
			});
		},
		clear: async () => {
			await client.authKey.deleteMany();
		}
	}
};
