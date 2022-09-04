import type { Session } from "../types.js";
import {
    createAccessToken,
    createRefreshToken,
    getAccountFromDatabaseData,
} from "../utils/auth.js";
import {
    AccessToken,
    createBlankCookies,
    EncryptedRefreshToken,
    FingerprintToken,
} from "../utils/token.js";
import type { ServerLoadEvent } from "../kit.js";
import type { Context } from "./index.js";
import cookie from "cookie";

export type Load = (event: ServerLoadEvent) => Promise<{
    lucia: Session | null;
}>;

export const loadFunction = (context: Context) => {
    const load: Load = async ({ setHeaders, request }) => {
        const cookies = cookie.parse(request.headers.get("cookie") || "");
        const fingerprintToken = new FingerprintToken(
            cookies.fingerprint_token,
            context
        );
        const encryptedRefreshToken = new EncryptedRefreshToken(
            cookies.encrypt_refresh_token,
            context
        );
        const refreshToken = encryptedRefreshToken.decrypt();
        const accessToken = new AccessToken(cookies.access_token, context);
        try {
            const user = await accessToken.user(fingerprintToken.value); // throws an error is invalid
            return {
                lucia: {
                    user: user,
                    access_token: accessToken.value,
                    refresh_token: refreshToken.value,
                },
            };
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
                return {
                    lucia: null,
                };
            }
            const databaseData = await context.adapter.getUserByRefreshToken(
                refreshToken.value
            );
            if (!databaseData) {
                await context.adapter.deleteUserRefreshTokens(userId);
                return {
                    lucia: null,
                };
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
            const result = {
                user: account.user,
                access_token: accessToken.value,
                refresh_token: newRefreshToken.value,
            };
            setHeaders({
                "set-cookie": [
                    accessToken.createCookie(),
                    newEncryptedRefreshToken.createCookie(),
                ].join(","),
            });
            return {
                lucia: result,
            };
        } catch {
            // if refresh token is invalid
            if (refreshToken.value) {
                setHeaders({
                    "set-cookie": createBlankCookies(context.env).join(","),
                });
            }
            return {
                lucia: null,
            };
        }
    };
    return load;
};
