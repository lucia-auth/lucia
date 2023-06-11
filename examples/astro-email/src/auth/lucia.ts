import { lucia } from "lucia";
import { astro } from "lucia/middleware";
import { prisma } from "@lucia-auth/adapter-prisma";
import { prismaClient } from "src/db";

export const auth = lucia({
	adapter: prisma({
		client: prismaClient,
		mode: "default"
	}),
	env: import.meta.env.DEV ? "DEV" : "PROD",
	middleware: astro(),
	getUserAttributes: (userData) => {
		return {
			emailVerified: userData.email_verified,
			email: userData.email
		};
	}
});

export type Auth = typeof auth;
