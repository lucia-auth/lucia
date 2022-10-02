import { getContext, hasContext, setContext } from "svelte";
import { get, type Readable, writable } from "svelte/store";
import type { Session, SessionStore } from "./types.js";

/* 
sessions are only stored in a variable in a browser context
as it'll be shared across multiple requests when inside a server requests
which means it's possible for a users to read another user's data.

the general consensus is to store user data in svelte contexts
and lucia does that when running in the server.

however, since the session store has to be able to be accessible in load functions
and contexts only works within components (specifically on initialization),
we store it in a local variable.
*/
let clientSession: SessionStore;

export const getClientSession = (): SessionStore => {
    if (!clientSession) {
        setClientSession();
    }
    return clientSession!;
};

const setClientSession = (): void => {
    const w = globalThis as any as { _lucia_page_data: { data: any }[] };
    /* 
    global variable _lucia_page_data is set in index.html rendered by SvelteKit
    the code that sets the variable is injected by hooks handle function on creating a response.

    dataArr holds the data returned by server load functions, 
    which is used for reading cookies and exposing the user session to page data in lucia
    */
    const dataArr = w._lucia_page_data || [];
    const pageData = dataArr.reduce((prev, curr) => {
        if (curr) return { ...prev, ...curr.data };
        return prev;
    }, {}) as { _lucia?: Session | null };
    clientSession = writable(pageData._lucia);
};

/* this function will be only called when SSRing pages/components */
export const getSSRSession = (): SessionStore => {
    if (!hasContext("__lucia__")) {
        setSSRContext();
    }
    const luciaContext = getContext<{ session: SessionStore }>(
        "__lucia__"
    );
    return luciaContext.session;
};

const setSSRContext = (): void => {
    /* 
    "__svelte__" context is where $app/stores stores are stored during SSR.
    stores are stored in local variables in the sveltekit package (and not inside stores) in the client.
    */
    const svelteStores = getContext("__svelte__") as {
        page: Readable<{
            data: {
                _lucia?: Session | null;
            };
        }>;
    };
    const page = get(svelteStores.page);
    setContext("__lucia__", {
        session: writable(page.data._lucia || null),
    });
};
