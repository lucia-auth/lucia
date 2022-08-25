import type { Handle } from "@sveltejs/kit";
import type { Context } from "./index.js";

import cookie from "cookie";
import { handleRefreshRequest } from "./endpoints/refresh.js";
import { handleLogoutRequest } from "./endpoints/logout.js";
import { EncryptedRefreshToken } from "../utils/token.js";

export const handleTokensFunction = (context: Context) => {
    const handleTokens: Handle = async ({ resolve, event }) => {
        const cookies = cookie.parse(event.request.headers.get("cookie") || "");
        const fingerprintToken = cookies.fingerprint_token;
        const encryptedRefreshToken = new EncryptedRefreshToken(
            cookies.encrypt_refresh_token,
            context
        );
        const refreshToken = encryptedRefreshToken.decrypt();
        const accessToken = cookies.access_token;
        if (fingerprintToken && accessToken && refreshToken.value) {
            event.locals.lucia = {
                access_token: accessToken,
                refresh_token: refreshToken.value,
                fingerprint_token: fingerprintToken,
            };
        } else {
            event.locals.lucia = null;
        }
        return await resolve(event);
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
