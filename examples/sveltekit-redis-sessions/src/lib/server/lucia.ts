import lucia from 'lucia-auth';
import { sveltekit } from 'lucia-auth/middleware';
import prismaAdapter from '@lucia-auth/adapter-prisma';
import redisAdapter from '@lucia-auth/adapter-session-redis';
import { github } from '@lucia-auth/oauth/providers';
import { prisma } from '$lib/server/prisma';
import { redis } from '$lib/server/redis';
import { dev } from '$app/environment';
import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } from '$env/static/private';

export const auth = lucia({
	adapter: {
		user: prismaAdapter(prisma),
		session: redisAdapter(redis)
	},
	env: dev ? 'DEV' : 'PROD',
	transformDatabaseUser: (userData) => {
		return {
			userId: userData.id,
			username: userData.username
		};
	},
	middleware: sveltekit()
});

export const githubAuth = github(auth, {
	clientId: GITHUB_CLIENT_ID,
	clientSecret: GITHUB_CLIENT_SECRET
});

export type Auth = typeof auth;
