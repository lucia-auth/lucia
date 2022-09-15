import type { ServerLoadEvent } from "$lib/kit.js";
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
                const accessToken = event.cookies.get("access_token");
                const fingerprintToken = event.cookies.get("fingerprint_token");
                const refreshToken = event.cookies.get("refresh_token");
                if (!accessToken || !fingerprintToken || !refreshToken)
                    return null;
                try {
                    const user = await context.auth.getUserFromAccessToken(
                        accessToken,
                        fingerprintToken
                    );
                    return {
                        user,
                        access_token: accessToken,
                        refresh_token: refreshToken,
                    };
                } catch {
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
