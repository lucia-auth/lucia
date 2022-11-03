import lucia, { generateRandomString } from 'lucia-auth';
import supabase from '@lucia-auth/adapter-supabase';

export const auth = lucia({
	adapter: supabase(process.env.SUPABASE_URL || "", process.env.SUPABASE_SECRET || ""),
	env: "DEV",
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
