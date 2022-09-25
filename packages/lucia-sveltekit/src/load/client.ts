import type { LoadEvent } from "../kit.js";
import { get } from "svelte/store";

import { getSession as getClientSession } from "../client.js";

export const getSession = async (event: LoadEvent) => {
    if (typeof window === "undefined") {
        // server
        const data = await event.parent();
        return data._lucia;
    }
    // client
    const sessionStore = getClientSession();
    const session = get(sessionStore);
    return session;
};