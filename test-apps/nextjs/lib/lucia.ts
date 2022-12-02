import lucia from "lucia-auth";
import prisma from "@lucia-auth/adapter-prisma";
import { PrismaClient } from "@prisma/client";

export const auth = lucia({
	adapter: prisma(new PrismaClient()),
	env: "DEV",
	sessionTimeout: 1000 * 5,
	transformUserData: (userData) => {
		return {
			userId: userData.id,
			username: userData.username
		};
	}
});

export type Auth = typeof auth;
