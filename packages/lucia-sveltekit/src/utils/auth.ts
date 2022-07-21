import jwt from "jsonwebtoken";
import { generateRandomString, hash } from "./crypto.js";
import { DatabaseUser, LuciaUser } from "../types.js";
import { AccessToken, FingerprintToken, RefreshToken } from "./token.js";
import { Context } from "../auth/index.js";

export const createAccessToken = async (
    user: LuciaUser,
    fingerprintToken: string,
    context: Context
) => {
    const hashedFingerprint = await hash(fingerprintToken);
    const value = jwt.sign(
        {
            ...user,
            fingerprint_hash: hashedFingerprint,
        },
        context.secret,
        {
            expiresIn: 15 * 60,
        }
    );
    return new AccessToken(value, context);
};

export const createRefreshToken = async (
    fingerprint: string,
    context: Context
) => {
    const hashedFingerprint = await hash(fingerprint);
    const value = `${generateRandomString(36)}:${hashedFingerprint}`;
    return new RefreshToken(value, context);
};

export const createFingerprintToken = (context: Context) => {
    const value = generateRandomString(64);
    return new FingerprintToken(value, context)
};

export const getAccountFromDatabaseData = (databaseData: DatabaseUser) => {
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
    } as LuciaUser;
    return {
        user,
        hashed_password: hashedPassword,
        identifier_token: identifierToken,
    };
};
