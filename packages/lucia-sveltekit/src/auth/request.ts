import { LuciaError } from "../utils/error.js";
import type { Context } from "./index.js";
import cookie from "cookie";
import type { ServerSession } from "../types.js";
import {
    AccessToken,
    FingerprintToken,
    EncryptedRefreshToken,
} from "../utils/token.js";
import { Error } from "../index.js";

type ValidateRequest = (
    request: Request
) => Promise<ServerSession>;
export const validateRequestFunction = (
    context: Context
) => {
    const validateRequest: ValidateRequest = async (request) => {
        const clonedReq = request.clone();
        const authorizationHeader =
            clonedReq.headers.get("Authorization") || "";
        const [tokenType, token] = authorizationHeader.split(" ");
        if (!tokenType || !token)
            throw new LuciaError("AUTH_INVALID_ACCESS_TOKEN");
        if (tokenType !== "Bearer")
            throw new LuciaError("AUTH_INVALID_ACCESS_TOKEN");
        if (!token) throw new LuciaError("AUTH_INVALID_ACCESS_TOKEN");
        const cookies = cookie.parse(clonedReq.headers.get("cookie") || "");
        const fingerprintToken = new FingerprintToken(
            cookies.fingerprint_token,
            context
        );
        const accessToken = new AccessToken(token, context);
        const encryptedRefreshToken = new EncryptedRefreshToken(
            cookies.encrypt_refresh_token,
            context
        );
        const refreshToken = encryptedRefreshToken.decrypt();
        const user = await accessToken.user(fingerprintToken.value);
        return {
            user,
            access_token: accessToken,
            refresh_token: refreshToken,
            fingerprint_token: fingerprintToken,
            cookies: [
                cookies.access_token,
                cookies.encrypt_refresh_token,
                cookies.fingerprint_token,
            ],
        };
    };
    return validateRequest;
};

export type ValidateRequestByCookie = (
    request: Request
) => Promise<ServerSession>;

export const validateRequestByCookieFunction = (
    context: Context
) => {
    const validateRequestByCookie: ValidateRequest = async (
        request
    ) => {
        const clonedReq = request.clone();
        const method = clonedReq.method;
        if (method !== "GET") throw new Error("AUTH_INVALID_REQUEST");
        const cookies = cookie.parse(clonedReq.headers.get("cookie") || "");
        const fingerprintToken = new FingerprintToken(
            cookies.fingerprint_token,
            context
        );
        const accessToken = new AccessToken(
            cookies.access_token,
            context
        );
        const user = await accessToken.user(fingerprintToken.value);
        const encryptedRefreshToken = new EncryptedRefreshToken(
            cookies.encrypt_refresh_token,
            context
        );
        const refreshToken = encryptedRefreshToken.decrypt();
        return {
            user,
            access_token: accessToken,
            refresh_token: refreshToken,
            fingerprint_token: fingerprintToken,
            cookies: [
                cookies.access_token,
                cookies.encrypt_refresh_token,
                cookies.fingerprint_token,
            ],
        };
    };
    return validateRequestByCookie;
};
