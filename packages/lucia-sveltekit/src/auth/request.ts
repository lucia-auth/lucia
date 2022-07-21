import { LuciaError } from "../utils/error.js";
import { Context } from "./index.js";
import cookie from "cookie";
import { LuciaUser } from "../types.js";

export type ValidateRequest = (request: Request) => Promise<LuciaUser>;
export const validateRequestFunction = (context: Context) => {
    const validateRequest: ValidateRequest = async (request) => {
        const authorizationHeader = request.headers.get("Authorization") || "";
        const [tokenType, token] = authorizationHeader.split(" ");
        if (!tokenType || !token)
            throw new LuciaError("AUTH_INVALID_ACCESS_TOKEN");
        if (tokenType !== "Bearer")
            throw new LuciaError("AUTH_INVALID_ACCESS_TOKEN");
        if (!token) throw new LuciaError("AUTH_INVALID_ACCESS_TOKEN");
        const cookies = cookie.parse(request.headers.get("cookie") || "");
        const fingerprintToken = context.auth.fingerprintToken(
            cookies.fingerprint_token
        );
        const accessToken = context.auth.accessToken(cookies.access_token);
        const user = await accessToken.user(fingerprintToken.value);
        return user;
    };
    return validateRequest
};
