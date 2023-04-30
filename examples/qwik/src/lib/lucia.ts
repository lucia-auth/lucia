import prismaAdapter from '@lucia-auth/adapter-prisma';
import lucia from "lucia-auth";
import { qwik } from "lucia-auth/middleware";
import { prisma } from './prisma';

import { github } from "@lucia-auth/oauth/providers";

export const auth = lucia({
  adapter: prismaAdapter(prisma),
  env: process.env.NODE_ENV === "development" ? "DEV" : "PROD",
  middleware: qwik(),
  transformDatabaseUser: (userData) => ({
    userId: userData.id,
		username: userData.username
  })
});

export const githubAuth = github(auth, {
	clientId: process.env.GITHUB_CLIENT_ID ?? "",
	clientSecret: process.env.GITHUB_CLIENT_SECRET ?? ""
});

export type Auth = typeof auth;