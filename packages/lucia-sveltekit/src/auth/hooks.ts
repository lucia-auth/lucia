import { Handle } from "@sveltejs/kit";
import { Context } from "./index.js";
import cookie from "cookie";
import { LuciaError } from "../utils/error.js";
import { getAccountFromDatabaseData } from "../utils/auth.js";
import { handleRefreshRequest } from "./endpoints/refresh.js";
import { handleLogoutRequest } from "./endpoints/logout.js";

export const handleTokensFunction = (context: Context) => {
    const handleTokens: Handle = async ({ resolve, event }) => {
        const cookies = cookie.parse(event.request.headers.get("cookie") || "");
        const fingerprintToken = context.auth.fingerprintToken(
            cookies.fingerprint_token
        );
        const encryptedRefreshToken = context.auth.encryptedRefreshToken(
            cookies.encrypt_refresh_token
        );
        try {
            const accessToken = context.auth.accessToken(cookies.access_token);
            const user = await accessToken.user(fingerprintToken.value); // throws an error is invalid
            const refreshToken = encryptedRefreshToken.decrypt();
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
            const refreshToken = encryptedRefreshToken.decrypt();
            await refreshToken.validateFingerprint(fingerprintToken.value);
            const databaseUser = await context.adapter.getUserFromRefreshToken(
                refreshToken.value
            );
            if (!databaseUser)
                throw new LuciaError("AUTH_INVALID_REFRESH_TOKEN");
            const account = getAccountFromDatabaseData(databaseUser);
            const accessToken = await context.auth.createAccessToken(
                account.user,
                fingerprintToken.value
            );
            event.locals.lucia = {
                user: account.user,
                access_token: accessToken.value,
                refresh_token: refreshToken.value,
            };
            const response = await resolve(event);
            response.headers.set("set-cookie", accessToken.createCookie());
            return response;
        } catch {
            // if refresh token is invalid
            event.locals.lucia = null;
            return await resolve(event);
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
