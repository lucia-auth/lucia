import { Database, testAdapter } from "@lucia-sveltekit/adapter-test";
import { PrismaClient } from "@prisma/client";
import prisma from "../src/index.js";

const client = new PrismaClient();

const transformRefreshTokenPrismaData = (refreshToken: Record<string, any>) => {
    delete refreshToken.id;
    return refreshToken;
};

const db: Database = {
    getUsers: async () => {
        return await client.user.findMany();
    },
    getRefreshTokens: async () => {
        const refreshTokens = await client.refreshToken.findMany();
        return refreshTokens.map((refreshToken) =>
            transformRefreshTokenPrismaData(refreshToken)
        ) as any;
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
    clearUsers: async () => {
        await client.user.deleteMany();
    },
    clearRefreshTokens: async () => {
        await client.refreshToken.deleteMany();
    },
};

testAdapter(prisma(client), db);
