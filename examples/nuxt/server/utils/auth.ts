import { lucia } from "lucia";
import { h3 } from "lucia/middleware";
import { prisma } from "@lucia-auth/adapter-prisma";
import { PrismaClient } from "@prisma/client";
import "lucia-auth/polyfill/node";

import { github } from "@lucia-auth/oauth/providers";

export const auth = lucia({
	adapter: prisma({
		client: new PrismaClient(),
		mode: "default"
	}),
	env: process.dev ? "DEV" : "PROD",
	middleware: h3(),
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

const config = useRuntimeConfig();

export const githubAuth = github(auth, {
	clientId: config.github.clientId ?? "",
	clientSecret: config.github.clientSecret ?? ""
});

export type Auth = typeof auth;
