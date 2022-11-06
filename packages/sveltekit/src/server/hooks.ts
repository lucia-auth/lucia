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
		event.locals.getSession = async () => {
			try {
				const session = await auth.validateRequest(event.request, event.locals.setSession);
				return session;
			} catch {
				return null;
			}
		};
		event.locals.getSessionUser = async (): Promise<
			| { user: User; session: Session }
			| {
					user: null;
					session: null;
			  }
		> => {
			try {
				return await auth.getSessionUserFromRequest(event.request, event.locals.setSession);
			} catch {
				return {
					user: null,
					session: null
				};
			}
		};
		const requestHandler = getRequestHandler(event);
		if (requestHandler) return await requestHandler(event, auth);
		return await resolve(event, {
			transformPageChunk: setPageDataGlobalVariable
		});
	};
};
