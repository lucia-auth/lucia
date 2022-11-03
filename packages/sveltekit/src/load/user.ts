import type { User } from "lucia-auth";
import { get, readable } from "svelte/store";
import { getInitialClientLuciaContext } from "../client/page-data.js";
import type { GlobalWindow, LuciaContext, PageData } from "../types.js";

export const getUser = async (event: {
	parent: () => Promise<any>;
}): Promise<Readonly<User> | null> => {
	if (typeof window === "undefined") {
		// server
		const pageData = (await event.parent()) as PageData;
		if (!pageData._lucia) throw new Error("pageData._lucia is undefined");
		return Object.freeze(pageData._lucia.user);
	}
	// client
	const globalWindow = window as GlobalWindow;
	if (typeof globalWindow._luciaHooksRanLast === "undefined")
		throw new Error("pageData._luciaHooksRanLast is undefined");
	if (globalWindow._luciaHooksRanLast === false) {
		if (!globalWindow._luciaStore) throw new Error("_luciaStore is undefined");
		const storedLuciaContext = get(globalWindow._luciaStore);
		if (storedLuciaContext.user) return storedLuciaContext.user;
		const pageData = (await event.parent()) as PageData;
		if (!pageData._lucia) throw new Error("pageData._lucia is undefined");
		if (!globalWindow._setLuciaStore) throw new Error("_setLuciaStore is undefined");
		const luciaContext = pageData._lucia;
		if (storedLuciaContext.sessionChecksum !== luciaContext.sessionChecksum) {
			globalWindow._setLuciaStore(luciaContext);
		}
		return pageData._lucia.user;
	}
	const initialLuciaContext = getInitialClientLuciaContext();
	return initialLuciaContext.user;
};
