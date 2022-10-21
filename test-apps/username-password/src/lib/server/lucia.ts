import lucia, { generateRandomString } from 'lucia-sveltekit';
import supabase from '@lucia-sveltekit/adapter-supabase';
import redis from '@lucia-sveltekit/session-adapter-redis';
import { createClient } from 'redis';
import { dev } from '$app/environment';
import { SUPABASE_URL, SUPABASE_SECRET } from '$env/static/private';

export const sessionInstance = createClient({
	socket: {
		port: 6379
	}
});

export const userSessionInstance = createClient({
	socket: {
		port: 6380
	}
});

export const auth = lucia({
	adapter: {
		user: supabase(SUPABASE_URL, SUPABASE_SECRET),
		session: redis({
			session: sessionInstance,
			userSession: userSessionInstance
		})
	},
	env: dev ? 'DEV' : 'PROD',
	generateCustomUserId: async () => generateRandomString(8),
	sessionTimeout: 1000 * 5,
	transformUserData: (userData) => {
		return {
			userId: userData.id,
			username: userData.username
		};
	}
});

export type Auth = typeof auth;
