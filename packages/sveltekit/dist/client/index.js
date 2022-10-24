import { get, derived } from "svelte/store";
import { getContext, setContext } from "svelte";
export const signOut = async (redirect) => {
    const user = get(getUser());
    if (!user)
        throw new Error("AUTH_NOT_AUTHENTICATED");
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
    }
    catch (e) {
        console.error(e);
        throw new Error("UNKNOWN_ERROR");
    }
    if (result.message)
        throw new Error(result.message);
};
export const getUser = () => {
    const luciaContext = getContext("__lucia__");
    if (!luciaContext)
        throw new Error("Lucia context undefined");
    return luciaContext.user;
};
export const lucia = (pageStore) => {
    setContext("__lucia__", {
        user: derived(pageStore, (pageStoreValue) => {
            const pageData = pageStoreValue.data;
            const user = pageData?._lucia || null;
            if (typeof window === "undefined")
                return user;
            const globalWindow = window;
            globalWindow._lucia = {
                user
            };
            return user;
        })
    });
};
