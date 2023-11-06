import { debug } from "../utils/debug.js";

import { LuciaError } from "./error.js";
import { createHeadersFromObject } from "../utils/request.js";
import { isAllowedOrigin, safeParseUrl } from "../utils/url.js";

import type { Auth, Env, Session } from "./index.js";
import type { Cookie } from "./cookie.js";

export type LuciaRequest = {
	method: string;
	url?: string;
	headers: Pick<Headers, "get">;
};
export type RequestContext = {
	sessionCookie?: string | null;
	request: LuciaRequest;
	setCookie: (cookie: Cookie) => void;
};

export type Middleware<Args extends any[] = any> = (context: {
	args: Args;
	env: Env;
	sessionCookieName: string;
}) => MiddlewareRequestContext;

type MiddlewareRequestContext = Omit<RequestContext, "request"> & {
	sessionCookie?: string | null;
	request: {
		method: string;
		url?: string;
		headers:
			| Pick<Headers, "get">
			| {
					origin: string | null;
					cookie: string | null;
					authorization: string | null;
			  }; // remove regular object: v3
		storedSessionCookie?: string | null; // remove: v3
	};
	setCookie: (cookie: Cookie) => void;
};

export type CSRFProtectionConfiguration = {
	host?: string;
	hostHeader?: string;
	allowedSubDomains?: string[] | "*";
};

export class AuthRequest<_Auth extends Auth = any> {
	private auth: _Auth;
	private requestContext: RequestContext;

	constructor(
		auth: _Auth,
		config: {
			requestContext: RequestContext;
			csrfProtection: boolean | CSRFProtectionConfiguration;
		}
	) {
		debug.request.init(
			config.requestContext.request.method,
			config.requestContext.request.url ?? "(url unknown)"
		);
		this.auth = auth;
		this.requestContext = config.requestContext;

		const csrfProtectionConfig =
			typeof config.csrfProtection === "object" ? config.csrfProtection : {};
		const csrfProtectionEnabled = config.csrfProtection !== false;

		if (
			!csrfProtectionEnabled ||
			this.isValidRequestOrigin(csrfProtectionConfig)
		) {
			this.storedSessionId =
				this.requestContext.sessionCookie ??
				auth.readSessionCookie(
					this.requestContext.request.headers.get("Cookie")
				);
		} else {
			this.storedSessionId = null;
		}
		this.bearerToken = auth.readBearerToken(
			this.requestContext.request.headers.get("Authorization")
		);
	}

	private validatePromise: Promise<Session | null> | null = null;
	private validateBearerTokenPromise: Promise<Session | null> | null = null;
	private storedSessionId: string | null;
	private bearerToken: string | null;

	public setSession = (session: Session | null) => {
		const sessionId = session?.sessionId ?? null;
		if (this.storedSessionId === sessionId) return;
		this.validatePromise = null;
		this.setSessionCookie(session);
	};

	private maybeSetSession = (session: Session | null) => {
		try {
			this.setSession(session);
		} catch {
			// ignore error
			// some middleware throw error
		}
	};

	private setSessionCookie = (session: Session | null) => {
		const sessionId = session?.sessionId ?? null;
		if (this.storedSessionId === sessionId) return;
		this.storedSessionId = sessionId;
		this.requestContext.setCookie(this.auth.createSessionCookie(session));
		if (session) {
			debug.request.notice("Session cookie stored", session.sessionId);
		} else {
			debug.request.notice("Session cookie deleted");
		}
	};

	public validate = async (): Promise<Session | null> => {
		if (this.validatePromise) {
			debug.request.info("Using cached result for session validation");
			return this.validatePromise;
		}
		this.validatePromise = new Promise(async (resolve, reject) => {
			if (!this.storedSessionId) return resolve(null);
			try {
				const session = await this.auth.validateSession(this.storedSessionId);
				if (session.fresh) {
					this.maybeSetSession(session);
				}
				return resolve(session);
			} catch (e) {
				if (
					e instanceof LuciaError &&
					e.message === "AUTH_INVALID_SESSION_ID"
				) {
					this.maybeSetSession(null);
					return resolve(null);
				}
				return reject(e);
			}
		});

		return await this.validatePromise;
	};

	public validateBearerToken = async (): Promise<Session | null> => {
		if (this.validateBearerTokenPromise) {
			debug.request.info("Using cached result for bearer token validation");
			return this.validatePromise;
		}
		this.validatePromise = new Promise(async (resolve, reject) => {
			if (!this.bearerToken) return resolve(null);
			try {
				const session = await this.auth.validateSession(this.bearerToken);
				return resolve(session);
			} catch (e) {
				if (e instanceof LuciaError) {
					return resolve(null);
				}
				return reject(e);
			}
		});

		return await this.validatePromise;
	};

	public invalidate(): void {
		this.validatePromise = null;
		this.validateBearerTokenPromise = null;
	}

	private isValidRequestOrigin = (
		config: CSRFProtectionConfiguration
	): boolean => {
		const request = this.requestContext.request;
		const whitelist = ["GET", "HEAD", "OPTIONS", "TRACE"];
		if (whitelist.some((val) => val === request.method.toUpperCase())) {
			return true;
		}
		const requestOrigin = request.headers.get("Origin");
		if (!requestOrigin) {
			debug.request.fail("No request origin available");
			return false;
		}
		let host: string | null = null;
		if (config.host !== undefined) {
			host = config.host ?? null;
		} else if (request.url !== null && request.url !== undefined) {
			host = safeParseUrl(request.url)?.host ?? null;
		} else {
			host = request.headers.get(config.hostHeader ?? "Host");
		}
		debug.request.info("Host", host ?? "(Host unknown)");
		if (
			host !== null &&
			isAllowedOrigin(requestOrigin, host, config.allowedSubDomains ?? [])
		) {
			debug.request.info("Valid request origin", requestOrigin);
			return true;
		}
		debug.request.info("Invalid request origin", requestOrigin);
		return false;
	};
}

export const transformRequestContext = ({
	request,
	setCookie,
	sessionCookie
}: MiddlewareRequestContext): RequestContext => {
	return {
		request: {
			url: request.url,
			method: request.method,
			headers:
				"authorization" in request.headers
					? createHeadersFromObject(request.headers)
					: request.headers
		},
		setCookie,
		sessionCookie: sessionCookie ?? request.storedSessionCookie
	};
};
