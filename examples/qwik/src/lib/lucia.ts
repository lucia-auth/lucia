import prismaAdapter from "@lucia-auth/adapter-prisma";
import lucia from "lucia-auth";
import { qwik } from "lucia-auth/middleware";
import { prisma } from "./prisma";

export const auth = lucia({
	adapter: prismaAdapter(prisma),
	env: process.env.NODE_ENV === "development" ? "DEV" : "PROD",
	middleware: qwik(),
	transformDatabaseUser: (userData) => ({
		userId: userData.id,
		username: userData.username
	})
});

export type Auth = typeof auth;
