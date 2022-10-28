import type { User } from "lucia-auth";
import { get, readable } from "svelte/store";
import type { GlobalWindow } from "../types.js";

export const getUser = async (event: {
	parent: () => Promise<any>;
}): Promise<Readonly<User> | null> => {
	if (typeof window === "undefined") {
		// server
		const data = (await event.parent()) as {
			_lucia: User | null;
		};
		return data._lucia ? Object.freeze(data._lucia) : null;
	}
	// client
	const globalWindow = window as GlobalWindow;
	if (!globalWindow._userStore) {
		globalWindow._userStore = readable(getInitialClientUser(), (set) => {
			globalWindow._setUserStore = set
		})
	}
	const storedUser = get(globalWindow._userStore);
	// if hooks ran after before new session set
	if (storedUser) return storedUser;
	const data = (await event.parent()) as {
		_lucia: User | null;
	};
	if (!data._lucia) return null;
	if (!globalWindow._setUserStore) throw new Error("_setUserStore() is undefined");
	globalWindow._setUserStore(data._lucia);
	return data._lucia;
};

const getInitialClientUser = (): User | null => {
	const globalWindow = window as GlobalWindow;
	if (!globalWindow._luciaPageData)
		throw new Error("_luciaPageData is undefined", {
			cause: "Make sure auth.handleHooks() is set up inside the hooks.server.ts"
		});
	/* 
    global variable _lucia_page_data is set in index.html rendered by SvelteKit
    the code that sets the variable is injected by hooks handle function on creating a response.
    dataArr holds the data returned by server load functions, 
    which is used for reading cookies and exposing the user to page data in lucia
    */
	const dataArr = globalWindow._luciaPageData || [];
	const pageData = dataArr.reduce((prev, curr) => {
		if (curr) return { ...prev, ...curr.data };
		return prev;
	}, {}) as {
		_lucia?: User | null;
	};
	return pageData._lucia || null;
};
