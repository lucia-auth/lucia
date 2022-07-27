import lucia from 'lucia-sveltekit';
import supabase from '@lucia-sveltekit/adapter-supabase';
import { dev } from '$app/env';

export const auth = lucia({
	adapter: supabase(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_SECRET),
	secret: import.meta.env.VITE_LUCIA_SECRET,
	env: dev ? 'DEV' : 'PROD'
});
