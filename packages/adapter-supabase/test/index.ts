import { Database, testAdapter } from "@lucia-sveltekit/adapter-test";
import { PostgrestClient } from "@supabase/postgrest-js"; // Supabase's realtime breaks adapter
import supabase from "../src/index.js";

const url = "";
const secret = "";

const client = new PostgrestClient(`${url}/rest/v1`, {
    headers: {
        Authorization: `Bearer ${secret}`,
        apikey: secret,
    },
});

const transformRefreshTokenRow = (refreshToken: Record<string, any>) => {
    delete refreshToken.id;
    return refreshToken;
};

const db: Database = {
    getUsers: async () => {
        const { data, error } = await client.from("user").select();
        if (!data) {
            console.error(error?.message);
            throw new Error("SUPABASE ERROR");
        }
        return data as any[];
    },
    getRefreshTokens: async () => {
        const { data, error } = await client.from("refresh_token").select();
        if (!data) {
            console.error(error?.message);
            throw new Error("SUPABASE ERROR");
        }
        return data.map((val) => transformRefreshTokenRow(val)) as any[];
    },
    insertUser: async (user) => {
        await client.from("user").insert(user);
    },
    insertRefreshToken: async (refreshToken) => {
        await client.from("refresh_token").insert(refreshToken);
    },
    clearUsers: async () => {
        await client.from("user").delete().like("id", "%");
    },
    clearRefreshTokens: async () => {
        await client.from("refresh_token").delete().like("refresh_token", "%");
    },
};

testAdapter(supabase(url, secret), db);
