import { lucia } from "lucia";
import { web } from "lucia/middleware";
import { prisma } from "@lucia-auth/adapter-prisma";
import { PrismaClient } from "@prisma/client";
import { github } from "@lucia-auth/oauth/providers";
import "lucia-auth/polyfill/node";

export const auth = lucia({
	adapter: prisma({
		client: new PrismaClient(),
		mode: "default"
	}),
	env: process.env.NODE_ENV === "development" ? "DEV" : "PROD",
	middleware: web(),
	transformDatabaseUser: (userData) => {
		return {
			userId: userData.id,
			username: userData.username
		};
	}
});

export const githubAuth = github(auth, {
	clientId: process.env.GITHUB_CLIENT_ID ?? "",
	clientSecret: process.env.GITHUB_CLIENT_SECRET ?? ""
});

export type Auth = typeof auth;
