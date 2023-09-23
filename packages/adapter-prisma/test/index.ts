import { testAdapter, Database } from "@lucia-auth/adapter-test";
import { LuciaError } from "lucia";
import { PrismaClient } from "@prisma/client";

import {
	prismaAdapter,
	transformLuciaKey,
	transformLuciaSession,
	transformPrismaKey,
	transformPrismaSession
} from "../src/prisma.js";

import type { QueryHandler } from "@lucia-auth/adapter-test";

const client = new PrismaClient();

const queryHandler: QueryHandler = {
	user: {
		get: async () => {
			return await client.user.findMany();
		},
		insert: async (value: any) => {
			await client.user.create({
				data: value
			});
		},
		clear: async () => {
			await client.user.deleteMany();
		}
	},
	session: {
		get: async () => {
			const result = await client.session.findMany();
			return result.map((val) => transformPrismaSession(val));
		},
		insert: async (value: any) => {
			await client.session.create({
				data: transformLuciaSession(value)
			});
		},
		clear: async () => {
			await client.session.deleteMany();
		}
	},
	key: {
		get: async () => {
			const result = await client.key.findMany();
			return result.map((val) => transformPrismaKey(val));
		},
		insert: async (value: any) => {
			await client.key.create({
				data: transformLuciaKey(value)
			});
		},
		clear: async () => {
			await client.key.deleteMany();
		}
	}
};

const adapter = prismaAdapter(client)(LuciaError);

await testAdapter(adapter, new Database(queryHandler));

process.exit(0);
