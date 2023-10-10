import type {
	Adapter,
	GlobalDatabaseSessionAttributes,
	InitializeAdapter,
	KeySchema,
	SessionSchema,
	UserSchema
} from "lucia";

type PossiblePrismaError = {
	code: string;
	message: string;
};

type ExtractModelNames<_PrismaClient extends PrismaClient> = Exclude<
	keyof _PrismaClient,
	`$${string}`
>;

type PrismaSessionSchema = {
	id: string;
	userId: string;
	activeExpires: bigint | number;
	idleExpires: bigint | number;
} & GlobalDatabaseSessionAttributes;

type PrismaKeySchema = {
	id: string;
	userId: string;
	hashedPassword: string | null;
};

export const prismaAdapter = <_PrismaClient extends PrismaClient>(
	client: _PrismaClient,
	modelNames?: {
		user: ExtractModelNames<_PrismaClient>;
		session: ExtractModelNames<_PrismaClient> | null;
		key: ExtractModelNames<_PrismaClient>;
	}
): InitializeAdapter<Adapter> => {
	const getModels = () => {
		if (!modelNames) {
			return {
				User: client["user"] as TypedPrismaModel<UserSchema>,
				Session:
					(client["session"] as TypedPrismaModel<PrismaSessionSchema>) ?? null,
				Key: client["key"] as TypedPrismaModel<PrismaKeySchema>
			};
		}
		return {
			User: client[modelNames.user] as TypedPrismaModel<UserSchema>,
			Session: modelNames.session
				? (client[modelNames.session] as TypedPrismaModel<PrismaSessionSchema>)
				: null,
			Key: client[modelNames.key] as TypedPrismaModel<PrismaKeySchema>
		};
	};
	const { User, Session, Key } = getModels();

	return (LuciaError) => {
		return {
			getUser: async (userId) => {
				return await User.findUnique({
					where: {
						id: userId
					}
				});
			},
			setUser: async (user, key) => {
				if (!key) {
					await User.create({
						data: user
					});
					return;
				}
				try {
					await client.$transaction([
						User.create({
							data: user
						}),
						Key.create({
							data: transformLuciaKey(key)
						})
					]);
				} catch (e) {
					const error = e as Partial<PossiblePrismaError>;
					if (error.code === "P2002" && error.message?.includes("`id`"))
						throw new LuciaError("AUTH_DUPLICATE_KEY_ID");
					throw error;
				}
			},
			deleteUser: async (userId) => {
				try {
					await User.delete({
						where: {
							id: userId
						}
					});
				} catch (e) {
					const error = e as Partial<PossiblePrismaError>;
					if (error.code === "P2025") {
						// user does not exist
						return;
					}
					throw e;
				}
			},
			updateUser: async (userId, partialUser) => {
				await User.update({
					data: partialUser,
					where: {
						id: userId
					}
				});
			},
			getSession: async (sessionId) => {
				if (!Session) {
					throw new Error("Session table not defined");
				}
				const result = await Session.findUnique({
					where: {
						id: sessionId
					}
				});
				if (!result) return null;
				return transformPrismaSession(result);
			},
			getSessionsByUserId: async (userId) => {
				if (!Session) {
					throw new Error("Session table not defined");
				}
				const sessions = await Session.findMany({
					where: {
						userId: userId
					}
				});
				return sessions.map((session) => transformPrismaSession(session));
			},
			setSession: async (session) => {
				if (!Session) {
					throw new Error("Session table not defined");
				}
				try {
					await Session.create({
						data: transformLuciaSession(session)
					});
				} catch (e) {
					const error = e as Partial<PossiblePrismaError>;
					if (error.code === "P2003") {
						throw new LuciaError("AUTH_INVALID_USER_ID");
					}

					throw error;
				}
			},
			deleteSession: async (sessionId) => {
				if (!Session) {
					throw new Error("Session table not defined");
				}
				try {
					await Session.delete({
						where: {
							id: sessionId
						}
					});
				} catch (e) {
					const error = e as Partial<PossiblePrismaError>;
					if (error.code === "P2025") {
						// session does not exist
						return;
					}
					throw e;
				}
			},
			deleteSessionsByUserId: async (userId) => {
				if (!Session) {
					throw new Error("Session table not defined");
				}
				await Session.deleteMany({
					where: {
						userId: userId
					}
				});
			},
			updateSession: async (userId, partialSession) => {
				if (!Session) {
					throw new Error("Session table not defined");
				}
				await Session.update({
					data: partialSession,
					where: {
						id: userId
					}
				});
			},

			getKey: async (keyId) => {
				const result = await Key.findUnique({
					where: {
						id: keyId
					}
				});
				if (!result) return null;
				return transformPrismaKey(result);
			},
			getKeysByUserId: async (userId) => {
				const result = await Key.findMany({
					where: {
						userId: userId
					}
				});
				return result.map((val) => transformPrismaKey(val));
			},

			setKey: async (key) => {
				try {
					await Key.create({
						data: transformLuciaKey(key)
					});
				} catch (e) {
					const error = e as Partial<PossiblePrismaError>;
					if (error.code === "P2003") {
						throw new LuciaError("AUTH_INVALID_USER_ID");
					}
					if (error.code === "P2002" && error.message?.includes("`id`")) {
						throw new LuciaError("AUTH_DUPLICATE_KEY_ID");
					}
					throw error;
				}
			},
			deleteKey: async (keyId) => {
				try {
					await Key.delete({
						where: {
							id: keyId
						}
					});
				} catch (e) {
					const error = e as Partial<PossiblePrismaError>;
					if (error.code === "P2025") {
						// key does not exist
						return;
					}
					throw e;
				}
			},
			deleteKeysByUserId: async (userId) => {
				await Key.deleteMany({
					where: {
						userId: userId
					}
				});
			},
			updateKey: async (keyId, partialKey) => {
				await Key.update({
					data: {
						id: partialKey.id,
						userId: partialKey.user_id,
						hashedPassword: partialKey.hashed_password
					},
					where: {
						id: keyId
					}
				});
			}
		};
	};
};

