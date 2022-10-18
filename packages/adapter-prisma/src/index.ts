import { Prisma, type PrismaClient } from "@prisma/client";
import { type Adapter, getUpdateData } from "lucia-sveltekit/adapter";
import { LuciaError } from "lucia-sveltekit";
import { convertSession } from "./utils.js";

const adapter = (prisma: PrismaClient): Adapter => {
    return {
        getUser: async (userId) => {
            try {
                const data = await prisma.user.findUnique({
                    where: {
                        id: userId,
                    },
                });
                if (!data) return null;
                return data;
            } catch (e) {
                console.error(e);
                if (!(e instanceof Prisma.PrismaClientKnownRequestError))
                    throw new LuciaError("UNKNOWN_ERROR");
                throw new LuciaError("DATABASE_FETCH_FAILED");
            }
        },
        getSessionAndUserBySessionId: async (sessionId) => {
            try {
                const data = await prisma.session.findUnique({
                    where: {
                        id: sessionId,
                    },
                    include: {
                        user: true,
                    },
                });
                if (!data) return null;
                const { user, ...session } = data;
                return {
                    user: user,
                    session: convertSession(session),
                };
            } catch (e) {
                console.error(e);
                if (!(e instanceof Prisma.PrismaClientKnownRequestError))
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
                return data;
            } catch (e) {
                console.error(e);
                if (!(e instanceof Prisma.PrismaClientKnownRequestError))
                    throw new LuciaError("UNKNOWN_ERROR");
                throw new LuciaError("DATABASE_FETCH_FAILED");
            }
        },
        getSession: async (sessionId) => {
            try {
                const session = await prisma.session.findUnique({
                    where: {
                        id: sessionId,
                    },
                });
                if (!session) return null;
                return convertSession(session);
            } catch (e) {
                console.error(e);
                if (!(e instanceof Prisma.PrismaClientKnownRequestError))
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
                return sessions.map((session) => convertSession(session));
            } catch (e) {
                console.error(e);
                if (!(e instanceof Prisma.PrismaClientKnownRequestError))
                    throw new LuciaError("UNKNOWN_ERROR");
                throw new LuciaError("DATABASE_FETCH_FAILED");
            }
        },
        setUser: async (userId, data) => {
            try {
                if (userId === null) {
                    const createdUser = await prisma.user.create({
                        data: {
                            provider_id: data.providerId,
                            hashed_password: data.hashedPassword,
                            ...data.attributes,
                        } as any,
                    });
                    return createdUser;
                }
                const createdUser = await prisma.user.create({
                    data: {
                        id: userId,
                        provider_id: data.providerId,
                        hashed_password: data.hashedPassword,
                        ...data.attributes,
                    } as any,
                });
                return createdUser;
            } catch (e) {
                console.error(e);
                if (!(e instanceof Prisma.PrismaClientKnownRequestError))
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
                if (!(e instanceof Prisma.PrismaClientKnownRequestError))
                    throw new LuciaError("UNKNOWN_ERROR");
                throw new LuciaError("DATABASE_UPDATE_FAILED");
            }
        },
        setSession: async (sessionId, data) => {
            try {
                await prisma.session.create({
                    data: {
                        id: sessionId,
                        user_id: data.userId,
                        expires: data.expires,
                        idle_expires: data.idlePeriodExpires,
                    },
                });
            } catch (e) {
                console.error(e);
                if (!(e instanceof Prisma.PrismaClientKnownRequestError))
                    throw new LuciaError("UNKNOWN_ERROR");
                if (
                    e.code === "P2003" &&
                    e.message.includes("session_user_id_fkey (index)")
                )
                    throw new LuciaError("AUTH_INVALID_USER_ID");
                if (e.code === "P2002" && e.message.includes("id"))
                    throw new LuciaError("AUTH_DUPLICATE_SESSION_ID");
                throw new LuciaError("UNKNOWN_ERROR");
            }
        },
        deleteSession: async (sessionId) => {
            try {
                await prisma.session.delete({
                    where: {
                        id: sessionId,
                    },
                });
            } catch (e) {
                console.error(e);
                if (!(e instanceof Prisma.PrismaClientKnownRequestError))
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
                if (!(e instanceof Prisma.PrismaClientKnownRequestError))
                    throw new LuciaError("UNKNOWN_ERROR");
                throw new LuciaError("UNKNOWN_ERROR");
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
                return data;
            } catch (e) {
                console.error(e);
                if (!(e instanceof Prisma.PrismaClientKnownRequestError))
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
