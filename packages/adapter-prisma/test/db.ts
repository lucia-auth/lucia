import { Database } from "@lucia-sveltekit/adapter-test";
import { PrismaClient } from "@prisma/client";
import prisma from "../src/index.js";
import { convertSession } from "../src/utils.js";

const client = new PrismaClient();
export const adapter = prisma(client);

export const db: Database = {
    getUsers: async () => {
        return await client.user.findMany();
    },
    getSessions: async () => {
        const sessions = await client.session.findMany();
        return sessions.map((session) => convertSession(session));
    },
    insertUser: async (user) => {
        await client.user.create({
            data: user,
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
    clearSessions: async () => {
        await client.session.deleteMany();
    },
};
