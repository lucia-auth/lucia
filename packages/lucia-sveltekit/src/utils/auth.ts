import jwt from "jsonwebtoken";
import { generateRandomString, hash } from "./crypto.js";
import { AccessToken, FingerprintToken, RefreshToken } from "./token.js";

import type { DatabaseUser, User } from "../types.js";
import type { Context } from "../auth/index.js";

export const createAccessToken = async(
    user: User,
    fingerprintToken: string,
    context: Context
) => {
    const hashedFingerprint = await hash(fingerprintToken);
    const value = jwt.sign(
        {
            ...user,
            fingerprint_hash: hashedFingerprint,
            role: "access_token",
        },
        context.secret,
        {
            expiresIn: 15 * 60,
        }
    );
    return new AccessToken(value, context);
};

export const createRefreshToken = async (
    userId: string,
    fingerprintToken: string,
    context: Context
) => {
    const hashedFingerprint = await hash(fingerprintToken);
    const value = jwt.sign(
        {
            user_id: userId,
            fingerprint_hash: hashedFingerprint,
            role: "refresh_token",
        },
        context.secret,
        {
            expiresIn: 60 * 60 * 24 * 365, //1 year
        }
    );
    return new RefreshToken(value, context);
};

export const createFingerprintToken = (context: Context) => {
    const value = generateRandomString(64);
    return new FingerprintToken(value, context);
};

export const getAccountFromDatabaseData = (
    databaseData: DatabaseUser
) => {
    const userId = databaseData.id as string;
    const hashedPassword = databaseData.hashed_password as string | null;
    const identifierToken = databaseData.identifier_token as string;
    const userData = databaseData as Partial<DatabaseUser>;
    delete userData.hashed_password;
    delete userData.identifier_token;
    delete userData.id;
    const user = {
        user_id: userId,
        ...userData,
    } as User;
    return {
        user,
        hashed_password: hashedPassword,
        identifier_token: identifierToken,
    };
};
