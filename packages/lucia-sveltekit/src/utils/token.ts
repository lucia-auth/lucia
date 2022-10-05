import { generateRandomString } from "./crypto.js";
import cookie from "cookie";
import { getTimeAfterSeconds } from "./date.js";

export const createAccessToken = () => {
    return [`at_${generateRandomString(40)}`, getTimeAfterSeconds(60 * 60 * 8)] as const;
};

export const createAccessTokenCookie = (
    accessToken: string,
    expires: number,
    secure: boolean
) => {
    return cookie.serialize("access_token", accessToken, {
        expires: new Date(expires),
        secure,
        httpOnly: true,
        sameSite: "lax",
        path: "/",
    });
};

export const createRefreshToken = () => {
    return [`rt_${generateRandomString(40)}`] as const;
};

export const createRefreshTokenCookie = (
    refreshToken: string,
    secure: boolean
) => {
    return cookie.serialize("refresh_token", refreshToken, {
        maxAge: 60 * 24 * 365,
        secure,
        httpOnly: true,
        sameSite: "lax",
        path: "/",
    });
};
