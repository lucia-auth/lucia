import Mongoose from "mongoose";
import {
	transformKeyDoc,
	transformSessionDoc,
	transformUserDoc
} from "./utils.js";
import type { Adapter, AdapterFunction } from "lucia-auth";

const createMongoValues = (object: Record<any, any>) => {
	return Object.fromEntries(
		Object.entries(object).map(([key, value]) => {
			if (key === "id") return ["_id", value];
			return [key, value];
		})
	);
};

const adapter = (mongoose: Mongoose.Mongoose): AdapterFunction<Adapter> => {
	const User = mongoose.model<UserDoc>("user");
	const Session = mongoose.model<SessionDoc>("session");
	const Key = mongoose.model<KeyDoc>("key");
	return (LuciaError) => {
		return {
			getUser: async (userId: string) => {
				const userDoc = await User.findById(userId).lean();
				if (!userDoc) return null;
				return transformUserDoc(userDoc);
			},
			getSessionAndUserBySessionId: async (sessionId) => {
				const session = await Session.findById(sessionId).lean();
				if (!session) return null;
				const user = await User.findById(session.user_id).lean();
				if (!user) return null;
				return {
					user: transformUserDoc(user),
					session: transformSessionDoc(session)
				};
			},
			getSession: async (sessionId) => {
				const session = await Session.findById(sessionId).lean();
				if (!session) return null;
				return transformSessionDoc(session);
			},
			getSessionsByUserId: async (userId) => {
				const sessions = await Session.find({
					user_id: userId
				}).lean();
				return sessions.map((val) => transformSessionDoc(val));
			},
			setUser: async (userId, userAttributes, key) => {
				try {
					if (key) {
						const refKeyDoc = await Key.findById(key.id);
						if (refKeyDoc) throw new LuciaError("AUTH_DUPLICATE_KEY_ID");
					}
					const userDoc = new User(
						createMongoValues({
							id: userId,
							...userAttributes
						})
					);
					await userDoc.save();
					if (key) {
						const keyDoc = new Key(createMongoValues(key));
						await keyDoc.save();
					}
					return transformUserDoc(userDoc.toObject());
				} catch (error) {
					if (
						error instanceof Error &&
						error.message.includes("E11000") &&
						error.message.includes("id")
					) {
						throw new LuciaError("AUTH_DUPLICATE_KEY_ID");
					}
					throw error;
				}
			},
			deleteUser: async (userId: string) => {
				await User.findOneAndDelete({
					_id: userId
				});
			},
			setSession: async (session) => {
				const userDoc = await User.findById(session.user_id).lean();
				if (!userDoc) throw new LuciaError("AUTH_INVALID_USER_ID");
				try {
					const sessionDoc = new Session(createMongoValues(session));
					await Session.create(sessionDoc);
				} catch (error) {
					if (
						error instanceof Error &&
						error.message.includes("E11000") &&
						error.message.includes("id")
					)
						throw new LuciaError("AUTH_DUPLICATE_SESSION_ID");
					throw error;
				}
			},
			deleteSession: async (sessionId) => {
				await Session.findByIdAndDelete(sessionId);
			},
			deleteSessionsByUserId: async (userId) => {
				await Session.deleteMany({
					user_id: userId
				});
			},
			updateUserAttributes: async (userId, attributes) => {
				const userDoc = await User.findByIdAndUpdate(userId, attributes).lean();
				if (!userDoc) throw new LuciaError("AUTH_INVALID_USER_ID");
				return transformUserDoc(userDoc);
			},
			getKey: async (key, shouldDataBeDeleted) => {
				const keyDoc = await Key.findById(key).lean();
				if (!keyDoc) return null;
				const transformedKeyData = transformKeyDoc(keyDoc);
				const dataShouldBeDeleted = await shouldDataBeDeleted(
					transformedKeyData
				);
				if (dataShouldBeDeleted) {
					await Key.deleteOne({
						_id: keyDoc._id
					});
				}
				return transformedKeyData;
			},
			setKey: async (key) => {
				const userDoc = await User.findById(key.user_id);
				if (!userDoc) throw new LuciaError("AUTH_INVALID_USER_ID");
				try {
					const keyDoc = new Key(createMongoValues(key));
					await Key.create(keyDoc);
				} catch (error) {
					if (
						error instanceof Error &&
						error.message.includes("E11000") &&
						error.message.includes("id")
					)
						throw new LuciaError("AUTH_DUPLICATE_KEY_ID");
					throw error;
				}
			},
			getKeysByUserId: async (userId) => {
				const keyDocs = await Key.find({
					user_id: userId
				}).lean();
				return keyDocs.map((val) => transformKeyDoc(val));
			},
			updateKeyPassword: async (key, hashedPassword) => {
				const keyDoc = await Key.findByIdAndUpdate(key, {
					hashed_password: hashedPassword
				}).lean();
				if (!keyDoc) throw new LuciaError("AUTH_INVALID_KEY_ID");
			},
			deleteKeysByUserId: async (userId) => {
				await Key.deleteMany({
					user_id: userId
				});
			},
			deleteNonPrimaryKey: async (key) => {
				await Key.deleteOne({
					_id: key,
					primary: false
				});
			}
		};
	};
};

export default adapter;
