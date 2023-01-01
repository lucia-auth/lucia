import type { Adapter, AdapterFunction, SessionSchema, UserSchema } from "lucia-auth";
import { getUpdateData } from "lucia-auth/adapter";
import { PrismaClient, SmartPrismaClient } from "./prisma.js";

interface PossiblePrismaError {
	code: string;
	message: string;
}

type Schemas = {
	user: UserSchema;
	session: SessionSchema;
};

const adapter =
	(prismaClient: PrismaClient<Schemas>): AdapterFunction<Adapter> =>
	(LuciaError) => {
		const prisma = prismaClient as any as SmartPrismaClient<Schemas>;
		return {
			getUser: async (userId) => {
				const data = await prisma.user.findUnique({
					where: {
						id: userId
					}
				});
				if (!data) return null;
				return data;
			},
			getSessionAndUserBySessionId: async (sessionId) => {
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
					session: session
				};
			},
			getUserByProviderId: async (providerId) => {
				const data = await prisma.user.findUnique({
					where: {
						provider_id: providerId
					}
				});
				if (!data) return null;
				return data;
			},
			getSession: async (sessionId) => {
				const session = await prisma.session.findUnique({
					where: {
						id: sessionId
					}
				});
				if (!session) return null;
				return session
			},
			getSessionsByUserId: async (userId) => {
				const sessions = await prisma.session.findMany({
					where: {
						user_id: userId
					}
				});
				return sessions
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
					const error = e as Partial<PossiblePrismaError>;
					if (error.code === "P2002" && error.message?.includes("provider_id")) {
						throw new LuciaError("AUTH_DUPLICATE_PROVIDER_ID");
					}
					throw error;
				}
			},
			deleteUser: async (userId) => {
				await prisma.user.deleteMany({
					where: {
						id: userId
					}
				});
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
					const error = e as Partial<PossiblePrismaError>;
					if (error.code === "P2003" && error.message?.includes("session_user_id_fkey (index)"))
						throw new LuciaError("AUTH_INVALID_USER_ID");
					if (error.code === "P2002" && error.message?.includes("id"))
						throw new LuciaError("AUTH_DUPLICATE_SESSION_ID");
					throw error;
				}
			},
			deleteSession: async (sessionId) => {
				const t = await prisma.session.delete({
					where: {
						id: sessionId
					}
				});
			},
			deleteSessionsByUserId: async (userId) => {
				await prisma.session.deleteMany({
					where: {
						user_id: userId
					}
				});
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
					const error = e as Partial<PossiblePrismaError>;
					if (error.code === "P2025") throw new LuciaError("AUTH_INVALID_USER_ID");
					if (error.code === "P2002" && error.message?.includes("provider_id")) {
						throw new LuciaError("AUTH_DUPLICATE_PROVIDER_ID");
					}
					throw error;
				}
			}
		};
	};

export default adapter;
