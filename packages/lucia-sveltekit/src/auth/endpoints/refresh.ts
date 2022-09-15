import { LuciaError } from "../../utils/error.js";
import cookie from "cookie";
import { createAccessToken, createRefreshToken, getAccountFromDatabaseData } from "../../utils/auth.js";
import type { RequestEvent } from "../../kit.js";
import { ErrorResponse } from "./index.js";
import type { Context } from "../index.js";
import { FingerprintToken, RefreshToken } from "../../utils/token.js";

export const handleRefreshRequest = async (
    event: RequestEvent,
    context: Context
) => {
    try {
        const authorizationHeader =
            event.request.headers.get("Authorization") || "";
        const [tokenType, token] = authorizationHeader.split(" ");
        if (!tokenType || !token) throw new LuciaError("REQUEST_UNAUTHORIZED");
        if (tokenType !== "Bearer") {
            console.error("Missing token type Bearer")
            throw new LuciaError("REQUEST_UNAUTHORIZED");
        }
        if (!token) throw new LuciaError("REQUEST_UNAUTHORIZED");
        const cookies = cookie.parse(event.request.headers.get("cookie") || "");
        const fingerprintToken = new FingerprintToken(
            cookies.fingerprint_token,
            context
        );
        const refreshToken = new RefreshToken(token, context);
        let userId: string;
        try {
            userId = await refreshToken.userId(fingerprintToken.value);
        } catch {
            console.error("Invalid refresh or fingerprint token")
            throw new LuciaError("REQUEST_UNAUTHORIZED");
        }
        const databaseData = await context.adapter.getUserByRefreshToken(
            refreshToken.value
        );
        if (!databaseData) {
            console.error("Refresh token not found in db")
            await context.adapter.deleteUserRefreshTokens(userId);
            throw new LuciaError("REQUEST_UNAUTHORIZED");
        }
        const newRefreshToken = await createRefreshToken(
            userId,
            fingerprintToken.value,
            context
        );
        await Promise.all([
            context.adapter.deleteRefreshToken(refreshToken.value),
            context.adapter.setRefreshToken(newRefreshToken.value, userId),
        ]);
        const account = getAccountFromDatabaseData(databaseData);
        const accessToken = await createAccessToken(
            account.user,
            fingerprintToken.value,
            context
        );
        const newEncryptedRefreshToken = newRefreshToken.encrypt()
        return new Response(
            JSON.stringify({
                access_token: accessToken.value,
                refresh_token: newRefreshToken.value,
            }),
            {
                headers: {
                    "set-cookie": [
                        accessToken.cookie(),
                        newEncryptedRefreshToken.cookie(),
                    ].join(","),
                },
            }
        );
    } catch (e) {
        let error = e as LuciaError;
        return new ErrorResponse(error);
    }
};
