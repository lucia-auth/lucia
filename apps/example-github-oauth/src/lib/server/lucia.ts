import lucia from 'lucia-sveltekit';
import prisma from '@lucia-sveltekit/adapter-prisma';
import { dev } from '$app/env';
import { PrismaClient } from '@prisma/client';

const client = new PrismaClient();

export const auth = lucia<{ username: string; email: string }>({
	adapter: prisma(client),
	secret: process.env.LUCIA_SECRET, // should be long and random
	env: dev ? 'DEV' : 'PROD'
});