export const transformLuciaSession = (
	session: SessionSchema
): PrismaSessionSchema => {
	const {
		active_expires: activeExpires,
		idle_expires: idleExpires,
		user_id: userId,
		...data
	} = session;
	return {
		...data,
		userId,
		activeExpires,
		idleExpires
	};
};

export const transformLuciaKey = (key: KeySchema): PrismaKeySchema => {
	return {
		id: key.id,
		userId: key.user_id,
		hashedPassword: key.hashed_password
	};
};
export const transformPrismaSession = (
	sessionData: PrismaSessionSchema
): SessionSchema => {
	const { activeExpires, idleExpires, userId, ...data } = sessionData;
	return {
		...data,
		user_id: userId,
		active_expires: Number(activeExpires),
		idle_expires: Number(idleExpires)
	};
};

export const transformPrismaKey = (keyData: PrismaKeySchema): KeySchema => {
	return {
		id: keyData.id,
		user_id: keyData.userId,
		hashed_password: keyData.hashedPassword
	};
};
type PrismaClient = {
	$transaction: (...args: any) => any;
} & { [K: string]: any };

export type TypedPrismaModel<_Schema = any> = {
	findUnique: <_Included = {}>(options: {
		where: Partial<_Schema>;
		include?: Partial<Record<string, boolean>>;
	}) => Promise<null | _Schema> & _Included;
	findMany: (options?: { where: Partial<_Schema> }) => Promise<_Schema[]>;
	create: (options: { data: _Schema }) => Promise<_Schema>;
	delete: (options: { where: Partial<_Schema> }) => Promise<void>;
	deleteMany: (options?: { where: Partial<_Schema> }) => Promise<void>;
	update: (options: {
		data: Partial<_Schema>;
		where: Partial<_Schema>;
	}) => Promise<_Schema>;
};
