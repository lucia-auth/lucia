import { onDestroy } from "svelte";
import { get, type Writable } from "svelte/store";
import { getClientSession, getSSRSession } from "./session.js";
import type { Session } from "./types.js";
import { LuciaError } from "./utils/error.js";

export const signOut = async (redirect?: string): Promise<void> => {
    const sessionStore = getClientSession();
    const session = get(sessionStore);
    if (!session) throw new LuciaError("AUTH_NOT_AUTHENTICATED");
    const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${session?.access_token || ""}`,
        },
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

export const getSession = (): Writable<Session> => {
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
                if (!session?.access_token || !session?.refresh_token) return;
                const tokenData = getJwtPayload(session?.access_token);
                const currentTime = new Date().getTime();
                if (!tokenData) {
                    throw new LuciaError("AUTH_INVALID_ACCESS_TOKEN");
                }
                if (!tokenData.exp) {
                    throw new LuciaError("AUTH_INVALID_ACCESS_TOKEN");
                }
                if (currentTime + 60 * 1000 > tokenData.exp * 1000) {
                    await refresh(session);
                }
                checkAccessToken();
            } catch (e) {
                const error = e as LuciaError;
                console.error(error);
                errorHandler();
                clearInterval(interval);
            }
        }, 5000);
    };

    const refresh = async (session: Session) => {
        if (!session) return;
        const result = await refreshTokens(session.refresh_token);
        sessionStore.update((val) => {
            if (!val) return val;
            val.refresh_token = result.refresh_token;
            val.access_token = result.access_token;
            return val;
        });
    };

    const getJwtPayload = (token: string) => {
        return JSON.parse(window.atob(token.split(".")[1]));
    };

    onDestroy(() => {
        clearInterval(interval);
    });
};
