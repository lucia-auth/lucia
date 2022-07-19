import { Adapter } from "../types.js";
import { LuciaError } from "../utils/error.js";
import cookie from "cookie";
import {
    generateAccessToken,
    getAccountFromDatabaseData,
    validateRefreshTokenFingerprint,
} from "../utils/auth.js";
import { RequestEvent } from "@sveltejs/kit";
import { ErrorResponse } from "./index.js";

export const handleRefreshRequest = async (
    event: RequestEvent,
    adapter: Adapter,
    options: {
        secret: string;
    }
) => {
    try {
        const authorizationHeader =
            event.request.headers.get("Authorization") || "";
        const [tokenType, refreshToken] = authorizationHeader.split(" ");
        if (!tokenType || !refreshToken)
            throw new LuciaError("REQUEST_UNAUTHORIZED");
        if (tokenType !== "Bearer")
            throw new LuciaError("REQUEST_UNAUTHORIZED");
        if (!refreshToken) throw new LuciaError("REQUEST_UNAUTHORIZED");
        const cookies = cookie.parse(event.request.headers.get("cookie") || "");
        const fingerprint = cookies.fingerprint;
        try {
            await validateRefreshTokenFingerprint(refreshToken, fingerprint);
        } catch {
            throw new LuciaError("REQUEST_UNAUTHORIZED")
        }
        const databaseData = await adapter.getUserFromRefreshToken(
            refreshToken
        );
        if (!databaseData) throw new LuciaError("REQUEST_UNAUTHORIZED");
        const account = getAccountFromDatabaseData(databaseData);
        const accessToken = await generateAccessToken(
            account.user,
            fingerprint,
            options.secret
        );
        return new Response(
            JSON.stringify({
                access_token: accessToken.value,
            }),
            {
                headers: {
                    "set-cookie": [accessToken.cookie].join(","),
                },
            }
        );
    } catch (e) {
        let error = e as LuciaError;
        return new ErrorResponse(error);
    }
};
