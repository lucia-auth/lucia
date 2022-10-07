import { Database } from "@lucia-sveltekit/adapter-test";
import { PrismaClient } from "@prisma/client";
import prisma from "../src/index.js";

const client = new PrismaClient();
export const adapter = prisma(client);

export const db: Database = {
    getUsers: async () => {
        return await client.user.findMany();
    },
    getRefreshTokens: async () => {
        const refreshTokens = await client.refreshToken.findMany();
        return refreshTokens;
    },
    getSessions: async () => {
        const sessions = await client.session.findMany();
        return sessions.map((val) => {
            const { expires, ...other } = val;
            return {
                expires: Number(expires),
                ...other,
            };
        });
    },
    insertUser: async (user) => {
        await client.user.create({
            data: user,
        });
    },
    insertRefreshToken: async (refreshToken) => {
        await client.refreshToken.create({
            data: refreshToken,
        });
    },
    insertSession: async (session) => {
        await client.session.create({
            data: session,
        });
    },
    clearUsers: async () => {
        await client.user.deleteMany();
    },
    clearRefreshTokens: async () => {
        await client.refreshToken.deleteMany();
    },
    clearSessions: async () => {
        await client.session.deleteMany();
    },
};
