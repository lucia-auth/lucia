import { verifyRequestOrigin } from "oslo/request";

import type { Lucia, RequestContext, Session, User } from "./core.js";

export class RequestHandler {
	private lucia: Lucia;
	private requestContext: RequestContext;

	constructor(lucia: Lucia, requestContext: RequestContext) {
		this.lucia = lucia;
		this.requestContext = requestContext;
	}

	public setSessionCookie(sessionId: string): void {
		this.requestContext.setCookie(this.lucia.createSessionCookie(sessionId));
	}

	public deleteSessionCookie(): void {
		this.requestContext.setCookie(this.lucia.createBlankSessionCookie());
	}

	public async validateSessionCookie(csrfOptions?: {
		allowedSubdomains?: string[] | "*";
		hostHeader?: string;
	}): Promise<{ user: User; session: Session } | { user: null; session: null }> {
		const whitelistMethods = ["GET", "HEAD", "OPTIONS", "TRACE"];
		const whitelistedMethod = whitelistMethods.includes(this.requestContext.method.toUpperCase());
		const allowedDomains = csrfOptions?.allowedSubdomains ?? [];
		if (!whitelistedMethod && allowedDomains !== "*") {
			const hostHeaderName = csrfOptions?.hostHeader ?? "Host";
			const host = this.requestContext.headers.get(hostHeaderName);
			if (host) {
				allowedDomains.push(host);
			}
			const originHeader = this.requestContext.headers.get("Origin") ?? "";
			const validRequestOrigin = verifyRequestOrigin(originHeader, allowedDomains);
			if (!validRequestOrigin) {
				return {
					session: null,
					user: null
				};
			}
		}
		const cookieHeader = this.requestContext.headers.get("Cookie");
		if (!cookieHeader) {
			return {
				session: null,
				user: null
			};
		}
		const sessionCookie = this.lucia.readSessionCookie(cookieHeader);
		if (!sessionCookie) {
			return {
				session: null,
				user: null
			};
		}
		const { session, user } = await this.lucia.validateSession(sessionCookie);
		if (!session) {
			this.deleteSessionCookie();
			return { session, user };
		}
		if (session.fresh) {
			this.setSessionCookie(session.id);
		}
		return {
			session,
			user
		};
	}

	public async validateBearerToken(): Promise<
		{ user: User; session: Session } | { user: null; session: null }
	> {
		const authorizationHeader = this.requestContext.headers.get("Authorization");
		if (!authorizationHeader) {
			return {
				session: null,
				user: null
			};
		}
		const parts = authorizationHeader.split(" ");
		if (parts.length !== 2 || parts[0] !== "Bearer") {
			return {
				session: null,
				user: null
			};
		}
		return await this.lucia.validateSession(parts[1]);
	}
}
