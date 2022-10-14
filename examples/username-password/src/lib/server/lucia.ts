import lucia from "lucia-sveltekit"
import supabase from '@lucia-sveltekit/adapter-supabase';
import { dev } from "$app/environment";
import { SUPABASE_URL, SUPABASE_SECRET} from "$env/static/private"

export const auth = lucia({
	adapter: supabase(SUPABASE_URL, SUPABASE_SECRET),
	env: dev ? 'DEV' : 'PROD'
});