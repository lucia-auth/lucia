import type { GlobalWindow, LuciaContext, PageData } from "../types.js";
import { UndefinedError } from "./index.js";

export const getInitialClientLuciaContext = (): LuciaContext => {
	const globalWindow = window as GlobalWindow;
	if (!globalWindow._luciaPageData) throw new UndefinedError("_luciaPageData");
	/* 
    global variable _luciaPageData is set in index.html rendered by SvelteKit
    the code that sets the variable is injected by hooks handle function on creating a response.
    dataArr holds the data returned by server load functions, 
    which is used for reading cookies and exposing the user to page data in lucia
    */
	const dataArr = globalWindow._luciaPageData;
	const pageData = dataArr.reduce((prev, curr) => {
		if (curr) return { ...prev, ...curr.data };
		return prev;
	}, {}) as PageData;
	if (!pageData._lucia) throw new UndefinedError("pageData._lucia");
	return pageData._lucia;
};
