import type { Request, Response, NextFunction } from "express";
import type { Auth, Session, User } from "lucia-auth";
import { convertExpressRequestToStandardRequest } from "./request.js";

export const handleMiddleware = (auth: Auth) => {
	const middleware = async (req: Request, res: Response, next: NextFunction) => {
		req.app.locals.setSession = (session: Session) => {
			const serializedCookies = auth.createSessionCookies(session);
			res.append("Set-Cookie", serializedCookies.join());
		};
		req.app.locals.clearSession = () => {
			const serializedCookies = auth.createBlankSessionCookies();
			res.append("Set-Cookie", serializedCookies.join());
		};
		const setCookie = (stringifiedCookie: string) => {
			res.append("Set-Cookie", stringifiedCookie);
		};
		req.app.locals.getSession = async () => {
			try {
				return await auth.validateRequest(
					convertExpressRequestToStandardRequest(req, auth),
					setCookie
				);
			} catch {
				return null;
			}
		};
		req.app.locals.getSessionUser = async (): Promise<
			| { user: User; session: Session }
			| {
					user: null;
					session: null;
			  }
		> => {
			try {
				return await auth.getSessionUserFromRequest(
					convertExpressRequestToStandardRequest(req, auth),
					setCookie
				);
			} catch {
				return {
					session: null,
					user: null
				};
			}
		};

		next();
	};
	return middleware;
};
