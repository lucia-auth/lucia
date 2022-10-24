import { get, readable } from "svelte/store";
import { getContext, setContext, onDestroy } from "svelte";
export const signOut = async (redirect) => {
    await fetch("/api/auth/logout", {
        method: "POST"
    });
    if (redirect) {
        globalThis.location.href = redirect;
    }
    return;
};
export const getUser = () => {
    const luciaContext = getContext("__lucia__");
    if (!luciaContext)
        throw new Error("Lucia context undefined");
    return luciaContext.user;
};
const generateRandomNumber = () => {
    const randomNumber = Math.random();
    if (randomNumber !== 0)
        return randomNumber;
    return generateRandomNumber();
};
const generateId = () => {
    return generateRandomNumber().toString(36).slice(2, 7);
};
export const lucia = (pageStore) => {
    const tabId = generateId();
    const initialPageStoreValue = get(pageStore);
    const initialPageData = initialPageStoreValue.data;
    const initialUser = initialPageData?._lucia || null;
    const setUserGlobal = (user) => {
        if (typeof window === "undefined")
            return;
        const globalWindow = window;
        globalWindow._lucia = user;
    };
    let setUserStore = () => { };
    setContext("__lucia__", {
        user: readable(initialUser, (set) => {
            setUserStore = set;
        })
    });
    const pageStoreUnsubscribe = pageStore.subscribe((pageStoreValue) => {
        const pageData = pageStoreValue.data;
        const user = pageData?._lucia || null;
        setUserGlobal(user);
        setUserStore(user);
    });
    const userStore = getUser();
    if (typeof window === "undefined")
        return;
    const broadcastChannel = new BroadcastChannel("__lucia__");
    const userStoreUnsubscribe = userStore.subscribe((userStoreValue) => {
        broadcastChannel?.postMessage({
            user: userStoreValue,
            id: tabId
        });
    });
    broadcastChannel.addEventListener("message", ({ data }) => {
        const messageData = data;
        if (messageData.id === tabId)
            return;
        setUserGlobal(messageData.user);
        setUserStore(messageData.user);
    });
    onDestroy(() => {
        broadcastChannel.close();
        pageStoreUnsubscribe();
        userStoreUnsubscribe();
    });
};
