import { Database } from "@lucia-auth/adapter-test";
import { PostgrestClient } from "@supabase/postgrest-js"; // Supabase's realtime breaks adapter
import supabase from "../src/index.js";

import dotenv from "dotenv";
import { resolve } from "path";
import type { SessionSchema, UserSchema } from "lucia-auth";

dotenv.config({
	path: `${resolve()}/.env`
});

const url = process.env.SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET;

if (!url || !secret) throw new Error(".env is not set up");

const client = new PostgrestClient(`${url}/rest/v1`, {
	headers: {
		Authorization: `Bearer ${secret}`,
		apikey: secret
	}
});

export const adapter = supabase(url, secret);

export const db: Database = {
	getUsers: async () => {
		const { data } = await client.from<UserSchema>("user").select();
		if (!data) throw new Error("Failed to fetch from database");
		return data;
	},
	getSessions: async () => {
		const { data } = await client.from<SessionSchema>("session").select();
		if (!data) throw new Error("Failed to fetch from database");
		return data;
	},
	insertUser: async (user) => {
		await client.from("user").insert(user);
	},
	insertSession: async (session) => {
		await client.from("session").insert(session);
	},
	clearUsers: async () => {
		await client.from("user").delete().like("username", "user%");
	},
	clearSessions: async () => {
		await client.from("session").delete().gte("id", 0);
	}
};
