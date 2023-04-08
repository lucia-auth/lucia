import lucia from "lucia-auth";
import prisma from "@lucia-auth/adapter-prisma";
import { astro } from "lucia-auth/middleware";
import { idToken } from "@lucia-auth/tokens";
import { prismaClient } from "$lib/db";

export const auth = lucia({
	env: import.meta.env.DEV ? "DEV" : "PROD",
	adapter: prisma(prismaClient),
	middleware: astro(),
	transformDatabaseUser: (userData) => {
		return {
			userId: userData.id,
			email: userData.email,
			emailVerified: userData.email_verified
		};
	}
});

export type Auth = typeof auth;

export const emailVerificationToken = idToken(auth, "email_verification", {
	expiresIn: 60 * 60
});

export const passwordResetToken = idToken(auth, "email_reset", {
	expiresIn: 60 * 60
});
