import lucia, { generateRandomString } from 'lucia-auth';
import supabase from '@lucia-auth/adapter-supabase';
import dotenv from 'dotenv';

dotenv.config();

export const auth = lucia({
	adapter: supabase(process.env.SUPABASE_URL || '', process.env.SUPABASE_SECRET || ''),
	env: 'DEV',
	generateCustomUserId: async () => generateRandomString(8),
	transformUserData: (userData) => {
		return {
			userId: userData.id,
			username: userData.username
		};
	},
	sessionTimeout: 1000 * 5,
	csrfProtection: false
});

export type Auth = typeof auth;
