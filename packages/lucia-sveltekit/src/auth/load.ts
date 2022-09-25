import { deleteAllCookies, setCookie } from "../utils/cookie.js";
import type { Session } from "../types.js";
import {
    FingerprintToken,
    EncryptedRefreshToken,
    AccessToken,
} from "../utils/token.js";
import type { Context } from "./index.js";
import {
    createAccessToken,
    createRefreshToken,
    getAccountFromDatabaseData,
} from "../utils/auth.js";
import type { ServerLoad, ServerLoadEvent } from "../kit.js";

type HandleServerSession = <LoadFn extends ServerLoad = () => Promise<{}>>(
    serverLoad?: LoadFn
) => (
    event: ServerLoadEvent
) => Promise<Exclude<Awaited<ReturnType<LoadFn>>, void> & { _lucia: Session }>;

export const handleServerSessionFunction = (context: Context) => {
    const handleServerSessionCore = async ({
        cookies,
    }: ServerLoadEvent): Promise<{ _lucia: Session }> => {
        const fingerprintToken = new FingerprintToken(
            cookies.get("fingerprint_token") || "",
            context
        );
        const encryptedRefreshToken = new EncryptedRefreshToken(
            cookies.get("encrypt_refresh_token") || "",
            context
        );
        try {
            const accessToken = new AccessToken(
                cookies.get("access_token") || "",
                context
            );
            if (
                !accessToken.value &&
                !fingerprintToken.value &&
                !encryptedRefreshToken.value
            )
                return { _lucia: null };
            const refreshToken = encryptedRefreshToken.decrypt();
            try {
                const user = await accessToken.user(fingerprintToken.value); // throws an error is invalid
                return {
                    _lucia: {
                        user: user,
                        access_token: accessToken.value,
                        refresh_token: refreshToken.value,
                    },
                };
            } catch {}
            // if access token is invalid
            let userId: string;
            try {
                userId = await refreshToken.userId(fingerprintToken.value);
            } catch {
                // refresh token doesn't belong to the user
                if (refreshToken.value && !fingerprintToken.value) {
                    await context.adapter.deleteRefreshToken(
                        refreshToken.value
                    );
                }
                throw Error();
            }
            const databaseData = await context.adapter.getUserByRefreshToken(
                refreshToken.value
            );
            if (!databaseData) {
                /* refresh token belongs to the user
                BUT is expired. Likely stolen so delete all refresh tokens belonging to the user
                */
                await context.adapter.deleteUserRefreshTokens(userId);
                throw Error();
            }
            const newRefreshToken = await createRefreshToken(
                userId,
                fingerprintToken.value,
                context
            );
            // delete old refresh token and set new one
            await Promise.all([
                context.adapter.deleteRefreshToken(refreshToken.value),
                context.adapter.setRefreshToken(newRefreshToken.value, userId),
            ]);
            const newEncryptedRefreshToken = newRefreshToken.encrypt();
            const account = getAccountFromDatabaseData(databaseData);
            const newAccessToken = await createAccessToken(
                account.user,
                fingerprintToken.value,
                context
            );
            const result = {
                user: account.user,
                access_token: newAccessToken.value,
                refresh_token: newRefreshToken.value,
            };
            setCookie(
                cookies,
                newAccessToken.cookie(),
                newEncryptedRefreshToken.cookie()
            );
            return {
                _lucia: result,
            };
        } catch {
            // invalid token or network error
            deleteAllCookies(cookies);
            return {
                _lucia: null,
            };
        }
    };
    const handleServerSession: HandleServerSession = (fn?) => {
        return async (event: ServerLoadEvent) => {
            const { _lucia } = await handleServerSessionCore(event);
            const loadFunction = fn || (async () => {});
            const result = (await loadFunction(event)) || {};
            return {
                _lucia,
                ...result,
            } as Exclude<Awaited<ReturnType<typeof loadFunction>>, void> & {
                _lucia: Session;
            };
        };
    };
    return handleServerSession;
};
