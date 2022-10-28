import type { User } from "lucia-auth";
import { get, type Readable, readable } from "svelte/store";
import { getContext, onDestroy } from "svelte";
import type { GlobalWindow } from "../types.js";

export const signOut = async (): Promise<void> => {
	await fetch("/api/auth/logout", {
		method: "POST"
	});
	const globalWindow = window as GlobalWindow;
	if (globalWindow._setUserStore) globalWindow._setUserStore(null);
};

type ClientUser = Readonly<User> | null;

export const getUser = (): Readable<ClientUser> => {
	if (typeof window === "undefined") {
		return getServerUser();
	}
	return getClientUser();
};

const getServerUser = (): Readable<ClientUser> => {
	const { page } = getContext("__svelte__") as { page: Readable<{ data: {
		_lucia?: ClientUser
	} }> };
	const user = get(page).data._lucia || null;
	return {
		subscribe: (subscriber) => {
			subscriber(user);
			return () => {};
		}
	};
};

const getClientUser = (): Readable<ClientUser> => {
	const globalWindow = window as GlobalWindow;
	if (!globalWindow._userStore) throw new Error("");
	return globalWindow._userStore;
};

const generateRandomNumber = (): number => {
	const randomNumber = Math.random();
	if (randomNumber !== 0) return randomNumber;
	return generateRandomNumber();
};

const generateId = (): string => {
	return generateRandomNumber().toString(36).slice(2, 7);
};

export const handleSession = (
	pageStore: Readable<{
		data: Record<string, any>;
	}>
) => {
	if (typeof window === "undefined") return;
	const tabId = generateId();
	const initialPageStoreValue = get(pageStore);
	const initialPageData = initialPageStoreValue.data as { _lucia?: User | null };
	const initialUser = initialPageData?._lucia || null;
	const globalWindow = window as GlobalWindow;
	if (!globalWindow._userStore) {
		globalWindow._userStore = readable<ClientUser>(initialUser, (set) => {
			globalWindow._setUserStore = set;
		});
	}
	const pageStoreUnsubscribe = pageStore.subscribe((pageStoreValue) => {
		const pageData = pageStoreValue.data as { _lucia?: User | null };
		const user = pageData?._lucia || null;
		if (!globalWindow._setUserStore) throw new Error("_setUserStore() is undefined");
		globalWindow._setUserStore(user);
	});
	const userStore = getUser();
	const broadcastChannel = new BroadcastChannel("__lucia__");
	const userStoreUnsubscribe = userStore.subscribe((userStoreValue) => {
		broadcastChannel?.postMessage({
			user: userStoreValue,
			id: tabId
		});
	});
	broadcastChannel.addEventListener("message", ({ data }) => {
		const messageData = data as {
			user: ClientUser;
			id: string;
		};
		if (messageData.id === tabId) return;
		if (!globalWindow._setUserStore) throw new Error("_setUserStore() is undefined");
		globalWindow._setUserStore(messageData.user);
	});
	onDestroy(() => {
		broadcastChannel.close();
		pageStoreUnsubscribe();
		userStoreUnsubscribe();
	});
};
