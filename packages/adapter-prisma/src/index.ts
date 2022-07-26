import { type PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import type { Adapter } from "lucia-sveltekit/types";
import { Error } from "lucia-sveltekit";

const adapter = (prisma: PrismaClient): Adapter => {
    return {
        getUserFromRefreshToken: async (refreshToken: string) => {
            try {
                const data = await prisma.refresh_Tokens.findUnique({
                    where: {
                        refresh_token: refreshToken,
                    },
                    include: {
                        user: true,
                    },
                });
                return data?.user || (null as any | null);
            } catch (e) {
                if (!(e instanceof PrismaClientKnownRequestError))
                    throw new Error("UNKNOWN_ERROR");
                throw new Error("DATABASE_FETCH_FAILED");
            }
        },
        getUserFromIdentifierToken: async (identifierToken: string) => {
            try {
                const data = await prisma.users.findUnique({
                    where: {
                        identifier_token: identifierToken,
                    },
                });
                return data as any | null;
            } catch (e) {
                if (!(e instanceof PrismaClientKnownRequestError))
                    throw new Error("UNKNOWN_ERROR");
                console.error(e);
                throw new Error("DATABASE_FETCH_FAILED");
            }
        },
        createUser: async (
            userId: string,
            data: {
                identifier_token: string;
                hashed_password: string | null;
                user_data: Record<string, any>;
            }
        ) => {
            try {
                await prisma.users.create({
                    data: {
                        id: userId,
                        identifier_token: data.identifier_token,
                        hashed_password: data.hashed_password,
                        ...data.user_data,
                    },
                });
                return;
            } catch (e) {
                if (!(e instanceof PrismaClientKnownRequestError))
                    throw new Error("UNKNOWN_ERROR");
                console.error(e);
                if (
                    e.code === "P2002" &&
                    e.message.includes("identifier_token")
                ) {
                    throw new Error("AUTH_DUPLICATE_IDENTIFIER_TOKEN");
                }
                if (e.code === "P2002") {
                    throw new Error("AUTH_DUPLICATE_USER_DATA");
                }
                throw new Error("DATABASE_UPDATE_FAILED");
            }
        },
        deleteUser: async (userId: string) => {
            try {
                await prisma.users.deleteMany({
                    where: {
                        id: userId,
                    },
                });
                return;
            } catch (e) {
                if (!(e instanceof PrismaClientKnownRequestError))
                    throw new Error("UNKNOWN_ERROR");
                console.error(e);
                throw new Error("DATABASE_UPDATE_FAILED");
            }
        },
        saveRefreshToken: async (refreshToken: string, userId: string) => {
            console.log(refreshToken);
            try {
                await prisma.refresh_Tokens.create({
                    data: {
                        refresh_token: refreshToken,
                        user_id: userId,
                    },
                });
                return;
            } catch (e) {
                if (!(e instanceof PrismaClientKnownRequestError))
                    throw new Error("UNKNOWN_ERROR");
                console.error(e);
                throw new Error("DATABASE_UPDATE_FAILED");
            }
        },
        deleteRefreshToken: async (refreshToken: string) => {
            try {
                await prisma.refresh_Tokens.deleteMany({
                    where: {
                        refresh_token: refreshToken,
                    },
                });
                return;
            } catch (e) {
                if (!(e instanceof PrismaClientKnownRequestError))
                    throw new Error("UNKNOWN_ERROR");
                console.error(e);
                throw new Error("DATABASE_UPDATE_FAILED");
            }
        },
        deleteUserRefreshTokens: async (userId: string) => {
            try {
                await prisma.refresh_Tokens.deleteMany({
                    where: {
                        user_id: userId,
                    },
                });
                return;
            } catch (e) {
                if (!(e instanceof PrismaClientKnownRequestError))
                    throw new Error("UNKNOWN_ERROR");
                console.error(e);
                throw new Error("DATABASE_UPDATE_FAILED");
            }
        },
    };
};

export default adapter;
