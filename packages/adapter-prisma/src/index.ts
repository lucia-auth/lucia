import type { Prisma, PrismaClient } from "@prisma/client";
import type { Adapter } from "lucia-auth";
import { getUpdateData } from "lucia-auth/adapter";
import { LuciaError } from "lucia-auth";
import { convertSession } from "./utils.js";

interface PossiblePrismaError {
	code?: string;
	message?: string;
}

const adapter = (
	prisma: PrismaClient,
	errorHandler: (
		error:
			| Prisma.PrismaClientKnownRequestError
			| Prisma.PrismaClientValidationError
			| Prisma.PrismaClientUnknownRequestError
			| Prisma.PrismaClientInitializationError
			| Prisma.PrismaClientRustPanicError
	) => void = () => {}
): Adapter => {
	return {
		getUser: async (userId) => {
			try {
				const data = await prisma.user.findUnique({
					where: {
						id: userId
					}
				});
				if (!data) return null;
				return data;
			} catch (e) {
				errorHandler(e as any);
				throw e;
			}
		},
		getSessionAndUserBySessionId: async (sessionId) => {
			try {
				const data = await prisma.session.findUnique({
					where: {
						id: sessionId
					},
					include: {
						user: true
					}
				});
				if (!data) return null;
				const { user, ...session } = data;
				return {
					user: user,
					session: convertSession(session)
				};
			} catch (e) {
				errorHandler(e as any);
				throw e;
			}
		},
		getUserByProviderId: async (providerId) => {
			try {
				const data = await prisma.user.findUnique({
					where: {
						provider_id: providerId
					}
				});
				if (!data) return null;
				return data;
			} catch (e) {
				errorHandler(e as any);
				throw e;
			}
		},
		getSession: async (sessionId) => {
			try {
				const session = await prisma.session.findUnique({
					where: {
						id: sessionId
					}
				});
				if (!session) return null;
				return convertSession(session);
			} catch (e) {
				errorHandler(e as any);
				throw e;
			}
		},
		getSessionsByUserId: async (userId) => {
			try {
				const sessions = await prisma.session.findMany({
					where: {
						user_id: userId
					}
				});
				return sessions.map((session) => convertSession(session));
			} catch (e) {
				errorHandler(e as any);
				throw e;
			}
		},
		setUser: async (userId, data) => {
			try {
				if (userId === null) {
					const createdUser = await prisma.user.create({
						data: {
							provider_id: data.providerId,
							hashed_password: data.hashedPassword,
							...data.attributes
						} as any
					});
					return createdUser;
				}
				const createdUser = await prisma.user.create({
					data: {
						id: userId,
						provider_id: data.providerId,
						hashed_password: data.hashedPassword,
						...data.attributes
					} as any
				});
				return createdUser;
			} catch (e) {
				const error = e as PossiblePrismaError;
				if (error.code === "P2002" && error.message?.includes("provider_id")) {
					throw new LuciaError("AUTH_DUPLICATE_PROVIDER_ID");
				}
				errorHandler(e as any);
				throw e;
			}
		},
		deleteUser: async (userId) => {
			try {
				await prisma.user.deleteMany({
					where: {
						id: userId
					}
				});
				return;
			} catch (e) {
				errorHandler(e as any);
				throw e;
			}
		},
		setSession: async (sessionId, data) => {
			try {
				await prisma.session.create({
					data: {
						id: sessionId,
						user_id: data.userId,
						expires: data.expires,
						idle_expires: data.idlePeriodExpires
					}
				});
			} catch (e) {
				const error = e as PossiblePrismaError;
				if (error.code === "P2003" && error.message?.includes("session_user_id_fkey (index)"))
					throw new LuciaError("AUTH_INVALID_USER_ID");
				if (error.code === "P2002" && error.message?.includes("id"))
					throw new LuciaError("AUTH_DUPLICATE_SESSION_ID");
				errorHandler(e as any);
				throw e;
			}
		},
		deleteSession: async (sessionId) => {
			try {
				await prisma.session.delete({
					where: {
						id: sessionId
					}
				});
			} catch (e) {
				errorHandler(e as any);
				throw e;
			}
		},
		deleteSessionsByUserId: async (userId) => {
			try {
				await prisma.session.deleteMany({
					where: {
						user_id: userId
					}
				});
			} catch (e) {
				errorHandler(e as any);
				throw e;
			}
		},
		updateUser: async (userId, newData) => {
			const partialData = getUpdateData(newData);
			try {
				const data = await prisma.user.update({
					data: partialData,
					where: {
						id: userId
					}
				});
				return data;
			} catch (e) {
				const error = e as PossiblePrismaError;
				if (error.code === "P2025") throw new LuciaError("AUTH_INVALID_USER_ID");
				if (error.code === "P2002" && error.message?.includes("provider_id")) {
					throw new LuciaError("AUTH_DUPLICATE_PROVIDER_ID");
				}
				errorHandler(e as any);
				throw e;
			}
		}
	};
};

export default adapter;
