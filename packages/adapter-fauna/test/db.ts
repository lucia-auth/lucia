import { Database } from "@lucia-auth/adapter-test";
import fauna from "../src/index.js";

import dotenv from "dotenv";
import { resolve } from "path";
import faunadb from "faunadb";
import { convertUserResponse } from "../src/utils.js";
import { LuciaError, type SessionSchema } from "lucia-auth";

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

export const adapter = fauna(client)(LuciaError);

export const db: Database = {
	getUsers: async () => {
		const res: { data: any } = await client.query(
			q.Map(q.Paginate(q.Documents(q.Collection("users"))), q.Lambda("x", q.Get(q.Var("x"))))
		);
		return convertUserResponse(res.data);
	},
	getSessions: async () => {
		const res: { data: any } = await client.query(
			q.Map(q.Paginate(q.Documents(q.Collection("sessions"))), q.Lambda("x", q.Get(q.Var("x"))))
		);
		return res.data satisfies SessionSchema;
	},
	insertUser: async (user) => {
		return await client.query(q.Create(q.Collection("users"), { data: user }));
	},
	insertSession: async (session) => {
		return await client.query(q.Create(q.Collection("sessions"), { data: session }));
	},
	clearUsers: async () => {
		return await client.query(
			q.Map(
				q.Paginate(q.Documents(q.Collection("users")), { size: 100_000 }),
				q.Lambda("x", q.Delete(q.Var("x")))
			)
		);
		//TODO: Check if Collection is empty if there are more then 100_000 documents (what the first page of the pagination request returns)
	},
	clearSessions: async () => {
		return await client.query(
			q.Map(
				q.Paginate(q.Documents(q.Collection("sessions")), { size: 100_000 }),
				q.Lambda("x", q.Delete(q.Var("x")))
			)
		);
		//TODO: Check if Collection is empty if there are more then 100_000 documents (what the first page of the pagination request returns)
	}
};
