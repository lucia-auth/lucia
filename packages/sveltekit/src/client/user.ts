import { getContext } from "svelte";
import { derived, get, type Readable } from "svelte/store";
import type { GlobalWindow, PageData } from "../types.js";
import type { User } from "lucia-auth";

export type ClientUser = Readonly<User> | null;

export const getServerUser = (): Readable<ClientUser> => {
	const { page } = getContext("__svelte__") as {
		page: Readable<{
			data: PageData;
		}>;
	};
	const luciaContext = get(page).data._lucia
    if (!luciaContext) throw new Error()
	return {
		subscribe: (subscriber) => {
			subscriber(luciaContext.user);
			return () => {};
		}
	};
};

export const getClientUser = (): Readable<ClientUser> => {
	const globalWindow = window as GlobalWindow;
	if (!globalWindow._luciaStore) throw new Error("");
	return derived(globalWindow._luciaStore, (val) => val.user);
};