import type {
	Adapter,
	InitializeAdapter,
	KeySchema,
	SessionSchema,
	UserSchema
} from "lucia";
import { DataSource } from "typeorm";
import { Key, Session, User } from "../typeorm/schema.js";

export const typeormAdapter = (
	dataSource: DataSource
): InitializeAdapter<Adapter> => {
	const repository = {
		user: dataSource.getRepository(User),
		session: dataSource.getRepository(Session),
		key: dataSource.getRepository(Key)
	};

	return (LuciaError) => {
		return {
			getUser: async (userId) => {
				const user = await repository.user.findOne({
					where: {
						id: userId
					}
				});

				return transformTypeORMUser(user);
			},
			setUser: async (user, key) => {
				if (!key) {
					const entity = repository.user.create(user);
					const createdUser = await repository.user.save(entity);
					return transformTypeORMUser(createdUser);
				}

				const queryRunner = dataSource.createQueryRunner();
				await queryRunner.connect();

				try {
					await queryRunner.startTransaction();
					const userEntity = queryRunner.manager
						.getRepository(User)
						.create(user);
					const keyEntity = queryRunner.manager.getRepository(Key).create(key);
					const createdUser = await queryRunner.manager
						.getRepository(User)
						.save(userEntity);
					await queryRunner.manager.getRepository(Key).save(keyEntity);

					await queryRunner.commitTransaction();

					return transformTypeORMUser(createdUser);
				} catch (e) {
					await queryRunner.rollbackTransaction();
					// if (e.code === "P2002" && error.message?.includes("`id`"))
					throw new LuciaError("AUTH_DUPLICATE_KEY_ID");
					// throw error;
				} finally {
					await queryRunner.release();
				}
			},
			deleteUser: async (userId) => {
				try {
					await repository.user.delete({ id: userId });
				} catch (e) {
					// const error = e as Partial<PossiblePrismaError>;
					// if (error.code === "P2025") {
					// 	// user does not exist
					// 	return;
					// }
					throw e;
				}
			},
			updateUser: async (userId, partialUser) => {
				await repository.user.update({ id: userId }, partialUser);
			},
			getSession: async (sessionId) => {
				if (!repository.session) {
					throw new Error("Session table not defined");
				}
				const result = await repository.session.findOne({
					where: { id: sessionId }
				});
				if (!result) return null;
				return transformTypeORMSession(result);
			},
			getSessionsByUserId: async (userId) => {
				if (!repository.session) {
					throw new Error("Session table not defined");
				}
				const sessions = await repository.session.find({
					where: { user_id: userId }
				});
				return sessions.map((session) => transformTypeORMSession(session));
			},
			setSession: async (session) => {
				if (!repository.session) {
					throw new Error("Session table not defined");
				}
				try {
					const entity = repository.session.create(session);
					await repository.session.save(entity);
				} catch (e) {
					const error = e;
					// const error = e as Partial<PossiblePrismaError>;
					// if (error.code === "P2003") {
					// 	throw new LuciaError("AUTH_INVALID_USER_ID");
					// }

					throw error;
				}
			},
			deleteSession: async (sessionId) => {
				if (!repository.session) {
					throw new Error("Session table not defined");
				}
				try {
					await repository.session.delete({
						id: sessionId
					});
				} catch (e) {
					// const error = e as Partial<PossiblePrismaError>;
					// if (error.code === "P2025") {
					// 	// session does not exist
					// 	return;
					// }
					throw e;
				}
			},
			deleteSessionsByUserId: async (userId) => {
				if (!repository.session) {
					throw new Error("Session table not defined");
				}
				await repository.session.delete({
					user_id: userId
				});
			},
			updateSession: async (userId, partialSession) => {
				if (!repository.session) {
					throw new Error("Session table not defined");
				}
				await repository.session.update({ id: userId }, partialSession);
			},

			getKey: async (keyId) => {
				const key = await repository.key.findOne({
					where: {
						id: keyId
					}
				});

				return key ? transformTypeORMKey(key) : null;
			},
			getKeysByUserId: async (userId) => {
				const key = await repository.key.find({
					where: {
						user_id: userId
					}
				});
				return key.map((item) => transformTypeORMKey(item));
			},

			setKey: async (key) => {
				try {
					const entity = repository.key.create(key);
					await repository.key.save(entity);
				} catch (e) {
					const error = e;
					// const error = e as Partial<PossiblePrismaError>;
					// if (error.code === "P2003") {
					// 	throw new LuciaError("AUTH_INVALID_USER_ID");
					// }
					// if (error.code === "P2002" && error.message?.includes("`id`")) {
					// 	throw new LuciaError("AUTH_DUPLICATE_KEY_ID");
					// }
					throw error;
				}
			},
			deleteKey: async (keyId) => {
				try {
					await repository.key.delete({
						id: keyId
					});
				} catch (e) {
					// const error = e as Partial<PossiblePrismaError>;
					// if (error.code === "P2025") {
					// 	// key does not exist
					// 	return;
					// }
					throw e;
				}
			},
			deleteKeysByUserId: async (userId) => {
				await repository.key.delete({
					user_id: userId
				});
			},
			updateKey: async (userId, partialKey) => {
				await repository.key.update({ id: userId }, partialKey);
			}
		};
	};
};

export const transformTypeORMUser = (
	userData: User | User[] | null
): UserSchema => {
	if (!userData) {
		return null;
	}

	if (Array.isArray(userData)) {
		return userData.map((item) => item.toJSON());
	}

	return userData.toJSON();
};

export const transformTypeORMSession = (
	sessionData: Session
): SessionSchema => {
	const { active_expires, idle_expires, ...data } = sessionData;
	return {
		...data,
		active_expires: Number(active_expires),
		idle_expires: Number(idle_expires)
	};
};

export const transformTypeORMKey = (keyData: Key): KeySchema => {
	if (!keyData) {
		return keyData;
	}

	return keyData.toJSON() as KeySchema;
};
