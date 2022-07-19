import jwt from "jsonwebtoken";
import { compare, generateRandomString, hash } from "./crypto.js";
import cookieLib from "cookie";
import { LuciaError } from "./error.js";
import { DatabaseUser, LuciaSession, LuciaUser } from "../types.js";

const prod = false;

export const generateAccessToken = async (
    user: LuciaUser,
    fingerprint: string,
    secret: string
) => {
    const hashedFingerprint = await hash(fingerprint);
    const value = jwt.sign(
        {
            ...user,
            fingerprint_hash: hashedFingerprint,
        },
        secret,
        {
            expiresIn: 15 * 60,
        }
    );
    const cookie = cookieLib.serialize("access_token", value, {
        secure: prod,
        path: "/",
        maxAge: 60 * 15, // 15 minutes
        httpOnly: true,
        sameSite: "lax",
    });
    return { value, cookie };
};

export const generateRefreshToken = async (fingerprint: string) => {
    const hashedFingerprint = await hash(fingerprint);
    const value = `${generateRandomString(36)}:${hashedFingerprint}`; // hashedFingerprint consists of: a-z, A-z, 0-9, $, . , /
    const cookie = cookieLib.serialize("refresh_token", value, {
        secure: prod,
        path: "/",
        maxAge: 60 * 60 * 24 * 365 * 5, // 5 years
        httpOnly: true,
        sameSite: "lax",
    });
    return { cookie, value };
};

export const generateFingerprint = () => {
    const value = generateRandomString(64);
    const cookie = cookieLib.serialize("fingerprint", value, {
        secure: prod,
        path: "/",
        maxAge: 60 * 60 * 24 * 365 * 5, // 5 years
        httpOnly: true,
        sameSite: "lax",
    });
    return {
        value,
        cookie,
    };
};

export const validateRefreshTokenFingerprint = async (
    refreshToken: string,
    fingerprint: string
) => {
    try {
        const hashedFingerprint = refreshToken.split(":")[1];
        if (!hashedFingerprint)
            throw new LuciaError("AUTH_INVALID_REFRESH_TOKEN");
        await compare(fingerprint, hashedFingerprint);
    } catch (e) {
        throw new LuciaError("AUTH_INVALID_REFRESH_TOKEN");
    }
};

export const createBlankCookies = () => {
    return [
        cookieLib.serialize("fingerprint", "", {
            secure: prod,
            path: "/",
            maxAge: 0,
            httpOnly: true,
            sameSite: "lax",
        }),
        cookieLib.serialize("access_token", "", {
            secure: prod,
            path: "/",
            maxAge: 0,
            httpOnly: true,
            sameSite: "lax",
        }),
        cookieLib.serialize("refresh_token", "", {
            secure: prod,
            path: "/",
            maxAge: 0,
            httpOnly: true,
            sameSite: "lax",
        }),
    ];
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
