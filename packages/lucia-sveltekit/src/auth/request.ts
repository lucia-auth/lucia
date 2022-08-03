import { LuciaError } from "../utils/error.js";
import type { Context } from "./index.js";
import cookie from "cookie";
import type { User } from "../types.js";
import { AccessToken, FingerprintToken } from "../utils/token.js";
import { Error } from "../index.js";

export type ValidateRequest<UserData extends {}> = (
    request: Request
) => Promise<User<UserData>>;
export const validateRequestFunction = <UserData extends {}>(
    context: Context
) => {
    const validateRequest: ValidateRequest<UserData> = async (request) => {
        const authorizationHeader = request.headers.get("Authorization") || "";
        const [tokenType, token] = authorizationHeader.split(" ");
        if (!tokenType || !token)
            throw new LuciaError("AUTH_INVALID_ACCESS_TOKEN");
        if (tokenType !== "Bearer")
            throw new LuciaError("AUTH_INVALID_ACCESS_TOKEN");
        if (!token) throw new LuciaError("AUTH_INVALID_ACCESS_TOKEN");
        const cookies = cookie.parse(request.headers.get("cookie") || "");
        const fingerprintToken = new FingerprintToken(
            cookies.fingerprint_token,
            context
        );
        const accessToken = new AccessToken<UserData>(token, context);
        const user = await accessToken.user(fingerprintToken.value);
        return user;
    };
    return validateRequest;
};

export type ValidateRequestByCookie<UserData extends {}> = (
    request: Request
) => Promise<User<UserData>>;

export const validateRequestByCookieFunction = <UserData extends {}>(
    context: Context
) => {
    const validateRequestByCookie: ValidateRequest<UserData> = async (
        request
    ) => {
        const method = request.method;
        if (method !== "GET")
            throw new Error("AUTH_INVALID_REQUEST");
        const cookies = cookie.parse(request.headers.get("cookie") || "");
        const fingerprintToken = new FingerprintToken(
            cookies.fingerprint_token,
            context
        );
        const accessToken = new AccessToken<UserData>(
            cookies.access_token,
            context
        );
        const user = await accessToken.user(fingerprintToken.value);
        return user;
    };
    return validateRequestByCookie;
};
