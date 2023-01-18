import { Database } from "@lucia-auth/adapter-test";
import fauna from "../src/index.js";

import dotenv from "dotenv";
import { resolve } from "path";
import faunadb from "faunadb";
import {
	convertMultipleSessionResponse,
	convertMultipleUsersResponse
} from "../src/utils.js";
import { LuciaError, type SessionSchema, UserSchema } from "lucia-auth";

const { query, Client } = faunadb;
const FaunaClient = Client;
const q = query;

dotenv.config({
	path: `${resolve()}/.env`
});

const FAUNA_SECRET = process.env.FAUNA_SECRET;
const FAUNA_ENDPOINT = process.env.FAUNA_ENDPOINT;

if (!FAUNA_SECRET || !FAUNA_ENDPOINT) throw new Error(".env is not set up");

const client = new FaunaClient({
	secret: FAUNA_SECRET,
	endpoint: FAUNA_ENDPOINT
});

const FAUNA_USER_TABLE = process.env.FAUNA_USER_TABLE;
const FAUNA_SESSION_TABLE = process.env.FAUNA_SESSION_TABLE;

export const adapter = fauna(client, {
	userTable: FAUNA_USER_TABLE,
	sessionTable: FAUNA_SESSION_TABLE
})(LuciaError);

export const db: Database = {
	getUsers: async () => {
		const res: { data: any } = await client.query(
			q.Map(
				q.Paginate(q.Documents(q.Collection(FAUNA_USER_TABLE))),
				q.Lambda("x", q.Get(q.Var("x")))
			)
		);
		return convertMultipleUsersResponse(res) satisfies UserSchema[];
	},
	getSessions: async () => {
		const res: { data: any } = await client.query(
			q.Map(
				q.Paginate(q.Documents(q.Collection(FAUNA_SESSION_TABLE))),
				q.Lambda("x", q.Get(q.Var("x")))
			)
		);
		return convertMultipleSessionResponse(res) satisfies SessionSchema[];
	},
	insertUser: async (user) => {
		return await client.query(
			q.Create(q.Collection(FAUNA_USER_TABLE), { data: user })
		);
	},
	insertSession: async (session) => {
		return await client.query(
			q.Create(q.Collection(FAUNA_SESSION_TABLE), { data: session })
		);
	},
	clearUsers: async () => {
		return await client.query(
			q.Map(
				q.Paginate(q.Documents(q.Collection(FAUNA_USER_TABLE)), {
					size: 100_000
				}),
				q.Lambda("x", q.Delete(q.Var("x")))
			)
		);
		//TODO: Check if Collection is empty if there are more then 100_000 documents (what the first page of the pagination request returns)
	},
	clearSessions: async () => {
		return await client.query(
			q.Map(
				q.Paginate(q.Documents(q.Collection(FAUNA_SESSION_TABLE)), {
					size: 100_000
				}),
				q.Lambda("x", q.Delete(q.Var("x")))
			)
		);
		//TODO: Check if Collection is empty if there are more then 100_000 documents (what the first page of the pagination request returns)
	}
};
