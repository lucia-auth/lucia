import lucia from "lucia-sveltekit"
import supabase from '@lucia-sveltekit/adapter-supabase';
import { dev } from "$app/environment";

export const auth = lucia({
	adapter: supabase(import.meta.env.VITE_SUPABASE_URL, process.env.SUPABASE_SECRET),
	secret: process.env.LUCIA_SECRET,
	env: dev ? 'DEV' : 'PROD'
});