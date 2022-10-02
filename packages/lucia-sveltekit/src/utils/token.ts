import { generateRandomString, hashSHA256, verifySHA256 } from "./crypto.js";
import type { Context } from "../auth/index.js";
import cookie from "cookie";
import { getTimeAfterSeconds } from "./date.js";

export const createAccessToken = () => {
    return [`at_${generateRandomString(40)}`, getTimeAfterSeconds(60 * 60 * 8)] as const;
};

export const createAccessTokenCookie = (
    accessToken: string,
    expires: number,
    context: Context
) => {
    return cookie.serialize("access_token", accessToken, {
        expires: new Date(expires),
        secure: context.env === "PROD",
        httpOnly: true,
        sameSite: "lax",
        path: "/",
    });
};

export const createRefreshToken = (userId: string, context: Context) => {
    const hashedUserId = hashSHA256(userId, context.secret);
    return `rt_${generateRandomString(40)}.${hashedUserId}.${userId}`;
};

export const createRefreshTokenCookie = (
    refreshToken: string,
    context: Context
) => {
    return cookie.serialize("refresh_token", refreshToken, {
        maxAge: 60 * 24 * 365,
        secure: context.env === "PROD",
        httpOnly: true,
        sameSite: "lax",
        path: "/",
    });
};
