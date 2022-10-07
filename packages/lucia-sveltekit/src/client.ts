import { onDestroy } from "svelte";
import { get } from "svelte/store";
import { getClientSession, getSSRSession } from "./session.js";
import type { Session, SessionStore } from "./types.js";
import { LuciaError } from "./utils/error.js";

export const signOut = async (redirect?: string): Promise<void> => {
    const sessionStore = getClientSession();
    const session = get(sessionStore);
    if (!session) throw new LuciaError("AUTH_NOT_AUTHENTICATED");
    const response = await fetch("/api/auth/logout", {
        method: "POST"
    });
    if (response.ok) {
        if (redirect) {
            globalThis.location.href = redirect;
        }
        return;
    }
    let result;
    try {
        result = await response.json();
    } catch (e) {
        console.error(e);
        throw new LuciaError("UNKNOWN_ERROR");
    }
    if (result.message) throw new LuciaError(result.message);
};

export const refreshTokens = async (): Promise<{
    expires: number
}> => {
    const response = await fetch("/api/auth/refresh", {
        method: "POST"
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
    const result = await response.json() as {
        expires: number
    }
    return {
        expires: result.expires
    };
};

export const getSession = (): SessionStore => {
    if (typeof window === "undefined") {
        // server
        return getSSRSession();
    }
    // browser
    return getClientSession();
};

export const handleSilentRefresh = (errorHandler: () => void = () => {}) => {
    if (typeof window === "undefined") return;
    const sessionStore = getSession();
    let interval: NodeJS.Timer;
    const checkAccessToken = () => {
        setTimeout(async () => {
            const session = get(sessionStore);
            try {
                const currentTime = new Date().getTime();
                if (!session) {
                    throw new LuciaError("AUTH_INVALID_ACCESS_TOKEN");
                }
                if (!session.expires) {
                    throw new LuciaError("AUTH_INVALID_ACCESS_TOKEN");
                }
                if (currentTime + 60 * 1000 * 5 > session.expires * 1000) {
                    await refresh(session);
                }
                checkAccessToken();
            } catch (e) {
                const error = e as LuciaError;
                console.error(error);
                errorHandler();
                clearInterval(interval);
            }
        }, 60 * 1000);
    };
    checkAccessToken()
    const refresh = async (session: Session) => {
        if (!session) return;
        const result = await refreshTokens();
        sessionStore.update((val) => {
            if (!val) return val;
            val.expires = result.expires
            return val;
        });
    };

    onDestroy(() => {
        clearInterval(interval);
    });
};
