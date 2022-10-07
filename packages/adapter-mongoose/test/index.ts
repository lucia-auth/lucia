import mongoose from "mongoose";
import type { Database } from "@lucia-sveltekit/adapter-test";
import mongodb from "../src/index.js";

import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({
    path: `${resolve()}/.env`,
});

const url = process.env.MONGODB_URL;

if (!url) throw new Error(".env is not set up");

const User = mongoose.model(
    "user",
    new mongoose.Schema(
        {
            _id: {
                type: String,
            },
            provider_id: {
                type: String,
                unique: true,
                required: true,
            },
            hashed_password: String,
            username: {
                unique: true,
                type: String,
                required: true,
            },
            email: {
                unique: true,
                type: String,
                required: true,
            },
        },
        { _id: false }
    )
);
const RefreshToken = mongoose.model(
    "refresh_token",
    new mongoose.Schema({
        refresh_token: {
            unique: true,
            required: true,
            type: String,
        },
        user_id: {
            required: true,
            type: String,
        },
    })
);

const Session = mongoose.model(
    "session",
    new mongoose.Schema({
        access_token: {
            type: String,
            unique: true,
            required: true,
        },
        user_id: {
            type: String,
            required: true,
        },
        expires: {
            type: Number,
            required: true,
        },
    })
);

export const adapter = mongodb(mongoose, url);

const clientPromise = mongoose.connect(url);

const inputToMongooseDoc = (obj: Record<string, any>) => {
    if (obj.id === undefined) return obj;
    const { id, ...data } = obj;
    return {
        _id: id,
        ...data,
    };
};

export const db: Database = {
    getUsers: async () => {
        await clientPromise;
        const userDocs = await User.find().lean();
        return userDocs.map((doc) => {
            const { _id: id, ...expectedValue } = doc;
            return {
                id,
                ...expectedValue,
            } as Required<{ id: string } & typeof expectedValue>;
        });
    },
    getRefreshTokens: async () => {
        await clientPromise;
        const refreshTokenDocs = await RefreshToken.find().lean();
        return refreshTokenDocs.map((doc) => {
            const { _id: id, ...expectedValue } = doc;
            return expectedValue as Required<typeof expectedValue>;
        });
    },
    getSessions: async () => {
        await clientPromise;
        const sessionDocs = await Session.find().lean();
        return sessionDocs.map((doc) => {
            const { _id: id, ...expectedValue } = doc;
            return expectedValue as Required<typeof expectedValue>;
        });
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
    insertSession: async (session) => {
        const sessionDoc = new Session(inputToMongooseDoc(session));
        await sessionDoc.save();
    },
    clearUsers: async () => {
        await User.deleteMany().lean();
    },
    clearRefreshTokens: async () => {
        await RefreshToken.deleteMany().lean();
    },
    clearSessions: async () => {
        await Session.deleteMany().lean();
    },
};
