import lucia from "lucia-auth";
import { h3 } from "lucia-auth/middleware";
import prisma from "@lucia-auth/adapter-prisma";
import { PrismaClient } from "@prisma/client";
import "lucia-auth/polyfill/node";

import { github } from "@lucia-auth/oauth/providers";

export const auth = lucia({
	adapter: prisma(new PrismaClient()),
	env: process.dev ? "DEV" : "PROD",
	middleware: h3(),
	transformDatabaseUser: (userData) => {
		return {
			userId: userData.id,
			username: userData.username
		};
	}
});

const config = useRuntimeConfig();

export const githubAuth = github(auth, {
	clientId: config.github.clientId ?? "",
	clientSecret: config.github.clientSecret ?? ""
});

export type Auth = typeof auth;
