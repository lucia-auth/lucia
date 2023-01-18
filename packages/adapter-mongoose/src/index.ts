import { getUpdateData } from "lucia-auth/adapter";
import Mongoose from "mongoose";
import { convertSessionDoc, convertUserDoc } from "./utils.js";
import type { Adapter, AdapterFunction } from "lucia-auth";

const adapter = (mongoose: Mongoose.Mongoose): AdapterFunction<Adapter> => {
	const User = mongoose.model<UserDoc>("user");
	const Session = mongoose.model<SessionDoc>("session");
	return (LuciaError) => {
		return {
			getUser: async (userId: string) => {
				const userDoc = await User.findById(userId).lean();
				if (!userDoc) return null;
				return convertUserDoc(userDoc);
			},
			getUserByProviderId: async (providerId) => {
				const user = await User.findOne({
					provider_id: providerId
				}).lean();
				if (!user) return null;
				return convertUserDoc(user);
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
			setUser: async (userId, data) => {
				try {
					const newUserDoc = new User({
						_id: userId ?? new Mongoose.Types.ObjectId().toString(),
						hashed_password: data.hashedPassword,
						provider_id: data.providerId,
						...data.attributes
					});
					const userDoc = await newUserDoc.save();
					const user = convertUserDoc(userDoc.toObject());
					return user;
				} catch (error) {
					if (
						error instanceof Error &&
						error.message.includes("E11000") &&
						error.message.includes("provider_id")
					)
						throw new LuciaError("AUTH_DUPLICATE_PROVIDER_ID");
					throw error;
				}
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
						expires: data.expires,
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
			updateUser: async (userId, newData) => {
				const partialData = getUpdateData(newData);
				try {
					const userDoc = await User.findByIdAndUpdate(
						userId,
						partialData
					).lean();
					if (!userDoc) throw new LuciaError("AUTH_INVALID_USER_ID");
					return convertUserDoc(userDoc);
				} catch (error) {
					if (
						error instanceof Error &&
						error.message.includes("E11000") &&
						error.message.includes("provider_id")
					)
						throw new LuciaError("AUTH_DUPLICATE_PROVIDER_ID");
					throw error;
				}
			}
		};
	};
};

export default adapter;
