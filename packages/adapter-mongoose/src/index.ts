import Mongoose from "mongoose";
import { convertKeyDoc, convertSessionDoc, convertUserDoc } from "./utils.js";
import type { Adapter, AdapterFunction } from "lucia-auth";

const adapter = (mongoose: Mongoose.Mongoose): AdapterFunction<Adapter> => {
	const User = mongoose.model<UserDoc>("user");
	const Session = mongoose.model<SessionDoc>("session");
	const Key = mongoose.model<KeyDoc>("key");
	return (LuciaError) => {
		return {
			getUser: async (userId: string) => {
				const userDoc = await User.findById(userId).lean();
				if (!userDoc) return null;
				return convertUserDoc(userDoc);
			},
			getSessionAndUserBySessionId: async (sessionId) => {
				const session = await Session.findById(sessionId).lean();
				if (!session) return null;
				const user = await User.findById(session.user_id).lean();
				if (!user) return null;
				return {
					user: convertUserDoc(user),
					session: convertSessionDoc(session)
				};
			},
			getSession: async (sessionId) => {
				const session = await Session.findById(sessionId).lean();
				if (!session) return null;
				return convertSessionDoc(session);
			},
			getSessionsByUserId: async (userId) => {
				const sessions = await Session.find({
					user_id: userId
				}).lean();
				return sessions.map((val) => convertSessionDoc(val));
			},
			setUser: async (userId, attributes) => {
				const newUserDoc = new User({
					_id: userId ?? new Mongoose.Types.ObjectId().toString(),
					...attributes
				});
				const userDoc = await newUserDoc.save();
				const user = convertUserDoc(userDoc.toObject());
				return user;
			},
			deleteUser: async (userId: string) => {
				await User.findOneAndDelete({
					_id: userId
				});
			},
			setSession: async (sessionId, data) => {
				const userDoc = await User.findById(data.userId);
				if (!userDoc) throw new LuciaError("AUTH_INVALID_USER_ID");
				try {
					const sessionDoc = new Session({
						_id: sessionId,
						user_id: data.userId,
						active_expires: data.activePeriodExpires,
						idle_expires: data.idlePeriodExpires
					});
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
				return convertUserDoc(userDoc);
			},
			getKey: async (key) => {
				const keyDoc = await Key.findById(key).lean();
				if (!keyDoc) return null;
				return convertKeyDoc(keyDoc);
			},
			setKey: async (key, data) => {
				const userDoc = await User.findById(data.userId);
				if (!userDoc) throw new LuciaError("AUTH_INVALID_USER_ID");
				try {
					const keyDoc = new Key({
						_id: key,
						user_id: data.userId,
						primary: data.isPrimary,
						hashed_password: data.hashedPassword
					});
					await Key.create(keyDoc);
				} catch (error) {
					if (
						error instanceof Error &&
						error.message.includes("E11000") &&
						error.message.includes("id")
					)
						throw new LuciaError("AUTH_DUPLICATE_KEY");
					throw error;
				}
			},
			getKeysByUserId: async (userId) => {
				const keyDocs = await Key.find({
					user_id: userId
				}).lean();
				return keyDocs.map((val) => convertKeyDoc(val));
			},
			updateKeyPassword: async (key, hashedPassword) => {
				const keyDoc = await Key.findByIdAndUpdate(key, {
					hashed_password: hashedPassword
				}).lean();
				if (!keyDoc) throw new LuciaError("AUTH_INVALID_KEY");
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
