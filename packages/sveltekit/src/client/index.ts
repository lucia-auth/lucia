import { get, type Readable, derived } from "svelte/store";
import { onDestroy, setContext } from "svelte";
import type { PageData } from "../types.js";

import { getContext } from "svelte";
import type { User } from "lucia-auth";

export type ClientUser = Readonly<User> | null;

export const getUser = (): Readable<ClientUser> => {
	const luciaContext = getContext("__lucia__") as null | Readable<ClientUser>;
	if (!luciaContext) throw new UndefinedError("__lucia__");
	return luciaContext;
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
	constructor(type: "pageData._lucia" | "__lucia__") {
		const errorMsg = {
			"pageData._lucia":
				"page data property _lucia is undefined  - Make sure handleServerSession(auth) is set up inside the root +layout.server.ts",
			__lucia__:
				"context __lucia__ does not exist in your app - Make sure handleSession() is set inside the root +layout.svelte file"
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
	const luciaStore = derived(pageStore, (val) => {
		const luciaPageData = val.data._lucia;
		if (luciaPageData === undefined)
			throw new UndefinedError("pageData._lucia");
		return luciaPageData;
	});
	const userStore = derived(luciaStore, (val) => val.user);
	setContext("__lucia__", userStore);
	if (typeof document === "undefined") return;
	const broadcastChannel = new BroadcastChannel("__lucia__");
	const tabId = generateId();
	let initialLuciaStoreSubscription = true;
	const luciaStoreUnsubscribe = luciaStore.subscribe((newVal) => {
		/*
		prevent postMessage on store initialization
		*/
		if (initialLuciaStoreSubscription)
			return (initialLuciaStoreSubscription = false);
		broadcastChannel.postMessage({
			tabId: tabId,
			sessionChecksum: newVal.sessionChecksum
		});
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
		const currentLuciaContext = get(luciaStore);
		/*
		check if session has changed from the previous page data
		*/
		if (messageData.sessionChecksum === currentLuciaContext.sessionChecksum)
			return;
		onSessionUpdate(!!messageData.sessionChecksum);
	});
	onDestroy(() => {
		broadcastChannel.close();
		luciaStoreUnsubscribe();
	});
};
