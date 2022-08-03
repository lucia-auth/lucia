import type { Handle } from "@sveltejs/kit";
import type { Context } from "./index.js";
import cookie from "cookie";
import { LuciaError } from "../utils/error.js";
import {
    createAccessToken,
    createRefreshToken,
    getAccountFromDatabaseData,
} from "../utils/auth.js";
import { handleRefreshRequest } from "./endpoints/refresh.js";
import { handleLogoutRequest } from "./endpoints/logout.js";
import {
    AccessToken,
    createBlankCookies,
    EncryptedRefreshToken,
    FingerprintToken,
} from "../utils/token.js";

export const handleTokensFunction = (context: Context) => {
    const handleTokens: Handle = async ({ resolve, event }) => {
        const cookies = cookie.parse(event.request.headers.get("cookie") || "");
        const fingerprintToken = new FingerprintToken(
            cookies.fingerprint_token,
            context
        );
        const encryptedRefreshToken = new EncryptedRefreshToken(
            cookies.encrypt_refresh_token,
            context
        );
        const refreshToken = encryptedRefreshToken.decrypt();
        try {
            const accessToken = new AccessToken(cookies.access_token, context);
            const user = await accessToken.user(fingerprintToken.value); // throws an error is invalid
            event.locals.lucia = {
                user: user,
                access_token: accessToken.value,
                refresh_token: refreshToken.value,
            };
            const response = await resolve(event);
            return response;
        } catch {}
        // if access token is invalid
        try {
            let userId: string;
            try {
                userId = await refreshToken.userId(fingerprintToken.value);
            } catch {
                if (refreshToken.value && !fingerprintToken.value) {
                    await context.adapter.deleteRefreshToken(
                        refreshToken.value
                    );
                }
                throw new LuciaError("REQUEST_UNAUTHORIZED");
            }
            const databaseData = await context.adapter.getUserByRefreshToken(
                refreshToken.value
            );
            if (!databaseData) {
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
            const newEncryptedRefreshToken = newRefreshToken.encrypt();
            const account = getAccountFromDatabaseData(databaseData);
            const accessToken = await createAccessToken(
                account.user,
                fingerprintToken.value,
                context
            );
            event.locals.lucia = {
                user: account.user,
                access_token: accessToken.value,
                refresh_token: newRefreshToken.value,
            };
            const response = await resolve(event);
            response.headers.set(
                "set-cookie",
                [
                    accessToken.createCookie(),
                    newEncryptedRefreshToken.createCookie(),
                ].join(",")
            );
            return response;
        } catch {
            // if refresh token is invalid
            event.locals.lucia = null;
            const response = await resolve(event);
            if (encryptedRefreshToken.value) {
                response.headers.set(
                    "set-cookie",
                    createBlankCookies(context.env).join(",")
                );
            }
            return response;
        }
    };
    return handleTokens;
};

export const handleEndpointsFunction = (context: Context) => {
    const handleEndpoints: Handle = async ({ resolve, event }) => {
        if (
            event.url.pathname === "/api/auth/refresh" &&
            event.request.method === "POST"
        ) {
            return await handleRefreshRequest(event, context);
        }
        if (
            event.url.pathname === "/api/auth/logout" &&
            event.request.method === "POST"
        ) {
            return await handleLogoutRequest(event, context);
        }
        return await resolve(event);
    };
    return handleEndpoints;
};
