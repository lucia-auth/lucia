import lucia from "lucia-auth";
import { h3 } from "lucia-auth/middleware";
import prisma from "@lucia-auth/adapter-prisma";
import { PrismaClient } from "@prisma/client";
import "lucia-auth/polyfill/node";

import { github } from "@lucia-auth/oauth/providers";

export const auth = lucia({
	adapter: prisma(new PrismaClient()),
	env: process.env.NODE_ENV === "development" ? "DEV" : "PROD",
	middleware: h3(),
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
