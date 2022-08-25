import { getContext } from "svelte";
import type { Writable } from "svelte/store";
import type { Session } from "./types.js";
import { LuciaError } from "./utils/error.js";
export { default as Lucia } from "./Lucia.svelte";

export const signOut = async () => {
    const response = await fetch("/api/auth/logout", {
        method: "POST",
    });
    if (response.ok) return { error: null };
    let result;
    try {
        result = await response.json();
    } catch (e) {
        console.error(e);
        throw new LuciaError("UNKNOWN_ERROR");
    }
    throw new LuciaError(result.message);
};

export const refreshTokens = async (refreshToken: string) => {
    const response = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${refreshToken}`,
        },
    });
    if (!response.ok) {
        let result;
        try {
            result = await response.json();
        } catch (e) {
            console.error(e);
            throw new LuciaError("UNKNOWN_ERROR");
        }
        throw new LuciaError(result.message);
    }
    const result = await response.json();
    return {
        refresh_token: result.refresh_token,
        access_token: result.access_token,
    };
};

export const getSession = () => {
    const stores = getContext("__lucia__") as Record<string, Writable<any>>;
    return stores.session as Writable<Session>;
};