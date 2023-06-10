import { PrismaClient } from "@prisma/client";

let prismaClient: PrismaClient;

declare global {
	// eslint-disable-next-line no-var
	var __prisma: PrismaClient | undefined;
}

// this is needed because in development we don't want to restart
// the server with every change, but we want to make sure we don't
// create a new connection to the prisma with every change either.
if (process.env.NODE_ENV === "production") {
	prismaClient = new PrismaClient();
	prismaClient.$connect();
} else {
	if (!global.__prisma) {
		global.__prisma = new PrismaClient();
		global.__prisma.$connect();
	}
	prismaClient = global.__prisma;
}

export { prismaClient };
