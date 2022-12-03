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
	if (typeof document === "undefined") {
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

export class UndefinedError extends Error {
	constructor(
		type: "pageData._lucia" | "_luciaStore" | "_setLuciaStore" | "_luciaPageData" | "_lucia"
	) {
		const errorMsg = {
			"pageData._lucia":
				"page data property _lucia is undefined  - Make sure handleServerSession(auth) is set up inside the root +layout.server.ts",
			_luciaStore:
				"global variable _luciaStore is undefined - Make sure handleHooks(auth) is set up inside hooks.server.ts",
			_setLuciaStore:
				"global variable _setLuciaStore is undefined - Make sure handleHooks(auth) is set up inside hooks.server.ts",
			_luciaPageData:
				"global variable _luciaPageData is undefined - Make sure handleHooks(auth) is set up inside hooks.server.ts",
			_lucia:
				"_lucia context does not exist in page data - Make sure handleSession() set inside the root +layout.svelte file"
		} as const;
		super(errorMsg[type]);
	}
}

export const handleSession = (
	pageStore: Readable<{
		data: PageData;
	}>,
	onSessionUpdate: (hasSession: boolean) => void = () => {}
) => {
	if (typeof document === "undefined") return;
	const broadcastChannel = new BroadcastChannel("__lucia__");
	const tabId = generateId();
	const initialPageStoreValue = get(pageStore);
	const initialLuciaContext = initialPageStoreValue.data._lucia;
	if (!initialLuciaContext) throw new UndefinedError("pageData._lucia");
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
	if (!globalWindow._luciaStore) throw new UndefinedError("_luciaStore");
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
		if (!newLuciaContext) throw new UndefinedError("pageData._lucia");
		if (!globalWindow._setLuciaStore) throw new UndefinedError("_setLuciaStore");
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
		if (!globalWindow._luciaStore) throw new UndefinedError("_luciaStore");
		const currentLuciaContext = get(globalWindow._luciaStore);
		/*
		check if session has changed from the previous page data
		*/
		if (messageData.sessionChecksum === currentLuciaContext.sessionChecksum) return;
		onSessionUpdate(!!messageData.sessionChecksum);
	});
};
