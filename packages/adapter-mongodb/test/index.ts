import mongoose from "mongoose";
import { testAdapter, type Database } from "@lucia-sveltekit/adapter-test";
import mongodb, { transformUserDoc } from "../src/index.js";

const url = "";

const User = mongoose.model("user");
const RefreshToken = mongoose.model("refresh_token");
const clientPromise = mongoose.connect(url);

const inputToMongooseDoc = (obj: Record<string, any>) => {
    if (obj.id === undefined) return obj;
    const { id, ...data } = obj;
    return {
        _id: id,
        ...data,
    };
};

const transformRefreshTokenDoc = (obj: Record<string, any>) => {
    delete obj.__v;
    delete obj._id;
    return obj;
};

const db: Database = {
    getUsers: async () => {
        await clientPromise;
        const userDocs = await User.find().lean();
        return userDocs.map((user) => transformUserDoc(user)) as any[];
    },
    getRefreshTokens: async () => {
        await clientPromise;
        const refreshTokenDocs = await RefreshToken.find().lean();
        return refreshTokenDocs.map((refreshToken) =>
            transformRefreshTokenDoc(refreshToken)
        ) as any[];
    },
    insertUser: async (user) => {
        const userDoc = new User(inputToMongooseDoc(user));
        await userDoc.save();
    },
    insertRefreshToken: async (refreshToken) => {
        const refreshTokenDoc = new RefreshToken(
            inputToMongooseDoc(refreshToken)
        );
        await refreshTokenDoc.save();
    },
    clearUsers: async () => {
        await User.deleteMany().lean();
    },
    clearRefreshTokens: async () => {
        await RefreshToken.deleteMany().lean();
    },
};

testAdapter(mongodb(url), db);
