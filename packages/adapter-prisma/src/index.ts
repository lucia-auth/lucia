import type {
	Adapter,
	AdapterFunction,
	KeySchema,
	SessionSchema,
	UserSchema
} from "lucia-auth";
import { convertSession } from "./utils.js";
import { PrismaClient, SmartPrismaClient } from "./prisma.js";

interface PossiblePrismaError {
	code: string;
	message: string;
}

type Schemas = {
	user: UserSchema;
	session: SessionSchema;
	key: KeySchema;
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
					session: convertSession(session)
				};
			},
			getSession: async (sessionId) => {
				const session = await prisma.session.findUnique({
					where: {
						id: sessionId
					}
				});
				if (!session) return null;
				return convertSession(session);
			},
			getSessionsByUserId: async (userId) => {
				const sessions = await prisma.session.findMany({
					where: {
						user_id: userId
					}
				});
				return sessions.map((session) => convertSession(session));
			},
			setUser: async (userId, attributes) => {
				if (userId === null) {
					const createdUser = await prisma.user.create({
						data: attributes as any
					});
					return createdUser;
				}
				const createdUser = await prisma.user.create({
					data: {
						id: userId,
						...attributes
					} as any
				});
				return createdUser;
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
							active_expires: data.activePeriodExpires,
							idle_expires: data.idlePeriodExpires
						}
					});
				} catch (e) {
					const error = e as Partial<PossiblePrismaError>;
					if (error.code === "P2003")
						throw new LuciaError("AUTH_INVALID_USER_ID");
					if (error.code === "P2002" && error.message?.includes("id"))
						throw new LuciaError("AUTH_DUPLICATE_SESSION_ID");
					throw error;
				}
			},
			deleteSession: async (sessionId) => {
				await prisma.session.delete({
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
			updateUserAttributes: async (userId, attributes) => {
				try {
					const data = await prisma.user.update({
						data: attributes,
						where: {
							id: userId
						}
					});
					return data;
				} catch (e) {
					const error = e as Partial<PossiblePrismaError>;
					if (error.code === "P2025")
						throw new LuciaError("AUTH_INVALID_USER_ID");
					throw error;
				}
			},
			setKey: async (key, data) => {
				try {
					await prisma.key.create({
						data: {
							id: key,
							primary: data.isPrimary,
							user_id: data.userId,
							hashed_password: data.hashedPassword
						}
					});
				} catch (e) {
					const error = e as Partial<PossiblePrismaError>;
					if (error.code === "P2003")
						throw new LuciaError("AUTH_INVALID_USER_ID");
					if (error.code === "P2002" && error.message?.includes("id"))
						throw new LuciaError("AUTH_DUPLICATE_KEY");
					throw error;
				}
			},
			getKey: async (key) => {
				return await prisma.key.findUnique({
					where: {
						id: key
					}
				});
			},
			getKeysByUserId: async (userId) => {
				return await prisma.key.findMany({
					where: {
						user_id: userId
					}
				});
			},
			updateKeyPassword: async (key, hashedPassword) => {
				try {
					await prisma.key.update({
						data: {
							hashed_password: hashedPassword
						},
						where: {
							id: key
						}
					});
				} catch (e) {
					const error = e as Partial<PossiblePrismaError>;
					if (error.code === "P2025") throw new LuciaError("AUTH_INVALID_KEY");
					throw error;
				}
			},
			deleteKeysByUserId: async (userId) => {
				await prisma.key.deleteMany({
					where: {
						user_id: userId
					}
				});
			},
			deleteNonPrimaryKey: async (key) => {
				await prisma.key.deleteMany({
					where: {
						id: key,
						primary: false
					}
				});
			}
		};
	};

export default adapter;
