import lucia from "lucia-auth";
import path from "path";
import { nextjs } from "lucia-auth/middleware";
import prisma from "@lucia-auth/adapter-prisma";
import { PrismaClient } from "@prisma/client";
import "lucia-auth/polyfill/node";

import { apple } from "@lucia-auth/oauth/providers";
import * as fs from "node:fs";

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

const getCertificateAsString = () => {
	const certPath = path.join(process.cwd(), process.env.APPLE_CERT_PATH ?? "");
	const cert = fs.readFileSync(certPath, "utf-8");
	return cert;
};

export const appleAuth = apple(auth, {
	teamId: process.env.APPLE_TEAM_ID ?? "",
	keyId: process.env.APPLE_KEY_ID ?? "",
	certificate: getCertificateAsString(),
	redirectUri: process.env.APPLE_REDIRECT_URI ?? "",
	clientId: process.env.APPLE_CLIENT_ID ?? ""
});

export type Auth = typeof auth;
