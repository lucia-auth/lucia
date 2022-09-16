import { deleteAllCookies } from "$lib/index.js";
import type { ServerLoadEvent } from "$lib/kit.js";
import { AccessToken, EncryptedRefreshToken, FingerprintToken } from "$lib/utils/token.js";
import type { AuthServerLoadEvent, Session } from "../types.js";
import type { Context } from "./index.js";

export const handleServerLoadFunction = (context: Context) => {
    const handleServerLoad = <
        LoadFunctions extends ((
            event: AuthServerLoadEvent,
            context: Context
        ) => Promise<Record<string, any>>)[]
    >(
        ...loadFunctions: LoadFunctions
    ) => {
        return async (event: ServerLoadEvent) => {
            const getSession = async (): Promise<Session> => {
                const accessToken = new AccessToken(event.cookies.get("access_token") || "", context)
                const encryptedRefreshToken = new EncryptedRefreshToken(event.cookies.get("encrypt_refresh_token") || "", context)
                const fingerprintToken = new FingerprintToken(event.cookies.get("fingerprint_token") || "", context)
                if (!accessToken.value || !fingerprintToken.value || !encryptedRefreshToken.value) {
                    deleteAllCookies(event.cookies)
                    return null
                }
                try {
                    const refreshToken = encryptedRefreshToken.decrypt()
                    const user = await accessToken.user(fingerprintToken.value)
                    return {
                        user,
                        access_token: accessToken.value,
                        refresh_token: refreshToken.value,
                    };
                } catch {
                    deleteAllCookies(event.cookies)
                    return null;
                }
            };
            let parentData: null | Record<string, any> = null;
            const parent = async () => {
                if (parentData) return parentData;
                const data = await event.parent();
                parentData = Object.freeze(data);
                return data;
            };
            event.parent = parent;
            const returnData = {};
            const customLoadEvent = {
                ...event,
                getSession,
            };
            for (const load of loadFunctions) {
                const data = await load(customLoadEvent, context);
                Object.assign(returnData, data);
            }
            return returnData;
        };
    };
    return handleServerLoad;
};
