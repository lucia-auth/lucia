import { lucia } from 'lucia';
import { sveltekit } from 'lucia/middleware';
import { prisma } from '@lucia-auth/adapter-prisma';
import { dev } from '$app/environment';
import { PrismaClient } from '@prisma/client';

import { github } from '@lucia-auth/oauth/providers';
import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } from '$env/static/private';

export const auth = lucia({
	adapter: prisma({
		client: new PrismaClient(),
		mode: 'default'
	}),
	env: dev ? 'DEV' : 'PROD',
	middleware: sveltekit(),
	getUserAttributes: (userData) => {
		return {
			username: userData.username
		};
	},
	getSessionAttributes: (sessionData) => {
		return {
			createdAt: sessionData.created_at
		};
	}
});


export const githubAuth = github(auth, {
	clientId: GITHUB_CLIENT_ID,
	clientSecret: GITHUB_CLIENT_SECRET
});

export type Auth = typeof auth;
