import {Database} from "@lucia-auth/adapter-test";
import fauna from "../src/index.js";

// @ts-ignore
import dotenv from "dotenv";
import {resolve} from "path";
// @ts-ignore
import faunadb from "faunadb";
import {convertSessionResponse, convertUserResponse} from "../src/utils.js";
const {query, Client} = faunadb;
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
})

export const adapter = fauna(client);

export const db: Database = {
	getUsers: async () => {
		console.log('get users')
		return await client.query(
			q.Map(q.Paginate(q.Documents(q.Collection("users"))), q.Lambda('x', q.Get(q.Var('x'))))
		).then((res: { data: any }) => convertUserResponse(res.data));
	},
	getSessions: async () => {
		console.log('get sessions')
		return await client.query(
			q.Map(q.Paginate(q.Documents(q.Collection("sessions"))), q.Lambda('x', q.Get(q.Var('x'))))
		).then((res: { data: any }) => convertSessionResponse(res.data));
	},
	insertUser: async (user) => {
		console.log('insert user')
		return await client.query(
			q.Create(q.Collection("users"), { data: user })
		).then((res: { data: any }) => {
			// console.log(res)
			res.data
		});
	},
	insertSession: async (session) => {
		console.log('insert session')
		return await client.query(
			q.Create(q.Collection("sessions"), { data: session })
		).then((res: { data: any }) => res.data);
	},
	clearUsers: async () => {
		console.log('clear users')
		return await client.query(
			q.Map(
				q.Paginate(q.Documents(q.Collection("users")), {size: 100000}),
				q.Lambda('x', q.Delete(q.Var('x')))
			)
		).then((res: { data: any }) => {
			// console.log(res)
			res.data
		});
		//TODO: Check if Collection is empty if there are more then 100_000 documents (what the first page of the pagination request returns)
	},
	clearSessions: async () => {
		// console.log('clear sessions')
		return await client.query(
			q.Map(
				q.Paginate(q.Documents(q.Collection("sessions")), {size: 100000}),
				q.Lambda('x', q.Delete(q.Var('x')))
			)
		).then((res: { data: any }) => {
			// console.log(res)
			res.data
		});
		//TODO: Check if Collection is empty if there are more then 100_000 documents (what the first page of the pagination request returns)
	}
};
