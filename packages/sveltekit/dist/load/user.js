export const getUser = async (event) => {
    if (typeof window === "undefined") {
        // server
        const data = (await event.parent());
        return data._lucia ? Object.freeze(data._lucia) : null;
    }
    // client
    const globalWindow = window;
    if (globalWindow._lucia === undefined) {
        const initialUser = getInitialClientUser();
        globalWindow._lucia = {
            user: initialUser
        };
    }
    return globalWindow._lucia ? Object.freeze(globalWindow._lucia.user) : null;
};
const getInitialClientUser = () => {
    const globalWindow = window;
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
        if (curr)
            return { ...prev, ...curr.data };
        return prev;
    }, {});
    if (!pageData._lucia) {
        return null;
    }
    return Object.freeze(pageData._lucia);
};
