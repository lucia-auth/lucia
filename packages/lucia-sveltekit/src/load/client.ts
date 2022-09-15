import type { LoadEvent } from "$lib/kit.js";
import type { AuthLoadEvent } from "../types.js";
import { get } from "svelte/store";

import { getSession as getClientSession } from "../client.js";

export const handleLoad = <
    LoadFunctions extends ((
        event: AuthLoadEvent
    ) => Promise<Record<string, any>>)[]
>(
    ...loadFunctions: LoadFunctions
) => {
    return async (event: LoadEvent) => {
        let parentData: null | Record<string, any> = null;
        const parentFunction = event.parent;
        const customParent = async () => {
            if (parentData) return parentData;
            const data = await parentFunction();
            parentData = data;
            return data;
        };
        const getSession = async () => {
            if (typeof window === "undefined") {
                // server
                const data = await customParent();
                return data._lucia;
            }
            // client
            const sessionStore = getClientSession();
            const session = get(sessionStore);
            return session;
        };
        event.parent = customParent;
        const returnData = {};
        const customLoadEvent = {
            ...event,
            getSession,
        };
        for (const load of loadFunctions) {
            try {
                const data = await load(customLoadEvent);
                Object.assign(returnData, data);
            } catch (exception) {
                throw exception;
            }
        }
        return returnData;
    };
};
