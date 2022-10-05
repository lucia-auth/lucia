import {
    Database,
    testAdapter,
} from "@lucia-sveltekit/adapter-test";
import { PostgrestClient } from "@supabase/postgrest-js"; // Supabase's realtime breaks adapter
import supabase from "../src/index.js";

import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({
    path: `${resolve()}/.env`,
});

const url = process.env.SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET;

if (!url || !secret) throw new Error(".env is not set up");

const client = new PostgrestClient(`${url}/rest/v1`, {
    headers: {
        Authorization: `Bearer ${secret}`,
        apikey: secret,
    },
});

const db: Database = {
    getUsers: async () => {
        const { data } = await client.from<UserRow>("user").select();
        if (!data) throw new Error("Failed to fetch from database");
        return data
    },
    getRefreshTokens: async () => {
        const { data } = await client
            .from<RefreshTokenRow>("refresh_token")
            .select();
        if (!data) throw new Error("Failed to fetch from database");
        return data.map((val) => {
            const { id: _, ...expectedValue } = val;
            return expectedValue
        });
    },
    getSessions: async () => {
        const { data } = await client
            .from<SessionRow>("session")
            .select();
        if (!data) throw new Error("Failed to fetch from database");
        return data.map((val) => {
            const { id: _, ...expectedValue } = val;
            return expectedValue
        });
    },
    insertUser: async (user) => {
        await client.from("user").insert(user);
    },
    insertRefreshToken: async (refreshToken) => {
        await client.from("refresh_token").insert(refreshToken);
    },
    insertSession: async (session) => {
        await client.from("session").insert(session)
    },
    clearUsers: async () => {
        await client.from("user").delete().like("id", "%");
    },
    clearRefreshTokens: async () => {
        await client.from("refresh_token").delete().gte("id", 0);
    },
    clearSessions: async () => {
        await client.from("session").delete().gte("id", 0)
    }
};

testAdapter(supabase(url, secret), db);
