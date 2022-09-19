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

type ValidateRequest = (request: Request) => Promise<ServerSession>;
export const validateRequestFunction = (context: Context) => {
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
        const refreshToken = encryptedRefreshToken.decrypt(); // throws AUTH_INVALID_REFRESH_TOKEN if invalid
        const user = await accessToken.user(fingerprintToken.value); // throws AUTH_INVALID_ACCESS_TOKEN if either token is invalid
        return {
            user,
            access_token: accessToken,
            refresh_token: refreshToken,
            fingerprint_token: fingerprintToken,
            cookies: [
                accessToken.cookie(),
                refreshToken.cookie(),
                fingerprintToken.cookie(),
            ],
        };
    };
    return validateRequest;
};

export type ValidateRequestByCookie = (
    request: Request
) => Promise<ServerSession>;

export const validateRequestByCookieFunction = (context: Context) => {
    const validateRequestByCookie: ValidateRequest = async (request) => {
        const clonedReq = request.clone();
        const method = clonedReq.method;
        if (method !== "GET") throw new Error("AUTH_INVALID_REQUEST_METHOD");
        const cookies = cookie.parse(clonedReq.headers.get("cookie") || "");
        const fingerprintToken = new FingerprintToken(
            cookies.fingerprint_token,
            context
        );
        const accessToken = new AccessToken(cookies.access_token, context);
        const user = await accessToken.user(fingerprintToken.value);
        const encryptedRefreshToken = new EncryptedRefreshToken(
            cookies.encrypt_refresh_token,
            context
        );
        try {
            const refreshToken = encryptedRefreshToken.decrypt();
            return {
                user,
                access_token: accessToken,
                refresh_token: refreshToken,
                fingerprint_token: fingerprintToken,
                cookies: [
                    accessToken.cookie(),
                    refreshToken.cookie(),
                    fingerprintToken.cookie(),
                ],
            };
        } catch {
            throw new Error("AUTH_INVALID_REFRESH_TOKEN");
        }
    };
    return validateRequestByCookie;
};
