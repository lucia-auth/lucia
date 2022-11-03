import type { GlobalWindow, LuciaContext, PageData } from "../types.js";

export const getInitialClientLuciaContext = (): LuciaContext => {
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
	const dataArr = globalWindow._luciaPageData;
	const pageData = dataArr.reduce((prev, curr) => {
		if (curr) return { ...prev, ...curr.data };
		return prev;
	}, {}) as PageData;
	if (!pageData._lucia) throw new Error("pageData._lucia is undefined");
	return pageData._lucia;
};
