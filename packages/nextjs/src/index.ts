import type { Auth, Session, User } from "lucia-auth";
import type { NextRequest, NextResponse } from "./types.js";
import { convertNextRequestToStandardRequest } from "./request.js";

export const handleApiRoutes = (auth: Auth) => {
	return async (req: NextRequest, res: NextResponse) => {
		if (!res.status) throw new Error("Invalid response type");
		const authRequest = new AuthRequest(auth, req, res);
		if ((req.url || "").startsWith("/api/auth/user") && req.method === "GET") {
			const { user } = await authRequest.getSessionUser();
			return res.status(200).json({
				user
			});
		}
		if ((req.url || "").startsWith("/api/auth/logout") && req.method === "POST") {
			const session = await authRequest.getSession();
			if (!session) {
				return res.status(401).json({
					error: "Unauthorized"
				});
			}
			try {
				await auth.invalidateSession(session.sessionId);
				authRequest.clearSession();
				return res.status(200).json({});
			} catch {
				return res.status(500).json({
					error: "Unknown"
				});
			}
		}
		return res.status(404).json({
			error: "Not found"
		});
	};
};

export class AuthRequest<A extends Auth> {
	private auth: A;
	private req: NextRequest;
	private res: NextResponse;
	constructor(auth: A, req: NextRequest, res: NextResponse) {
		this.auth = auth;
		this.req = req;
		this.res = res;
	}
	public getSession = async () => {
		try {
			const session = await this.auth.validateRequest(
				convertNextRequestToStandardRequest(this.req, this.auth),
				(stringifiedSerializedCookies) => {
					this.res.setHeader("set-cookie", stringifiedSerializedCookies);
				}
			);
			return session;
		} catch (e) {
			return null;
		}
	};
	public setSession = (session: Session) => {
		this.res.setHeader("set-cookie", this.auth.createSessionCookies(session).toString());
	};
	public clearSession = () => {
		this.res.setHeader("set-cookie", this.auth.createBlankSessionCookies().toString());
	};
	public getSessionUser = async (): Promise<
		| { user: User; session: Session }
		| {
				user: null;
				session: null;
		  }
	> => {
		try {
			return await this.auth.getSessionUserFromRequest(
				convertNextRequestToStandardRequest(this.req, this.auth),
				(stringifiedSerializedCookies) => {
					this.res.setHeader("set-cookie", stringifiedSerializedCookies);
				}
			);
		} catch (e) {
			return {
				session: null,
				user: null
			};
		}
	};
}
