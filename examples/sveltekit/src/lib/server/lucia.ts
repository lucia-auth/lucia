import lucia from 'lucia-auth';
import { sveltekit } from 'lucia-auth/middleware';
import prisma from '@lucia-auth/adapter-prisma';
import { dev } from '$app/environment';
import { PrismaClient } from '@prisma/client';

import { github } from '@lucia-auth/oauth/providers';
import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } from '$env/static/private';

export const auth = lucia({
	adapter: prisma(new PrismaClient()),
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
