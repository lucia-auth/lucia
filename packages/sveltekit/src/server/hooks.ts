import { handleLogoutRequest } from "./endpoints/index.js";
import { Auth, Session, SESSION_COOKIE_NAME, User } from "lucia-auth";
import type { RequestEvent } from "../types.js";

const setPageDataGlobalVariable = ({ html }: { html: string }) => {
	// finds hydrate.data value from parameter of start()
	const pageDataFunctionRegex = new RegExp(
		/(<script type="module" data-sveltekit-hydrate=".*?">)[\s\S]*start\(\s*\{[\s\S]*?hydrate:[\s\S]*?data:\s*(\[[\s\S]*?\]),\s*form:[\s\S]*?\}\);\s*<\/script>/gm
	);
	const scriptTagContentMatches = pageDataFunctionRegex.exec(html);
	if (!scriptTagContentMatches) return html;
	const [_, scriptTagMatch, pageDataFunctionMatch] = scriptTagContentMatches;
	if (!scriptTagMatch || !pageDataFunctionMatch) return html;
	html = html.replace(
		scriptTagMatch,
		`${scriptTagMatch}
    window._luciaPageData = ${pageDataFunctionMatch};
	window._luciaHooksRanLast = true;
    `
	);
	return html;
};

export const getRequestHandler = (event: RequestEvent) => {
	const isLogoutPOSTRequest =
		event.url.pathname === "/api/auth/logout" &&
		event.request.method === "POST";
	if (isLogoutPOSTRequest) return handleLogoutRequest;
	return null;
};
export const handleHooks = (auth: Auth) => {
	return async ({
		event,
		resolve
	}: {
		event: RequestEvent;
		resolve: (
			event: RequestEvent,
			options?: {
				transformPageChunk: (data: { html: string }) => string;
			}
		) => Promise<Response> | Response;
	}) => {
		let getSessionPromise: Promise<Session | null> | undefined;
		let getSessionUserPromise:
			| Promise<
					| { user: User; session: Session }
					| {
							user: null;
							session: null;
					  }
			  >
			| undefined;

		event.locals.setSession = (session: Session | null) => {
			auth.createSessionCookies(session).forEach((cookie) => {
				event.cookies.set(cookie.name, cookie.value, cookie.attributes);
			});
			getSessionPromise = undefined;
			getSessionUserPromise = undefined;
		};

		event.locals.validate = async () => {
			if (getSessionPromise) return getSessionPromise;
			if (getSessionUserPromise) return (await getSessionUserPromise).session;
			getSessionPromise = new Promise(async (resolve) => {
				try {
					auth.validateRequestHeaders(event.request);
					const sessionId = event.cookies.get(SESSION_COOKIE_NAME) || "";
					const session = await auth.validateSession(sessionId);
					if (session.isFresh) {
						event.locals.setSession(session);
					}
					resolve(session);
				} catch {
					event.locals.setSession(null);
					resolve(null);
				}
			});
			return getSessionPromise;
		};
		event.locals.validateUser = async () => {
			if (getSessionUserPromise) return getSessionUserPromise;
			getSessionUserPromise = new Promise(async (resolve) => {
				try {
					auth.validateRequestHeaders(event.request);
					const sessionId = event.cookies.get(SESSION_COOKIE_NAME) || "";
					const { session, user } = await auth.validateSessionUser(sessionId);
					if (session.isFresh) {
						event.locals.setSession(session);
					}
					resolve({ session, user });
				} catch {
					resolve({
						session: null,
						user: null
					});
				}
			});
			return getSessionUserPromise;
		};

		const requestHandler = getRequestHandler(event);
		if (requestHandler) return await requestHandler(event, auth);
		return await resolve(event, {
			transformPageChunk: setPageDataGlobalVariable
		});
	};
};
