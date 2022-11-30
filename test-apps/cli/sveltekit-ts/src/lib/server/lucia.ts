import lucia from "lucia-auth";
import supabase from "@lucia-auth/adapter-supabase";
import { SUPABASE_URL, SUPABASE_SECRET } from "$env/static/private";
import { dev } from "$app/environment";

export const auth = lucia({
	adapter: supabase(SUPABASE_URL ?? "",SUPABASE_SECRET ?? ""),
	env: dev ? "DEV" : "PROD"
});	
export type Auth = typeof auth