import { Auth, Session, SESSION_COOKIE_NAME, User } from "lucia-auth";
import type { RequestEvent } from "./types.js";

export const handleHooks = (auth: Auth) => {
	return async (data: any) => {
		const event = data.event as RequestEvent;
		const resolve = data.resolve as (
			event: RequestEvent,
			options?: {
				transformPageChunk: (data: { html: string }) => string;
			}
		) => Promise<Response> | Response;
		let getSessionPromise: Promise<Session | null> | null = null;
		let getSessionUserPromise: Promise<
			| { user: User; session: Session }
			| {
					user: null;
					session: null;
			  }
		> | null = null;

		event.locals.setSession = (session: Session | null) => {
			auth.createSessionCookies(session).forEach((cookie) => {
				event.cookies.set(cookie.name, cookie.value, cookie.attributes);
			});
			getSessionPromise = null;
			getSessionUserPromise = null;
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
		return await resolve(event);
	};
};
