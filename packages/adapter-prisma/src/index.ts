import { type PrismaClient } from "@prisma/client";
import pkg from "@prisma/client/runtime/index.js";
import {
    type Adapter,
    getUpdateData,
    convertCamelCaseKeysToSnakeCase,
} from "lucia-sveltekit/adapter";
import { LuciaError } from "lucia-sveltekit";
import { convertSessionRow, convertUserRow } from "./utils.js";

const adapter = (prisma: PrismaClient): Adapter => {
    return {
        getUserById: async (userId) => {
            try {
                const data = await prisma.user.findUnique({
                    where: {
                        id: userId,
                    },
                });
                if (!data) return null;
                return convertUserRow(data);
            } catch (e) {
                console.error(e);
                if (!(e instanceof pkg.PrismaClientKnownRequestError))
                    throw new LuciaError("UNKNOWN_ERROR");
                throw new LuciaError("DATABASE_FETCH_FAILED");
            }
        },
        getUserIdByRefreshToken: async (refreshToken) => {
            try {
                const data = await prisma.refreshToken.findUnique({
                    where: {
                        refresh_token: refreshToken,
                    },
                    include: {
                        user: true,
                    },
                });
                if (!data) return null;
                return data.user.id;
            } catch (e) {
                console.error(e);
                if (!(e instanceof pkg.PrismaClientKnownRequestError))
                    throw new LuciaError("UNKNOWN_ERROR");
                throw new LuciaError("DATABASE_FETCH_FAILED");
            }
        },
        getUserByProviderId: async (providerId) => {
            try {
                const data = await prisma.user.findUnique({
                    where: {
                        provider_id: providerId,
                    },
                });
                if (!data) return null;
                return convertUserRow(data);
            } catch (e) {
                console.error(e);
                if (!(e instanceof pkg.PrismaClientKnownRequestError))
                    throw new LuciaError("UNKNOWN_ERROR");
                throw new LuciaError("DATABASE_FETCH_FAILED");
            }
        },
        getUserByAccessToken: async (accessToken) => {
            try {
                const session = await prisma.session.findUnique({
                    where: {
                        access_token: accessToken,
                    },
                    include: {
                        user: true,
                    },
                });
                if (!session) return null;
                return convertUserRow(session.user);
            } catch (e) {
                console.error(e);
                if (!(e instanceof pkg.PrismaClientKnownRequestError))
                    throw new LuciaError("UNKNOWN_ERROR");
                throw new LuciaError("DATABASE_FETCH_FAILED");
            }
        },
        getSessionByAccessToken: async (accessToken) => {
            try {
                const session = await prisma.session.findUnique({
                    where: {
                        access_token: accessToken,
                    },
                });
                if (!session) return null;
                return convertSessionRow(session);
            } catch (e) {
                console.error(e);
                if (!(e instanceof pkg.PrismaClientKnownRequestError))
                    throw new LuciaError("UNKNOWN_ERROR");
                throw new LuciaError("DATABASE_FETCH_FAILED");
            }
        },
        getSessionsByUserId: async (userId) => {
            try {
                const sessions = await prisma.session.findMany({
                    where: {
                        user_id: userId,
                    },
                });
                return sessions.map((val) => convertSessionRow(val));
            } catch (e) {
                console.error(e);
                if (!(e instanceof pkg.PrismaClientKnownRequestError))
                    throw new LuciaError("UNKNOWN_ERROR");
                throw new LuciaError("DATABASE_FETCH_FAILED");
            }
        },
        setUser: async (userId, data) => {
            try {
                if (userId === null) {
                    const createdUser = await prisma.user.create({
                        data: {
                            id: "",
                            provider_id: data.providerId,
                            hashed_password: data.hashedPassword,
                            ...convertCamelCaseKeysToSnakeCase(data.userData),
                        } as any,
                    });
                    return createdUser.id;
                }
                await prisma.user.create({
                    data: {
                        id: userId,
                        provider_id: data.providerId,
                        hashed_password: data.hashedPassword,
                        ...convertCamelCaseKeysToSnakeCase(data.userData),
                    } as any,
                });
                return userId;
            } catch (e) {
                console.error(e);
                if (!(e instanceof pkg.PrismaClientKnownRequestError))
                    throw new LuciaError("UNKNOWN_ERROR");
                if (e.code === "P2002" && e.message.includes("provider_id")) {
                    throw new LuciaError("AUTH_DUPLICATE_PROVIDER_ID");
                }
                if (e.code === "P2002") {
                    throw new LuciaError("AUTH_DUPLICATE_USER_DATA");
                }
                throw new LuciaError("DATABASE_UPDATE_FAILED");
            }
        },
        deleteUser: async (userId) => {
            try {
                await prisma.user.deleteMany({
                    where: {
                        id: userId,
                    },
                });
                return;
            } catch (e) {
                console.error(e);
                if (!(e instanceof pkg.PrismaClientKnownRequestError))
                    throw new LuciaError("UNKNOWN_ERROR");
                throw new LuciaError("DATABASE_UPDATE_FAILED");
            }
        },
        setSession: async (userId, accessToken, expires) => {
            try {
                await prisma.session.create({
                    data: {
                        user_id: userId,
                        access_token: accessToken,
                        expires,
                    },
                });
            } catch (e) {
                console.error(e);
                if (!(e instanceof pkg.PrismaClientKnownRequestError))
                    throw new LuciaError("UNKNOWN_ERROR");
                if (
                    e.code === "P2003" &&
                    e.message.includes("session_user_id_fkey (index)")
                )
                    throw new LuciaError("AUTH_INVALID_USER_ID");
                if (e.code === "P2002" && e.message.includes("access_token"))
                    throw new LuciaError("AUTH_DUPLICATE_ACCESS_TOKEN");
                throw new LuciaError("UNKNOWN_ERROR");
            }
        },
        deleteSessionByAccessToken: async (accessToken) => {
            try {
                await prisma.session.delete({
                    where: {
                        access_token: accessToken,
                    },
                });
            } catch (e) {
                console.error(e);
                if (!(e instanceof pkg.PrismaClientKnownRequestError))
                    throw new LuciaError("UNKNOWN_ERROR");
                throw new LuciaError("UNKNOWN_ERROR");
            }
        },
        deleteSessionsByUserId: async (userId) => {
            try {
                await prisma.session.deleteMany({
                    where: {
                        user_id: userId,
                    },
                });
            } catch (e) {
                console.error(e);
                if (!(e instanceof pkg.PrismaClientKnownRequestError))
                    throw new LuciaError("UNKNOWN_ERROR");
                throw new LuciaError("UNKNOWN_ERROR");
            }
        },
        setRefreshToken: async (refreshToken, userId) => {
            try {
                await prisma.refreshToken.create({
                    data: {
                        refresh_token: refreshToken,
                        user_id: userId,
                    },
                });
                return;
            } catch (e) {
                console.error(e);
                if (!(e instanceof pkg.PrismaClientKnownRequestError))
                    throw new LuciaError("UNKNOWN_ERROR");
                throw new LuciaError("DATABASE_UPDATE_FAILED");
            }
        },
        deleteRefreshToken: async (refreshToken) => {
            try {
                await prisma.refreshToken.deleteMany({
                    where: {
                        refresh_token: refreshToken,
                    },
                });
                return;
            } catch (e) {
                console.error(e);
                if (!(e instanceof pkg.PrismaClientKnownRequestError))
                    throw new LuciaError("UNKNOWN_ERROR");
                throw new LuciaError("DATABASE_UPDATE_FAILED");
            }
        },
        deleteRefreshTokensByUserId: async (userId) => {
            try {
                await prisma.refreshToken.deleteMany({
                    where: {
                        user_id: userId,
                    },
                });
                return;
            } catch (e) {
                console.error(e);
                if (!(e instanceof pkg.PrismaClientKnownRequestError))
                    throw new LuciaError("UNKNOWN_ERROR");
                throw new LuciaError("DATABASE_UPDATE_FAILED");
            }
        },
        updateUser: async (userId, newData) => {
            const partialData = getUpdateData(newData);
            try {
                const data = await prisma.user.update({
                    data: partialData,
                    where: {
                        id: userId,
                    },
                });
                return convertUserRow(data);
            } catch (e) {
                console.error(e);
                if (!(e instanceof pkg.PrismaClientKnownRequestError))
                    throw new LuciaError("UNKNOWN_ERROR");
                if (e.code === "P2025")
                    throw new LuciaError("AUTH_INVALID_USER_ID");
                if (e.code === "P2002" && e.message.includes("provider_id")) {
                    throw new LuciaError("AUTH_DUPLICATE_PROVIDER_ID");
                }
                if (e.code === "P2002") {
                    throw new LuciaError("AUTH_DUPLICATE_USER_DATA");
                }
                throw new LuciaError("DATABASE_FETCH_FAILED");
            }
        },
    };
};

export default adapter;
