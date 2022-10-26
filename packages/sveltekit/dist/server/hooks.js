import { handleLogoutRequest } from "./endpoints/index.js";
const setPageDataGlobalVariable = ({ html }) => {
    // finds hydrate.data value from parameter of start()
    const pageDataFunctionRegex = new RegExp(/(<script type="module" data-sveltekit-hydrate=".*?">)[\s\S]*start\(\s*\{[\s\S]*?hydrate:[\s\S]*?data:\s*\(\s*(function\([\s\S]*?\)\s*{[\s\S]*?return[\s\S]*)\),\s*form:[\s\S]*?\}\);\s*<\/script>/gm);
    const scriptTagContentMatches = pageDataFunctionRegex.exec(html);
    if (!scriptTagContentMatches)
        return html;
    const [_, scriptTagMatch, pageDataFunctionMatch] = scriptTagContentMatches;
    if (!scriptTagMatch || !pageDataFunctionMatch)
        return html;
    html = html.replace(scriptTagMatch, `${scriptTagMatch}
    window._luciaPageData = ${pageDataFunctionMatch};
    `);
    return html;
};
export const getRequestHandler = (event) => {
    const isLogoutPOSTRequest = event.url.pathname === "/api/auth/logout" && event.request.method === "POST";
    if (isLogoutPOSTRequest)
        return handleLogoutRequest;
    return null;
};
export const handleHooks = (auth) => {
    return async ({ event, resolve }) => {
        let session = null;
        let sessionToSet = null;
        let clearSession = false;
        event.locals.getSession = () => Object.freeze(session);
        event.locals.setSession = (session) => {
            clearSession = false;
            sessionToSet = session;
        };
        event.locals.clearSession = () => {
            clearSession = true;
        };
        try {
            session = await auth.validateRequest(event.request);
            event.locals.setSession(session);
        }
        catch {
            event.locals.clearSession();
        }
        const requestHandler = getRequestHandler(event);
        if (requestHandler)
            return await requestHandler(event, auth);
        const response = await resolve(event, {
            transformPageChunk: setPageDataGlobalVariable
        });
        if (sessionToSet) {
            const targetSession = sessionToSet;
            const serializedCookies = auth.createSessionCookies(targetSession);
            response.headers.append("set-cookie", serializedCookies.join());
        }
        if (clearSession) {
            const serializedCookies = auth.createBlankSessionCookies();
            response.headers.append("set-cookie", serializedCookies.join());
        }
        return response;
    };
};
