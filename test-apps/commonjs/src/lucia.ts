import { PrismaClient } from "@prisma/client";
import imports from "./imports";
import { z } from "zod";

const registerSchema = z.object({
	username: z.string(),
	password: z.string()
});

const luciaAuth = imports.then(({ lucia, prisma, github }) => {
	const auth = lucia({
		adapter: prisma(new PrismaClient()),
		env: process.env.NODE_ENV === "development" ? "DEV" : "PROD",
		transformUserData: (userData) => {
			return {
				userId: userData.id,
				username: userData.username
			};
		}
	});

	const githubAuth = github(auth, {
		clientId: process.env.GITHUB_CLIENT_ID ?? "",
		clientSecret: process.env.GITHUB_CLIENT_SECRET ?? ""
	});

	return { auth, githubAuth };
});

type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
export type Auth = UnwrapPromise<typeof luciaAuth>["auth"];

export const auth = luciaAuth.then((a) => a.auth);
export const githubAuth = luciaAuth.then((a) => a.githubAuth);
