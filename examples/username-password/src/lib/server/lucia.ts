import lucia from "lucia-sveltekit"
import supabase from '@lucia-sveltekit/adapter-supabase';
import { dev } from "$app/environment";

export const auth = lucia({
	adapter: supabase(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_SECRET),
	env: dev ? 'DEV' : 'PROD'
});