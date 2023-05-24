import lucia from "lucia-auth";
import path from "path";
import { nextjs } from "lucia-auth/middleware";
import prisma from "@lucia-auth/adapter-prisma";
import { PrismaClient } from "@prisma/client";
import "lucia-auth/polyfill/node";

import { apple } from "@lucia-auth/oauth/providers";

export const auth = lucia({
	adapter: prisma(new PrismaClient()),
	env: process.env.NODE_ENV === "development" ? "DEV" : "PROD",
	middleware: nextjs(),
	transformDatabaseUser: (userData) => {
		return {
			userId: userData.id,
			username: userData.username
		};
	}
});

export const appleAuth = apple(auth, {
	teamId: process.env.APPLE_TEAM_ID ?? "",
	keyId: process.env.APPLE_KEY_ID ?? "",
	certificatePath: path.join(process.cwd(), process.env.APPLE_CERT_PATH ?? ""),
	redirectUri: process.env.APPLE_REDIRECT_URI ?? "",
	clientId: process.env.APPLE_CLIENT_ID ?? ""
});

export type Auth = typeof auth;
