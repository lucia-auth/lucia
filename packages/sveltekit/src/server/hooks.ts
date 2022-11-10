import { handleLogoutRequest } from "./endpoints/index.js";
import type { Auth, Session, User } from "lucia-auth";
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
		event.url.pathname === "/api/auth/logout" && event.request.method === "POST";
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
		event.locals.setSession = (session: Session | null) => {
			auth.createSessionCookies(session).forEach((cookie) => {
				event.cookies.set(cookie.name, cookie.value, cookie.options);
			});
		};

		/*
		WTF is this?

		his allows validateRequest() to only run once in a single server request,
		regardless of the how many times getSession() is called

		on initial function call, it gets the session
		on initial promise resolve, resolve subsequent calls during promise pending
		store the cache for future use after first resolve
		*/
		let getSessionResolvers: ((val: any) => void)[] = [];
		let isInitialGetSessionCall = true;
		let session: Session | null | undefined = undefined;
		event.locals.getSession = async () =>
			new Promise((resolve) => {
				// return cached value
				if (typeof session !== "undefined") return resolve(session);
				if (isInitialGetSessionCall) {
					// not pending promise
					isInitialGetSessionCall = false;
					auth
						.validateRequest(event.request, event.locals.setSession)
						.then((sessionResult) => {
							session = sessionResult;
							resolve(sessionResult);
						})
						.catch(() => {
							session = null;
							resolve(null);
						})
						.finally(() => {
							// resolve every getSession() called during promise pending 
							getSessionResolvers.forEach((res) => res(session));
							getSessionResolvers = [];
						});
				}
				// cache not ready but resolve this promise when the pending promise is done
				getSessionResolvers.push(resolve);
			});
		/*
		same thing as above, but for session + user
		we can re-use the result of session from this inside getSession()
		*/
		let getSessionUserResolvers: ((
			val:
				| { user: User; session: Session }
				| {
						user: null;
						session: null;
				  }
		) => void)[] = [];
		let isInitialGetSessionUserCall = true;
		let user: User | null | undefined = undefined;
		event.locals.getSessionUser = async (): Promise<
			| { user: User; session: Session }
			| {
					user: null;
					session: null;
			  }
		> =>
			new Promise((resolve) => {
				if (typeof user !== "undefined") {
					if (typeof session === "undefined") throw new Error("UNEXPECTED: user is undefined");
					if (user === null && session === null) return resolve({ session, user });
					if (user === null || session === null)
						throw new Error("UNEXPECTED: user or session is undefined");
					return resolve({ session, user });
				}
				if (isInitialGetSessionUserCall) {
					isInitialGetSessionCall = false;
					isInitialGetSessionUserCall = false;
					auth
						.getSessionUserFromRequest(event.request, event.locals.setSession)
						.then((result) => {
							session = result.session;
							user = result.user;
							resolve(result);
							getSessionUserResolvers.forEach((res) => res(result));
							getSessionResolvers.forEach((res) => res(result.session));
						})
						.catch(() => {
							session = null;
							user = null;
							const result = { session: null, user: null };
							resolve(result);
							getSessionUserResolvers.forEach((res) => res(result));
							getSessionResolvers.forEach((res) => res(result.session));
						})
						.finally(() => {
							getSessionResolvers = [];
							getSessionUserResolvers = [];
						});
				}
				getSessionUserResolvers.push(resolve);
			});
		const requestHandler = getRequestHandler(event);
		if (requestHandler) return await requestHandler(event, auth);
		return await resolve(event, {
			transformPageChunk: setPageDataGlobalVariable
		});
	};
};
