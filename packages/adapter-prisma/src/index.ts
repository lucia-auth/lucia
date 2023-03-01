import type {
	Adapter,
	AdapterFunction,
	KeySchema,
	SessionSchema,
	UserSchema
} from "lucia-auth";
import { convertKeyData, convertSessionData } from "./utils.js";
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
				return await prisma.user.findUnique({
					where: {
						id: userId
					}
				});
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
					session: convertSessionData(session)
				};
			},
			getSession: async (sessionId) => {
				const session = await prisma.session.findUnique({
					where: {
						id: sessionId
					}
				});
				if (!session) return null;
				return convertSessionData(session);
			},
			getSessionsByUserId: async (userId) => {
				const sessions = await prisma.session.findMany({
					where: {
						user_id: userId
					}
				});
				return sessions.map((session) => convertSessionData(session));
			},
			setUser: async (userId, attributes, key) => {
				if (!key) {
					return await prisma.user.create({
						data: {
							id: userId,
							...attributes
						}
					});
				}
				try {
					return await prisma.$transaction(async (tx) => {
						const [createdUser] = await Promise.all([
							tx.user.create({
								data: {
									id: userId,
									...attributes
								}
							}),
							tx.key.create({
								data: key
							})
						]);
						return createdUser;
					});
				} catch (e) {
					const error = e as Partial<PossiblePrismaError>;
					if (error.code === "P2002" && error.message?.includes("id"))
						throw new LuciaError("AUTH_DUPLICATE_KEY_ID");
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
			setSession: async (session) => {
				try {
					await prisma.session.create({
						data: session
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
			setKey: async (key) => {
				try {
					await prisma.key.create({
						data: key
					});
				} catch (e) {
					const error = e as Partial<PossiblePrismaError>;
					if (error.code === "P2003")
						throw new LuciaError("AUTH_INVALID_USER_ID");
					if (error.code === "P2002" && error.message?.includes("id"))
						throw new LuciaError("AUTH_DUPLICATE_KEY_ID");
					throw error;
				}
			},
			getKey: async (key) => {
				return await prisma.$transaction(async (tx) => {
					const keyData = await tx.key.findUnique({
						where: {
							id: key
						}
					});
					if (!keyData) return null;
					if (keyData?.expires !== null) {
						await tx.key.delete({
							where: {
								id: keyData.id
							}
						});
					}
					return convertKeyData(keyData);
				});
			},
			getKeysByUserId: async (userId) => {
				const keys = await prisma.key.findMany({
					where: {
						user_id: userId
					}
				});
				return keys.map((val) => convertKeyData(val));
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
					if (error.code === "P2025")
						throw new LuciaError("AUTH_INVALID_KEY_ID");
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
