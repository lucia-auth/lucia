import lucia from "lucia-auth";
import prisma from "@lucia-auth/adapter-prisma";
import { PrismaClient } from "@prisma/client";

import github from "@lucia-auth/oauth/github";

export const auth = lucia({
	adapter: prisma(new PrismaClient()),
	env: "DEV",
	sessionTimeout: 1000 * 5,
	transformUserData: (userData) => {
		return {
			userId: userData.id,
			username: userData.username
		};
	}
});

export const githubAuth = github(auth, {
	clientId: process.env.GITHUB_CLIENT_ID || "",
	clientSecret: process.env.GITHUB_CLIENT_SECRET || ""
});

export type Auth = typeof auth;
