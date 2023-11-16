import type {
	Adapter,
	InitializeAdapter,
	KeySchema,
	SessionSchema,
	UserSchema
} from "lucia";
import { Collection } from "mongodb";
import type { KeyDoc, SessionDoc, UserDoc } from "./docs.js";

export const DEFAULT_PROJECTION = {};

export const mongodbAdapter = (collections: {
	User: Collection<UserDoc>;
	Session: Collection<SessionDoc> | null;
	Key: Collection<KeyDoc>;
}): InitializeAdapter<Adapter> => {
	const { User, Session, Key } = collections;

	return (LuciaError) => {
		return {
			getUser: async (userId: string) => {
				const userDoc = await User.findOne(
					{ _id: userId },
					{ projection: DEFAULT_PROJECTION }
				);

				if (!userDoc) return null;
				return transformUserDoc(userDoc);
			},

			setUser: async (user, key) => {
				if (key) {
					const refKeyDoc = await Key.findOne(
						{ _id: key.id },
						{ projection: DEFAULT_PROJECTION }
					);
					if (refKeyDoc) throw new LuciaError("AUTH_DUPLICATE_KEY_ID");
				}

				await User.insertOne(createMongoValues(user));

				if (!key) return;
				try {
					// TODO: Fix the typing here to not rely on 'as'
					await Key.insertOne(createMongoValues(key) as KeyDoc);
				} catch (error) {
					await Key.findOneAndDelete({ _id: user.id });

					if (
						error instanceof Error &&
						error.message.includes("E11000") &&
						error.message.includes("id")
					) {
						throw new LuciaError("AUTH_DUPLICATE_KEY_ID");
					} else {
						throw error;
					}
				}
			},

			deleteUser: async (userId: string) => {
				await User.findOneAndDelete({ _id: userId });
			},

			updateUser: async (userId, partialUser) => {
				await User.findOneAndUpdate(
					{ _id: userId },
					{ $set: partialUser },
					{
						returnDocument: "after",
						projection: DEFAULT_PROJECTION
					}
				);
			},

			getSession: async (sessionId) => {
				if (!Session) {
					throw new Error("Session collection not defined");
				}

				const session = await Session.findOne(
					{ _id: sessionId },
					{ projection: DEFAULT_PROJECTION }
				);
				if (!session) return null;

				return transformSessionDoc(session);
			},

			getSessionsByUserId: async (userId) => {
				if (!Session) {
					throw new Error("Session collection not defined");
				}

				const sessions = await Session.find(
					{ user_id: userId },
					{ projection: DEFAULT_PROJECTION }
				).toArray();

				return sessions.map((val) => transformSessionDoc(val));
			},

			getSessionAndUserBySessionId: async (sessionId: string) => {
				if (!Session) {
					throw new Error("Session collection not defined");
				}

				const sessionUsers = await Session.aggregate([
					{ $match: { _id: sessionId } },
					{
						$lookup: {
							from: User.collectionName,
							localField: "user_id",
							// Relies on _id being a String, not ObjectId.
							// But this assumption is used elsewhere, as well
							foreignField: "_id",
							as: "userDocs"
						}
					}
				]).toArray();

				const sessionUser = sessionUsers?.at(0) ?? null;
				if (!sessionUser) return null;

				const { userDocs, ...sessionDoc } = sessionUser;
				const userDoc = userDocs?.at(0) ?? null;
				if (!userDoc) return null;

				return {
					user: transformUserDoc(userDoc),
					session: transformSessionDoc(sessionDoc)
				};
			},

			setSession: async (session) => {
				if (!Session) {
					throw new Error("Session collection not defined");
				}

				await Session.insertOne(createMongoValues(session));
			},

			deleteSession: async (sessionId) => {
				if (!Session) {
					throw new Error("Session collection not defined");
				}

				await Session.findOneAndDelete({ _id: sessionId });
			},

			deleteSessionsByUserId: async (userId) => {
				if (!Session) {
					throw new Error("Session collection not defined");
				}

				await Session.deleteMany({
					user_id: userId
				});
			},

			updateSession: async (sessionId, partialUser) => {
				if (!Session) {
					throw new Error("Session collection not defined");
				}

				await Session.findOneAndUpdate(
					{ _id: sessionId },
					{ $set: partialUser },
					{
						returnDocument: "after",
						projection: DEFAULT_PROJECTION
					}
				);
			},

			getKey: async (keyId) => {
				const keyDoc = await Key.findOne(
					{ _id: keyId },
					{ projection: DEFAULT_PROJECTION }
				);
				if (!keyDoc) return null;
				return transformKeyDoc(keyDoc);
			},

			setKey: async (key) => {
				try {
					// TODO: Fix the typing here to not rely on 'as'
					await Key.insertOne(createMongoValues(key) as KeyDoc);
				} catch (error) {
					if (
						error instanceof Error &&
						error.message.includes("E11000") &&
						error.message.includes("id")
					) {
						throw new LuciaError("AUTH_DUPLICATE_KEY_ID");
					} else {
						throw error;
					}
				}
			},

			getKeysByUserId: async (userId) => {
				const keyDocs = await Key.find(
					{ user_id: userId },
					{ projection: DEFAULT_PROJECTION }
				).toArray();

				return keyDocs.map((val) => transformKeyDoc(val));
			},

			deleteKey: async (keyId) => {
				await Key.findOneAndDelete({ _id: keyId });
			},

			deleteKeysByUserId: async (userId) => {
				await Key.deleteMany({ user_id: userId });
			},

			updateKey: async (keyId, partialKey) => {
				await Key.findOneAndUpdate(
					{ _id: keyId },
					{ $set: partialKey },
					{
						returnDocument: "after",
						projection: DEFAULT_PROJECTION
					}
				);
			}
		};
	};
};

export const createMongoValues = (object: Record<any, any>) => {
	return Object.fromEntries(
		Object.entries(object).map(([key, value]) => {
			if (key === "id") return ["_id", value];
			return [key, value];
		})
	);
};

export const transformUserDoc = (row: UserDoc): UserSchema => {
	const { _id: id, ...attributes } = row;

	return {
		id,
		...attributes
	};
};

export const transformSessionDoc = (row: SessionDoc): SessionSchema => {
	const { _id: id, ...attributes } = row;

	return {
		id,
		...attributes
	};
};

export const transformKeyDoc = (row: KeyDoc): KeySchema => {
	return {
		id: row._id,
		user_id: row.user_id,
		hashed_password: row.hashed_password ?? null
	};
};
