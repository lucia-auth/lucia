import { getContext, hasContext, setContext } from "svelte";
import { get, type Readable } from "svelte/store";
import type { User } from "./types.js";

/* 
user is only stored in a variable in a browser context
as it'll be shared across multiple requests when inside a server context
which means it's possible for a users to read another user's data.

the general consensus is to store user data in svelte contexts
and lucia does that when running in the server.
*/

let clientUser: Readonly<User> | null;

export const getClientUser = (): Readonly<User> | null => {
    if (!clientUser) {
        setClientUser();
    }
    return clientUser;
};

const setClientUser = (): void => {
    const w = globalThis as any as { _lucia_page_data: { data: any }[] };
    if (!w._lucia_page_data)
        throw new Error("_lucia_page_data is undefined", {
            cause: "Make sure auth.handleHooks() is set up inside the hooks.server.ts",
        });
    /* 
    global variable _lucia_page_data is set in index.html rendered by SvelteKit
    the code that sets the variable is injected by hooks handle function on creating a response.

    dataArr holds the data returned by server load functions, 
    which is used for reading cookies and exposing the user to page data in lucia
    */
    const dataArr = w._lucia_page_data || [];
    const pageData = dataArr.reduce((prev, curr) => {
        if (curr) return { ...prev, ...curr.data };
        return prev;
    }, {}) as {
        _lucia?: User | null;
    };
    if (!pageData._lucia) {
        clientUser = null;
        return;
    }
    clientUser = Object.freeze(pageData._lucia);
};

/* this function will be only called when SSRing pages/components */
export const getSSRUser = (): Readonly<User> | null => {
    if (!hasContext("__lucia__")) {
        setSSRContext();
    }
    const luciaContext = getContext<{ user: Readonly<User> | null }>(
        "__lucia__"
    );
    return luciaContext.user;
};

const setSSRContext = (): void => {
    /* 
    "__svelte__" context is where $app/stores stores are stored during SSR.
    stores are stored in local variables in the sveltekit package (and not inside stores) in the client.
    */
    const svelteStores = getContext("__svelte__") as {
        page: Readable<{
            data: {
                _lucia?: User | null;
            };
        }>;
    };
    const page = get(svelteStores.page);
    if (!page.data._lucia) {
        setContext("__lucia__", {
            user: null,
        });
        return;
    }
    setContext("__lucia__", {
        user: Object.freeze(page.data._lucia),
    });
};
