import lucia from 'lucia-sveltekit';
import supabase from '@lucia-sveltekit/adapter-supabase';
import { prod } from '$app/env';

export const auth = lucia({
	adapter: supabase(
		"SUPABASE_URL",
		"SUPABSE_SERVICE_ROLE"
	),
	secret: "SECRET_KEY", // should be long and random
	env: prod ? 'PROD' : 'DEV'
});
