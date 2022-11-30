import lucia from "lucia-auth";
import supabase from "@lucia-auth/adapter-supabase";

export const auth = lucia({
	adapter: supabase(process.env.SUPABASE_URL ?? "",process.env.SUPABASE_SECRET ?? ""),
	env: process.env.PROD === "TRUE" ? "PROD" : "DEV"
});	
export type Auth = typeof auth