import type { Handle, RequestEvent } from "../kit.js";
import type { Context } from "./index.js";

import { handleLogoutRequest } from "./endpoints/index.js";
import { Session } from "../types.js";
import cookie from "cookie";

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
            let sessionToSet: Session | null = null;
            let clearSession = false;
            event.locals.getSession = () => Object.freeze(session);
            event.locals.setSession = (session: Session) => {
                clearSession = false;
                sessionToSet = session;
            };
            event.locals.clearSession = () => {
                clearSession = true;
            };
            let session: Session | null = null;
            try {
                session = await context.auth.validateRequest(event.request);
            } catch {
                try {
                    const sessionId = event.cookies.get("auth_session") || "";
                    const renewedSession = await context.auth.renewSession(
                        sessionId
                    );
                    await context.auth.deleteDeadUserSessions(
                        renewedSession.userId
                    );
                    session = renewedSession;
                } catch (e) {
                    event.locals.clearSession();
                }
            }
            const requestHandler = getRequestHandler(event);
            if (requestHandler) return await requestHandler(event, context);
            const response = await resolve(event, {
                transformPageChunk: setPageDataGlobalVariable,
            });
            if (sessionToSet) {
                const target: Session = sessionToSet;
                response.headers.append(
                    "set-cookie",
                    cookie.serialize("auth_session", target.sessionId, {
                        httpOnly: true,
                        expires: new Date(target.idlePeriodExpires),
                        secure: context.env === "PROD",
                        path: "/",
                        sameSite: "lax",
                    })
                );
            }
            if (clearSession) {
                response.headers.append(
                    "set-cookie",
                    cookie.serialize("auth_session", "", {
                        httpOnly: true,
                        maxAge: 0,
                        secure: context.env === "PROD",
                        path: "/",
                        sameSite: "lax",
                    })
                );
            }
            return response;
        };
    };
    return handleHooks;
};
