import { verifyRequestOrigin } from "oslo/request";

import type { Lucia, RequestContext, Session, User } from "./core.js";

export class LuciaRequest {
	private auth: Lucia;
	private requestContext: RequestContext;

	constructor(auth: Lucia, requestContext: RequestContext) {
		this.auth = auth;
		this.requestContext = requestContext;
	}

	public setSessionCookie(sessionId: string): void {
		this.requestContext.setCookie(this.auth.createSessionCookie(sessionId));
	}

	public deleteSessionCookie(): void {
		this.requestContext.setCookie(this.auth.createBlankSessionCookie());
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
		const sessionCookie = this.auth.readSessionCookie(cookieHeader);
		if (!sessionCookie) {
			return {
				session: null,
				user: null
			};
		}
		const { session, user } = await this.auth.validateSession(sessionCookie);
		if (!session) {
			return { session, user };
		}
		if (session.fresh) {
			const sessionCookie = this.auth.createSessionCookie(session.id);
			this.requestContext.setCookie(sessionCookie);
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
		return await this.auth.validateSession(parts[1]);
	}
}
