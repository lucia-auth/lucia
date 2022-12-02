import lucia from "lucia-auth";
import prisma from "@lucia-auth/adapter-prisma";
import github from "@lucia-auth/oauth/github";
import { PrismaClient } from "@prisma/client";

export const auth = lucia({
	adapter: prisma(new PrismaClient()),
	env: "DEV",
	transformUserData: (userData) => {
		return {
			userId: userData.id,
			username: userData.username
		};
	}
});

export type Auth = typeof auth;

export const githubAuth = github(auth, {
	clientId: import.meta.env.GITHUB_CLIENT_ID || "",
	clientSecret: import.meta.env.GITHUB_CLIENT_SECRET || ""
});