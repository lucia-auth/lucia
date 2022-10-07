import { LuciaError } from "lucia-sveltekit";
import {
    type Adapter,
    getUpdateData,
    convertCamelCaseKeysToSnakeCase,
} from "lucia-sveltekit/adapter";
import type { Mongoose, MongooseError } from "mongoose";
import { convertSessionDoc, convertUserDoc } from "./utils.js";

const adapter = (mongoose: Mongoose, url: string): Adapter => {
    const RefreshToken = mongoose.model("refresh_token");
    const User = mongoose.model<UserDoc>("user");
    const Session = mongoose.model<SessionDoc>("session");
    const clientPromise = mongoose.connect(url);
    return {
        getUserById: async (userId: string) => {
            try {
                const userDoc = await User.findById(userId).lean();
                if (!userDoc) return null;
                return convertUserDoc(userDoc);
            } catch (e) {
                console.error(e);
                throw new LuciaError("DATABASE_FETCH_FAILED");
            }
        },
        getUserIdByRefreshToken: async (refreshToken) => {
            try {
                await clientPromise;
                const token = await RefreshToken.findOne<RefreshTokenDoc>({
                    refresh_token: refreshToken,
                }).lean();
                if (!token) return null;
                return token.user_id;
            } catch (e) {
                throw new LuciaError("DATABASE_FETCH_FAILED");
            }
        },
        getUserByProviderId: async (providerId) => {
            try {
                const user = await User.findOne<UserDoc>({
                    provider_id: providerId,
                }).lean();
                if (!user) return null;
                return convertUserDoc(user);
            } catch (e) {
                throw new LuciaError("DATABASE_FETCH_FAILED");
            }
        },
        getUserByAccessToken: async (accessToken) => {
            try {
                const session = await Session.findOne({
                    access_token: accessToken,
                }).lean();
                if (!session) return null;
                const user = await User.findById(session.user_id);
                if (!user) return null;
                return convertUserDoc(user);
            } catch (e) {
                throw new LuciaError("DATABASE_FETCH_FAILED");
            }
        },
        getSessionByAccessToken: async (accessToken) => {
            try {
                const session = await Session.findOne({
                    access_token: accessToken,
                }).lean();
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
                });
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
                    ...convertCamelCaseKeysToSnakeCase(data.userData),
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
        setSession: async (userId, accessToken, expires) => {
            let userDoc: UserDoc | null = null;
            try {
                userDoc = await User.findById(userId);
            } catch (e) {
                throw new LuciaError("DATABASE_FETCH_FAILED");
            }
            if (!userDoc) throw new LuciaError("AUTH_INVALID_USER_ID");
            try {
                const sessionDoc = new Session({
                    user_id: userId,
                    access_token: accessToken,
                    expires,
                });
                await Session.create(sessionDoc);
            } catch (e) {
                console.error(e);
                const error = e as MongooseError;
                if (
                    error.message.includes("E11000") &&
                    error.message.includes("access_token")
                )
                    throw new LuciaError("AUTH_DUPLICATE_ACCESS_TOKEN");
                throw new LuciaError("DATABASE_UPDATE_FAILED");
            }
        },
        deleteSessionByAccessToken: async (accessToken) => {
            try {
                await Session.deleteOne({
                    access_token: accessToken,
                });
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
        setRefreshToken: async (refreshToken: string, userId: string) => {
            try {
                const refreshTokenDoc = new RefreshToken({
                    refresh_token: refreshToken,
                    user_id: userId,
                });
                await refreshTokenDoc.save();
            } catch (e) {
                console.error(e);
                throw new LuciaError("DATABASE_UPDATE_FAILED");
            }
        },
        deleteRefreshToken: async (refreshToken: string) => {
            try {
                await RefreshToken.deleteOne({
                    refresh_token: refreshToken,
                }).exec();
            } catch (e) {
                console.error(e);
                throw new LuciaError("DATABASE_UPDATE_FAILED");
            }
        },
        deleteRefreshTokensByUserId: async (userId: string) => {
            try {
                await RefreshToken.deleteMany({ user_id: userId }).exec();
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
