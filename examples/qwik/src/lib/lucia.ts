import { prisma } from "@lucia-auth/adapter-prisma";
import { lucia } from "lucia";
import { qwik } from "lucia/middleware";
import { prismaClient } from "./prisma";

export const auth = lucia({
	adapter: prisma({
		client: prismaClient,
		mode: "default"
	}),
	env: process.env.NODE_ENV === "development" ? "DEV" : "PROD",
	middleware: qwik(),
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

export type Auth = typeof auth;
