import type {
	Adapter,
	AdapterFunction,
	KeySchema,
	SessionSchema,
	UserSchema
} from "lucia-auth";
import { transformKeyData, transformSessionData } from "./utils.js";
import { PrismaClient, SmartPrismaClient } from "./prisma.js";

interface PossiblePrismaError {
	code: string;
	message: string;
}

type Models = {
	authUser: {
		schema: UserSchema;
		relations: {};
	};
	authSession: {
		schema: SessionSchema;
		relations: {
			auth_user: UserSchema;
		};
	};
	authKey: {
		schema: KeySchema;
		relations: {
			auth_user: UserSchema;
		};
	};
};

const adapter =
	(prismaClient: PrismaClient<Models>): AdapterFunction<Adapter> =>
	(LuciaError) => {
		const prisma = prismaClient as any as SmartPrismaClient<Models>;
		return {
			getUser: async (userId) => {
				return await prisma.authUser.findUnique({
					where: {
						id: userId
					}
				});
			},
			getSessionAndUserBySessionId: async (sessionId) => {
				const data = await prisma.authSession.findUnique({
					where: {
						id: sessionId
					},
					include: {
						auth_user: true
					}
				});
				if (!data) return null;
				const { auth_user: user, ...session } = data;
				return {
					user,
					session: transformSessionData(session)
				};
			},
			getSession: async (sessionId) => {
				const session = await prisma.authSession.findUnique({
					where: {
						id: sessionId
					}
				});
				if (!session) return null;
				return transformSessionData(session);
			},
			getSessionsByUserId: async (userId) => {
				const sessions = await prisma.authSession.findMany({
					where: {
						user_id: userId
					}
				});
				return sessions.map((session) => transformSessionData(session));
			},
			setUser: async (userId, attributes, key) => {
				if (!key) {
					return await prisma.authUser.create({
						data: {
							id: userId,
							...attributes
						}
					});
				}
				try {
					return await prisma.$transaction(async (tx) => {
						const [createdUser] = await Promise.all([
							tx.authUser.create({
								data: {
									id: userId,
									...attributes
								}
							}),
							tx.authKey.create({
								data: key
							})
						]);
						return createdUser;
					});
				} catch (e) {
					const error = e as Partial<PossiblePrismaError>;
					if (error.code === "P2002" && error.message?.includes("`id`"))
						throw new LuciaError("AUTH_DUPLICATE_KEY_ID");
					throw error;
				}
			},
			deleteUser: async (userId) => {
				await prisma.authUser.deleteMany({
					where: {
						id: userId
					}
				});
			},
			setSession: async (session) => {
				try {
					await prisma.authSession.create({
						data: session
					});
				} catch (e) {
					const error = e as Partial<PossiblePrismaError>;
					if (error.code === "P2003")
						throw new LuciaError("AUTH_INVALID_USER_ID");
					if (error.code === "P2002" && error.message?.includes("`id`"))
						throw new LuciaError("AUTH_DUPLICATE_SESSION_ID");
					throw error;
				}
			},
			deleteSession: async (sessionId) => {
				await prisma.authSession.delete({
					where: {
						id: sessionId
					}
				});
			},
			deleteSessionsByUserId: async (userId) => {
				await prisma.authSession.deleteMany({
					where: {
						user_id: userId
					}
				});
			},
			updateUserAttributes: async (userId, attributes) => {
				try {
					const data = await prisma.authUser.update({
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
					await prisma.authKey.create({
						data: key
					});
				} catch (e) {
					const error = e as Partial<PossiblePrismaError>;
					if (error.code === "P2003")
						throw new LuciaError("AUTH_INVALID_USER_ID");
					if (error.code === "P2002" && error.message?.includes("`id`"))
						throw new LuciaError("AUTH_DUPLICATE_KEY_ID");
					throw error;
				}
			},
			getKey: async (key, shouldDataBeDeleted) => {
				return await prisma.$transaction(async (tx) => {
					const keyData = await tx.authKey.findUnique({
						where: {
							id: key
						}
					});
					if (!keyData) return null;
					const transformedKeyData = transformKeyData(keyData);
					const dataShouldBeDeleted = await shouldDataBeDeleted(
						transformedKeyData
					);
					if (dataShouldBeDeleted) {
						await tx.authKey.delete({
							where: {
								id: keyData.id
							}
						});
					}
					return transformKeyData(keyData);
				});
			},
			getKeysByUserId: async (userId) => {
				const keys = await prisma.authKey.findMany({
					where: {
						user_id: userId
					}
				});
				return keys.map((val) => transformKeyData(val));
			},
			updateKeyPassword: async (key, hashedPassword) => {
				try {
					await prisma.authKey.update({
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
				await prisma.authKey.deleteMany({
					where: {
						user_id: userId
					}
				});
			},
			deleteNonPrimaryKey: async (key) => {
				await prisma.authKey.deleteMany({
					where: {
						id: key,
						primary_key: false
					}
				});
			}
		};
	};

export default adapter;
