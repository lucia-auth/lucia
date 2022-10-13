import lucia from "lucia-sveltekit"
import supabase from '@lucia-sveltekit/adapter-supabase';
import { dev } from "$app/environment";

export const auth = lucia({
	adapter: supabase(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_SECRET),
	env: dev ? 'DEV' : 'PROD'
});