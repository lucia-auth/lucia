import { lucia } from 'lucia';
import { sveltekit } from 'lucia/middleware';
import { prisma } from '@lucia-auth/adapter-prisma';
import { prismaClient } from './db';

export const auth = lucia({
	adapter: prisma({
		client: prismaClient,
		mode: 'default'
	}),
	env: import.meta.env.DEV ? 'DEV' : 'PROD',
	middleware: sveltekit(),
	getUserAttributes: (userData) => {
		return {
			emailVerified: userData.email_verified,
			email: userData.email
		};
	}
});

export type Auth = typeof auth;
