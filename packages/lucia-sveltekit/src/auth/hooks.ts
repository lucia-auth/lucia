import type { Handle, RequestEvent } from "../kit.js";
import type { Context } from "./index.js";

import { handleLogoutRequest } from "./endpoints/index.js";
import { LuciaError } from "../error.js";
import { Session } from "../types.js";

export const getRequestHandler = (event: RequestEvent) => {
    const isLogoutPOSTRequest =
        event.url.pathname === "/api/auth/logout" &&
        event.request.method === "POST";
    if (isLogoutPOSTRequest) return handleLogoutRequest;
    return null;
};

const setPageDataGlobalVariable = ({ html }: { html: string }) => {
    // finds hydrate.data value from parameter of start()
    const pageDataFunctionRegex = new RegExp(
        /(<script type="module" data-sveltekit-hydrate=".*?">)[\s\S]*start\(\s*\{[\s\S]*?hydrate:[\s\S]*?data:\s*\(\s*(function\([\s\S]*?\)\s*{[\s\S]*?return[\s\S]*)\),\s*form:[\s\S]*?\}\);\s*<\/script>/gm
    );
    const scriptTagContentMatches = pageDataFunctionRegex.exec(html);
    if (!scriptTagContentMatches) return html;
    const [_, scriptTagMatch, pageDataFunctionMatch] = scriptTagContentMatches;
    if (!scriptTagMatch || !pageDataFunctionMatch) return html;
    html = html.replace(
        scriptTagMatch,
        `${scriptTagMatch}
    window._lucia_page_data = ${pageDataFunctionMatch};
    `
    );
    return html;
};

export const handleHooksFunction = (context: Context) => {
    const handleHooks = () => {
        return async ({ event, resolve }: Parameters<Handle>[0]) => {
            let session: Session | null = null;
            try {
                session = await context.auth.validateRequest(event.request)
            } catch {
                try {
                    const sessionId = event.cookies.get("auth_session") || "";
                    const { session: renewedSession, setSessionCookie } =
                        await context.auth.renewSession(sessionId);
                    await context.auth.deleteDeadUserSessions(
                        renewedSession.userId
                    );
                    setSessionCookie(event.cookies);
                    session = renewedSession;
                } catch (e) {
                    context.auth.deleteAllCookies(event.cookies);
                }
            }
            event.locals.getSession = () => Object.freeze(session);
            const requestHandler = getRequestHandler(event);
            if (requestHandler) return await requestHandler(event, context);
            return await resolve(event, {
                transformPageChunk: setPageDataGlobalVariable,
            });
        };
    };
    return handleHooks;
};
