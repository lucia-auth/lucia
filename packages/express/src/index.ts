import type { Request, Response, NextFunction } from "express";
import type { Auth, Session, User } from "lucia-auth";
import { convertExpressRequestToStandardRequest } from "./request.js";

export const handleMiddleware = (auth: Auth) => {
	const middleware = async (req: Request, res: Response, next: NextFunction) => {
		req.app.locals.setSession = (session: Session | null) => {
			const cookies = auth.createSessionCookies(session);
			res.append("Set-Cookie", cookies.map((val) => val.serialize()).toString());
		};
		req.app.locals.getSession = async () => {
			try {
				return await auth.validateRequest(
					convertExpressRequestToStandardRequest(req, auth),
					req.app.locals.setSession as (session: Session | null) => void
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
					req.app.locals.setSession as (session: Session | null) => void
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
