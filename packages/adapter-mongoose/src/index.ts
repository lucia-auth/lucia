import { LuciaError } from "lucia-auth";
import { getUpdateData } from "lucia-auth/adapter";
import type { Adapter } from "lucia-auth/types";
import Mongoose from "mongoose";
import { convertSessionDoc, convertUserDoc } from "./utils.js";

const adapter = (
	mongoose: Mongoose.Mongoose,
	errorHandler: (error: Mongoose.MongooseError) => void = () => {}
): Adapter => {
	const User = mongoose.model<UserDoc>("user");
	const Session = mongoose.model<SessionDoc>("session");
	return {
		getUser: async (userId: string) => {
			try {
				const userDoc = await User.findById(userId).lean();
				if (!userDoc) return null;
				return convertUserDoc(userDoc);
			} catch (e) {
				errorHandler(e as any);
				throw e;
			}
		},
		getUserByProviderId: async (providerId) => {
			try {
				const user = await User.findOne({
					provider_id: providerId
				}).lean();
				if (!user) return null;
				return convertUserDoc(user);
			} catch (e) {
				errorHandler(e as any);
				throw e;
			}
		},
		getSessionAndUserBySessionId: async (sessionId) => {
			try {
				const session = await Session.findById(sessionId).lean();
				if (!session) return null;
				const user = await User.findById(session.user_id).lean();
				if (!user) return null;
				return {
					user: convertUserDoc(user),
					session: convertSessionDoc(session)
				};
			} catch (e) {
				errorHandler(e as any);
				throw e;
			}
		},
		getSession: async (sessionId) => {
			try {
				const session = await Session.findById(sessionId).lean();
				if (!session) return null;
				return convertSessionDoc(session);
			} catch (e) {
				errorHandler(e as any);
				throw e;
			}
		},
		getSessionsByUserId: async (userId) => {
			try {
				const sessions = await Session.find({
					user_id: userId
				}).lean();
				return sessions.map((val) => convertSessionDoc(val));
			} catch (e) {
				errorHandler(e as any);
				throw e;
			}
		},
		setUser: async (userId, data) => {
			try {
				const newUserDoc = new User({
					_id: userId || undefined,
					hashed_password: data.hashedPassword,
					provider_id: data.providerId,
					...data.attributes
				});
				const userDoc = await newUserDoc.save();
				const user = convertUserDoc(userDoc.toObject());
				return user;
			} catch (e) {
				const error = e as Mongoose.MongooseError;
				if (error.message.includes("E11000") && error.message.includes("provider_id"))
					throw new LuciaError("AUTH_DUPLICATE_PROVIDER_ID");
				errorHandler(e as any);
				throw e;
			}
		},
		deleteUser: async (userId: string) => {
			try {
				await User.findOneAndDelete({
					_id: userId
				});
			} catch (e) {
				errorHandler(e as any);
				throw e;
			}
		},
		setSession: async (sessionId, data) => {
			let userDoc: UserDoc | null = null;
			try {
				userDoc = await User.findById(data.userId);
			} catch (e) {
				errorHandler(e as any);
				throw e;
			}
			if (!userDoc) throw new LuciaError("AUTH_INVALID_USER_ID");
			try {
				const sessionDoc = new Session({
					_id: sessionId,
					user_id: data.userId,
					expires: data.expires,
					idle_expires: data.idlePeriodExpires
				});
				await Session.create(sessionDoc);
			} catch (e) {
				const error = e as Mongoose.MongooseError;
				if (error.message.includes("E11000") && error.message.includes("id"))
					throw new LuciaError("AUTH_DUPLICATE_SESSION_ID");
				errorHandler(e as any);
				throw e;
			}
		},
		deleteSession: async (sessionId) => {
			try {
				await Session.findByIdAndDelete(sessionId);
			} catch (e) {
				errorHandler(e as any);
				throw e;
			}
		},
		deleteSessionsByUserId: async (userId) => {
			try {
				await Session.deleteMany({
					user_id: userId
				});
			} catch (e) {
				errorHandler(e as any);
				throw e;
			}
		},
		updateUser: async (userId, newData) => {
			const partialData = getUpdateData(newData);
			try {
				const userDoc = await User.findByIdAndUpdate(userId, partialData).lean();
				if (!userDoc) throw new LuciaError("AUTH_INVALID_USER_ID");
				return convertUserDoc(userDoc);
			} catch (e) {
				if (e instanceof LuciaError) throw e;
				const error = e as Mongoose.MongooseError;
				if (error.message.includes("E11000") && error.message.includes("provider_id"))
					throw new LuciaError("AUTH_DUPLICATE_PROVIDER_ID");
				errorHandler(e as any);
				throw e;
			}
		}
	};
};

export default adapter;
