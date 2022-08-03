import { Error, adapterGetUpdateData } from "lucia-sveltekit";
import type { Adapter, DatabaseUser } from "lucia-sveltekit/dist/types";
import type { Mongoose, MongooseError } from "mongoose";

export const transformUserDoc = (obj: Record<string, any>) => {
    delete obj.__v;
    const id = obj._id;
    delete obj._id;
    return {
        id,
        ...obj,
    };
};

const adapter = (mongoose: Mongoose, url: string): Adapter => {
    const RefreshToken = mongoose.model("refresh_token");
    const User = mongoose.model("user");
    const clientPromise = mongoose.connect(url);
    return {
        getUserByRefreshToken: async (refreshToken) => {
            try {
                await clientPromise;
                const tokenDoc = (await RefreshToken.findOne({
                    refresh_token: refreshToken,
                }).lean()) as Record<string, any> | null;
                if (!tokenDoc) return null;
                const user = await User.findOne({
                    _id: tokenDoc.user_id,
                }).lean();
                if (!user) return null;
                const dbUser = transformUserDoc(user) as DatabaseUser<
                    Record<string, any>
                >;
                return dbUser;
            } catch {
                throw new Error("DATABASE_FETCH_FAILED");
            }
        },
        getUserByIdentifierToken: async (identifierToken: string) => {
            try {
                const user: DatabaseUser<Record<string, any>> | null =
                    await User.findOne({
                        identifier_token: identifierToken,
                    }).lean();
                if (!user) return null;
                const dbUser = transformUserDoc(user) as DatabaseUser<
                    Record<string, any>
                >;
                return dbUser;
            } catch {
                throw new Error("DATABASE_FETCH_FAILED");
            }
        },
        setUser: async (
            userId: string,
            data: {
                hashed_password: string | null;
                identifier_token: string;
                user_data: Record<string, any>;
            }
        ) => {
            try {
                const userDoc = new User({
                    _id: userId,
                    hashed_password: data.hashed_password,
                    identifier_token: data.identifier_token,
                    ...data.user_data,
                });
                await userDoc.save();
                return;
            } catch (e) {
                console.error(e);
                const error = e as MongooseError;
                if (
                    error.message.includes("E11000") &&
                    error.message.includes("identifier_token")
                )
                    throw new Error("AUTH_DUPLICATE_IDENTIFIER_TOKEN");
                if (error.message.includes("E11000"))
                    throw new Error("AUTH_DUPLICATE_USER_DATA");
                throw new Error("DATABASE_UPDATE_FAILED");
            }
        },
        deleteUser: async (userId: string) => {
            try {
                await User.deleteOne({ _id: userId }).exec();
            } catch (e) {
                console.error(e);
                throw new Error("DATABASE_UPDATE_FAILED");
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
                throw new Error("DATABASE_UPDATE_FAILED");
            }
        },
        deleteRefreshToken: async (refreshToken: string) => {
            try {
                await RefreshToken.deleteOne({
                    refresh_token: refreshToken,
                }).exec();
            } catch (e) {
                console.error(e);
                throw new Error("DATABASE_UPDATE_FAILED");
            }
        },
        deleteUserRefreshTokens: async (userId: string) => {
            try {
                await RefreshToken.deleteMany({ user_id: userId }).exec();
            } catch (e) {
                console.error(e);
                throw new Error("DATABASE_UPDATE_FAILED");
            }
        },
        getUserById: async (userId: string) => {
            try {
                const userDoc: DatabaseUser<Record<string, any>> | null =
                    await User.findOne({
                        _id: userId,
                    }).lean();
                if (!userDoc) return null;
                return transformUserDoc(userDoc) as DatabaseUser<
                    Record<string, any>
                >;
            } catch (e) {
                console.error(e);
                throw new Error("DATABASE_FETCH_FAILED");
            }
        },
        updateUser: async (userId, newData) => {
            const partialData = adapterGetUpdateData(newData);
            let userDoc: DatabaseUser<Record<string, any>> | null;
            try {
                userDoc = await User.findOneAndUpdate(
                    {
                        _id: userId,
                    },
                    partialData
                ).lean();
            } catch (e) {
                console.error(e);
                throw new Error("DATABASE_FETCH_FAILED");
            }
            if (!userDoc) throw new Error("AUTH_INVALID_USER_ID");
            return transformUserDoc(userDoc) as DatabaseUser<
                Record<string, any>
            >;
        },
    };
};

export default adapter;
