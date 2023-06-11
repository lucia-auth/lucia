import lucia from "lucia-auth";
import "lucia-auth/polyfill/node";
import { astro } from "lucia-auth/middleware";
import prisma from "@lucia-auth/adapter-prisma";
import { PrismaClient } from "@prisma/client";

import { github } from "@lucia-auth/oauth/providers";

export const auth = lucia({
	adapter: prisma(new PrismaClient()),
	env: import.meta.env.DEV ? "DEV" : "PROD",
	transformDatabaseUser: (userData) => {
		return {
			userId: userData.id,
			username: userData.username
		};
	},
	middleware: astro()
});

export const githubAuth = github(auth, {
	clientId: import.meta.env.GITHUB_CLIENT_ID,
	clientSecret: import.meta.env.GITHUB_CLIENT_SECRET
});

export type Auth = typeof auth;
