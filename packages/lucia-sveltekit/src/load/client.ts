import type { LoadEvent } from "../kit.js";
import { get } from "svelte/store";

import { getUser as getClientUser } from "../client.js";
import { User } from "../types.js";

export const getUser = async (event: LoadEvent): Promise<User | null>  => {
    if (typeof window === "undefined") {
        // server
        const data = await event.parent() as {
            _lucia: User | null
        };
        return data._lucia;
    }
    // client
    const user = getClientUser();
    return user;
};