import { lucia } from "lucia";
import { astro } from "lucia/middleware";
import { prisma } from "@lucia-auth/adapter-prisma";
import { PrismaClient } from "@prisma/client";

import { github } from "@lucia-auth/oauth/providers";

export const auth = lucia({
	adapter: prisma({
		client: new PrismaClient(),
		mode: "default"
	}),
	env: import.meta.env.DEV ? "DEV" : "PROD",
	middleware: astro(),
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
	clientId: import.meta.env.GITHUB_CLIENT_ID,
	clientSecret: import.meta.env.GITHUB_CLIENT_SECRET
});

export type Auth = typeof auth;
