import { get, type Readable, readable } from "svelte/store";
import { onDestroy } from "svelte";
import type { GlobalWindow, LuciaContext, PageData } from "../types.js";
import { ClientUser, getClientUser, getServerUser } from "./user.js";

export const signOut = async (): Promise<void> => {
	const response = await fetch("/api/auth/logout", {
		method: "POST"
	});
	if (!response.ok) throw new Error("unknown error");
};

export const getUser = (): Readable<ClientUser> => {
	if (typeof window === "undefined") {
		return getServerUser();
	}
	return getClientUser();
};

const generateId = (): string => {
	const generateRandomNumber = (): number => {
		const randomNumber = Math.random();
		if (randomNumber !== 0) return randomNumber;
		return generateRandomNumber();
	};
	return generateRandomNumber().toString(36).slice(2, 7);
};

export const handleSession = (
	pageStore: Readable<{
		data: PageData;
	}>,
	onSessionUpdate: (hasSession: boolean) => void = () => {}
) => {
	if (typeof window === "undefined") return;
	const broadcastChannel = new BroadcastChannel("__lucia__");
	const tabId = generateId();
	const initialPageStoreValue = get(pageStore);
	const initialLuciaContext = initialPageStoreValue.data._lucia;
	if (!initialLuciaContext) throw new Error("pageData._lucia is undefined");
	const globalWindow = window as GlobalWindow;
	let pageStoreUnsubscribe = () => {},
		userStoreUnsubscribe = () => {};
	let initialLuciaStoreSubscription = true;
	onDestroy(() => {
		broadcastChannel.close();
		pageStoreUnsubscribe();
		userStoreUnsubscribe();
	});
	globalWindow._luciaStore = readable<LuciaContext>(initialLuciaContext, (set) => {
		globalWindow._setLuciaStore = set;
	});
	if (!globalWindow._luciaStore) throw new Error("_luciaStore is undefined");
	userStoreUnsubscribe = globalWindow._luciaStore.subscribe((newContext) => {
		/*
		prevent postMessage on store initialization
		*/
		if (initialLuciaStoreSubscription) return (initialLuciaStoreSubscription = false);
		broadcastChannel.postMessage({
			tabId: tabId,
			sessionChecksum: newContext.sessionChecksum
		});
	});
	pageStoreUnsubscribe = pageStore.subscribe((pageStoreValue) => {
		const newLuciaContext = pageStoreValue.data?._lucia;
		if (!newLuciaContext) throw new Error("pageData._lucia is undefined");
		if (!globalWindow._setLuciaStore) throw new Error("_setLuciaStore() is undefined");
		globalWindow._setLuciaStore(newLuciaContext);
	});
	broadcastChannel.addEventListener("message", ({ data }) => {
		const messageData = data as {
			tabId: string;
			sessionChecksum: string;
		};
		/*
		check if message is coming from the same tab
		*/
		if (messageData.tabId === tabId) return;
		if (!globalWindow._luciaStore) throw new Error("_luciaStore is undefined");
		const currentLuciaContext = get(globalWindow._luciaStore);
		/*
		check if session has changed from the previous page data
		*/
		if (messageData.sessionChecksum === currentLuciaContext.sessionChecksum) return;
		onSessionUpdate(!!messageData.sessionChecksum);
	});
};
