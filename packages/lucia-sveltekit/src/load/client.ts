import type { LoadEvent } from "../kit.js";
import { get } from "svelte/store";

import { getUser as getClientUser } from "../client.js";

export const getUser = async (event: LoadEvent) => {
    if (typeof window === "undefined") {
        // server
        const data = await event.parent();
        return data._lucia;
    }
    // client
    const sessionStore = getClientUser();
    const session = get(sessionStore);
    return session;
};