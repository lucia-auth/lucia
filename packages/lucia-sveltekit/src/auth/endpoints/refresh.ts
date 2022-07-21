import { LuciaError } from "../../utils/error.js";
import cookie from "cookie";
import { getAccountFromDatabaseData } from "../../utils/auth.js";
import { RequestEvent } from "@sveltejs/kit";
import { ErrorResponse } from "./index.js";
import { Context } from "../index.js";

export const handleRefreshRequest = async (
    event: RequestEvent,
    context: Context
) => {
    try {
        const authorizationHeader =
            event.request.headers.get("Authorization") || "";
        const [tokenType, token] = authorizationHeader.split(" ");
        if (!tokenType || !token) throw new LuciaError("REQUEST_UNAUTHORIZED");
        if (tokenType !== "Bearer")
            throw new LuciaError("REQUEST_UNAUTHORIZED");
        if (!token) throw new LuciaError("REQUEST_UNAUTHORIZED");
        const cookies = cookie.parse(event.request.headers.get("cookie") || "");
        const fingerprintToken = context.auth.fingerprintToken(
            cookies.fingerprint_token
        );
        const refreshToken = context.auth.refreshToken(token);
        try {
            await refreshToken.validateFingerprint(fingerprintToken.value);
        } catch {
            throw new LuciaError("REQUEST_UNAUTHORIZED");
        }
        const databaseData = await context.adapter.getUserFromRefreshToken(
            refreshToken.value
        );
        if (!databaseData) throw new LuciaError("REQUEST_UNAUTHORIZED");
        const account = getAccountFromDatabaseData(databaseData);
        const accessToken = await context.auth.createAccessToken(
            account.user,
            fingerprintToken.value
        );
        return new Response(
            JSON.stringify({
                access_token: accessToken.value,
            }),
            {
                headers: {
                    "set-cookie": [accessToken.createCookie()].join(","),
                },
            }
        );
    } catch (e) {
        let error = e as LuciaError;
        return new ErrorResponse(error);
    }
};
