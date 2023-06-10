import { lucia } from "lucia";
import { nextjs } from "lucia/middleware";
import { prisma } from "@lucia-auth/adapter-prisma";
import { PrismaClient } from "@prisma/client";

import { github } from "@lucia-auth/oauth/providers";

export const auth = lucia({
	adapter: prisma({
		client: new PrismaClient(),
		mode: "default"
	}),
	env: process.env.NODE_ENV === "development" ? "DEV" : "PROD",
	middleware: nextjs(),
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
	clientId: process.env.GITHUB_CLIENT_ID ?? "",
	clientSecret: process.env.GITHUB_CLIENT_SECRET ?? ""
});

export type Auth = typeof auth;
