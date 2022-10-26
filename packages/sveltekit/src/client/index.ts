import type { User } from "lucia-auth";
import { get, type Readable, readable } from "svelte/store";
import { getContext, setContext, onDestroy } from "svelte";
import type { GlobalWindow, LuciaContext } from "../types.js";

export const signOut = async (): Promise<void> => {
	await fetch("/api/auth/logout", {
		method: "POST"
	});
	const globalWindow = window as GlobalWindow;
	globalWindow._lucia = null;
};

type ClientUser = Readonly<User> | null;

export const getUser = (): Readable<ClientUser> => {
	const luciaContext = getContext("__lucia__") as LuciaContext | undefined;
	if (!luciaContext) throw new Error("Lucia context undefined");
	return luciaContext.user;
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
	const tabId = generateId();
	const initialPageStoreValue = get(pageStore);
	const initialPageData = initialPageStoreValue.data as { _lucia?: User | null };
	const initialUser = initialPageData?._lucia || null;
	const setUserGlobal = (user: ClientUser) => {
		if (typeof window === "undefined") return;
		const globalWindow = window as GlobalWindow;
		globalWindow._lucia = user;
	};
	let setUserStore: (user: ClientUser) => void = () => {};
	setContext("__lucia__", {
		user: readable<ClientUser>(initialUser, (set) => {
			setUserStore = set;
		})
	});
	const pageStoreUnsubscribe = pageStore.subscribe((pageStoreValue) => {
		const pageData = pageStoreValue.data as { _lucia?: User | null };
		const user = pageData?._lucia || null;
		setUserGlobal(user);
		setUserStore(user);
	});
	const userStore = getUser();
	if (typeof window === "undefined") return;
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
		setUserGlobal(messageData.user);
		setUserStore(messageData.user);
	});
	onDestroy(() => {
		broadcastChannel.close();
		pageStoreUnsubscribe();
		userStoreUnsubscribe();
	});
};
