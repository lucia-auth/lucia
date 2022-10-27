import type { User } from "lucia-auth";
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
	// if lucia() in +layout.svelte hasn't run yet
	if (globalWindow._lucia === undefined) {
		const initialUser = getInitialClientUser();
		globalWindow._lucia = initialUser
	}
	// if hooks ran after before new session set
	if (globalWindow._lucia) return Object.freeze(globalWindow._lucia);
	const data = (await event.parent()) as {
		_lucia: User | null;
	};
	if (!data._lucia) return null;
	globalWindow._lucia = {
		user: data._lucia
	};
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
	return pageData._lucia || null
};
