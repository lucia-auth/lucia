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
				try {
					await dataSource.manager.transaction(
						async (transactionalEntityManager) => {
							const userEntity = transactionalEntityManager
								.getRepository(User)
								.create(user);
							const keyEntity = transactionalEntityManager
								.getRepository(Key)
								.create(key);
							await transactionalEntityManager.save([userEntity, keyEntity]);
							const createdUser = await repository.user.findOneOrFail({
								where: {
									id: user.id
								}
							});

							console.log("?????", createdUser);

							delete createdUser?.authKeys;
							delete createdUser?.authSessions;

							return createdUser.toJSON();
						}
					);
				} catch (e) {
					// TODO: Handle error
					const error = e;
					// const error = e as Partial<PossiblePrismaError>;
					// if (error.code === "P2002" && error.message?.includes("`id`"))
					// 	throw new LuciaError("AUTH_DUPLICATE_KEY_ID");
					throw error;
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
				const sessions = await repository.session.find({ where: { userId } });
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
					userId
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
						userId
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
					userId
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
		const users = userData.map((item) => item.toJSON());

		users.forEach((item) =>
			Object.keys(item).forEach((key) => {
				if ((item as any)[key] === undefined) {
					delete (item as any)[key];
				}
			})
		);
		return users;
	}

	const user = userData.toJSON();

	Object.keys(user).forEach((key) => {
		if ((user as any)[key] === undefined) {
			delete (user as any)[key];
		}
	});

	return user;
};

export const transformTypeORMSession = (
	sessionData: Session
): SessionSchema => {
	const { activeExpires, idleExpires, userId, ...data } = sessionData;
	return {
		...data,
		active_expires: Number(activeExpires),
		idle_expires: Number(idleExpires),
		user_id: userId
	};
};

export const transformTypeORMKey = (keyData: Key): KeySchema => {
	const { hashedPassword, userId, ...data } = keyData;
	return {
		...data,
		hashed_password: hashedPassword,
		user_id: userId
	};
};
