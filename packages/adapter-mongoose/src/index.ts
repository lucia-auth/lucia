import { LuciaError } from "lucia-sveltekit";
import { type Adapter, getUpdateData } from "lucia-sveltekit/adapter";
import type { Mongoose, MongooseError } from "mongoose";
import { convertSessionDoc, convertUserDoc } from "./utils.js";

const adapter = (mongoose: Mongoose, url: string): Adapter => {
    const User = mongoose.model<UserDoc>("user");
    const Session = mongoose.model<SessionDoc>("session");
    return {
        getUser: async (userId: string) => {
            try {
                const userDoc = await User.findById(userId).lean();
                if (!userDoc) return null;
                return convertUserDoc(userDoc);
            } catch (e) {
                console.error(e);
                throw new LuciaError("DATABASE_FETCH_FAILED");
            }
        },
        getUserByProviderId: async (providerId) => {
            try {
                const user = await User.findOne({
                    provider_id: providerId,
                }).lean();
                if (!user) return null;
                return convertUserDoc(user);
            } catch (e) {
                throw new LuciaError("DATABASE_FETCH_FAILED");
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
                    session: convertSessionDoc(session),
                };
            } catch (e) {
                throw new LuciaError("DATABASE_FETCH_FAILED");
            }
        },
        getSession: async (sessionId) => {
            try {
                const session = await Session.findById(sessionId).lean();
                if (!session) return null;
                return convertSessionDoc(session);
            } catch (e) {
                throw new LuciaError("DATABASE_FETCH_FAILED");
            }
        },
        getSessionsByUserId: async (userId) => {
            try {
                const sessions = await Session.find({
                    user_id: userId,
                }).lean();
                return sessions.map((val) => convertSessionDoc(val));
            } catch (e) {
                throw new LuciaError("DATABASE_FETCH_FAILED");
            }
        },
        setUser: async (userId, data) => {
            try {
                const newUserDoc = new User({
                    _id: userId || undefined,
                    hashed_password: data.hashedPassword,
                    provider_id: data.providerId,
                    ...data.attributes,
                });
                const userDoc = await newUserDoc.save();
                const user = convertUserDoc(userDoc);
                return user.id;
            } catch (e) {
                console.error(e);
                const error = e as MongooseError;
                if (
                    error.message.includes("E11000") &&
                    error.message.includes("provider_id")
                )
                    throw new LuciaError("AUTH_DUPLICATE_PROVIDER_ID");
                if (error.message.includes("E11000"))
                    throw new LuciaError("AUTH_DUPLICATE_USER_DATA");
                throw new LuciaError("DATABASE_UPDATE_FAILED");
            }
        },
        deleteUser: async (userId: string) => {
            try {
                await User.findOneAndDelete({
                    _id: userId,
                });
            } catch (e) {
                console.error(e);
                throw new LuciaError("DATABASE_UPDATE_FAILED");
            }
        },
        setSession: async (sessionId, data) => {
            let userDoc: UserDoc | null = null;
            try {
                userDoc = await User.findById(data.userId);
            } catch (e) {
                throw new LuciaError("DATABASE_FETCH_FAILED");
            }
            if (!userDoc) throw new LuciaError("AUTH_INVALID_USER_ID");
            try {
                const sessionDoc = new Session({
                    _id: sessionId,
                    user_id: data.userId,
                    expires: data.expires,
                    idle_expires: data.idlePeriodExpires,
                });
                await Session.create(sessionDoc);
            } catch (e) {
                const error = e as MongooseError;
                console.error(e);
                if (
                    error.message.includes("E11000") &&
                    error.message.includes("id")
                )
                    throw new LuciaError("AUTH_DUPLICATE_SESSION_ID");
                throw new LuciaError("DATABASE_UPDATE_FAILED");
            }
        },
        deleteSession: async (sessionId) => {
            try {
                await Session.findByIdAndDelete(sessionId);
            } catch (e) {
                console.error(e);
                throw new LuciaError("DATABASE_UPDATE_FAILED");
            }
        },
        deleteSessionsByUserId: async (userId) => {
            try {
                await Session.deleteMany({
                    user_id: userId,
                });
            } catch (e) {
                console.error(e);
                throw new LuciaError("DATABASE_UPDATE_FAILED");
            }
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
            } catch (e) {
                console.error(e);
                if (e instanceof LuciaError) throw e;
                const error = e as MongooseError;
                if (
                    error.message.includes("E11000") &&
                    error.message.includes("provider_id")
                )
                    throw new LuciaError("AUTH_DUPLICATE_PROVIDER_ID");
                if (error.message.includes("E11000"))
                    throw new LuciaError("AUTH_DUPLICATE_USER_DATA");
                throw new LuciaError("DATABASE_FETCH_FAILED");
            }
        },
    };
};

export default adapter;
