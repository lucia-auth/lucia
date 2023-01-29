import lucia from "lucia-auth";
import prisma from "@lucia-auth/adapter-prisma";
import { PrismaClient } from "@prisma/client";

import github from "@lucia-auth/oauth/github";

export const auth = lucia({
	adapter: prisma(new PrismaClient()),
	env: import.meta.env.DEV ? "DEV" : "PROD",
	transformUserData: (userData) => {
		return {
			userId: userData.id,
			username: userData.username
		};
	}
});

export const githubAuth = github(auth, {
	clientId: import.meta.env.GITHUB_CLIENT_ID,
	clientSecret: import.meta.env.GITHUB_CLIENT_SECRET
});

export type Auth = typeof auth;
