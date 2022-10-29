import type { Request, Response, NextFunction } from "express";
import type { Auth, Session } from "lucia-auth";

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
		try {
			const session = await auth.validateRequest({
				headers: {
					get: (name: string) => {
						const value = req.headers[name];
						if (value === undefined) return null;
						if (typeof value === "string") return value;
						return value.join();
					}
				},
				url: req.url,
				method: req.method
			});
			req.app.locals.setSession(session);
			req.app.locals.getSession = () => {
				return session;
			};
		} catch {
			req.app.locals.getSession = () => {
				return null;
			};
			req.app.locals.clearSession();
		}
		next();
	};
	return middleware;
};
