import type {
	Adapter,
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
				User: client["user"] as SmartPrismaModel<UserSchema>,
				Session: (client["session"] as SmartPrismaModel<SessionSchema>) ?? null,
				Key: client["key"] as SmartPrismaModel<KeySchema>
			};
		}
		return {
			User: client[modelNames.user] as SmartPrismaModel<UserSchema>,
			Session: modelNames.session
				? (client[modelNames.session] as SmartPrismaModel<SessionSchema>)
				: null,
			Key: client[modelNames.key] as SmartPrismaModel<KeySchema>
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
							data: key
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
						user_id: userId
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
						data: session
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
						user_id: userId
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
				return await Key.findUnique({
					where: {
						id: keyId
					}
				});
			},
			getKeysByUserId: async (userId) => {
				return await Key.findMany({
					where: {
						user_id: userId
					}
				});
			},

			setKey: async (key) => {
				try {
					await Key.create({
						data: key
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
						user_id: userId
					}
				});
			},
			updateKey: async (userId, partialKey) => {
				await Key.update({
					data: partialKey,
					where: {
						id: userId
					}
				});
			}
		};
	};
};

export const transformPrismaSession = (
	sessionData: PrismaSession
): SessionSchema => {
	const { active_expires, idle_expires: idleExpires, ...data } = sessionData;
	return {
		...data,
		active_expires: Number(active_expires),
		idle_expires: Number(idleExpires)
	};
};

type PrismaClient = {
	$transaction: (...args: any) => any;
} & { [K: string]: any };

export type PrismaSession = Omit<
	SessionSchema,
	"active_expires" | "idle_expires"
> & {
	active_expires: BigInt | number;
	idle_expires: BigInt | number;
};

export type SmartPrismaModel<_Schema = any> = {
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
