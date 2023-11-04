import { AuthRequest } from "./request.js";
import { lucia as defaultMiddleware } from "../middleware/index.js";
import { debug } from "../utils/debug.js";
import { SessionController, SessionCookieController } from "oslo/session";
import { TimeSpan, isWithinExpirationDate } from "oslo";
import { generateRandomString, alphabet } from "oslo/random";
import { verifyRequestOrigin } from "oslo/request";

import type { SessionCookie } from "oslo/session";
import type { Adapter } from "./database.js";
import type {
	DatabaseSessionAttributes,
	DatabaseUserAttributes,
	RegisteredAuth
} from "../index.js";

export interface Session
	extends ReturnType<RegisteredAuth["getSessionAttributes"]> {
	sessionId: string;
	expiresAt: Date;
	fresh: boolean;
	userId: string;
}

export interface User extends ReturnType<RegisteredAuth["getUserAttributes"]> {
	userId: string;
}

export type Env = "DEV" | "PROD";

export const lucia = <_Configuration extends Configuration>(
	config: _Configuration
): Auth<_Configuration> => {
	return new Auth(config);
};

export class Auth<_Configuration extends Configuration = Configuration> {
	private adapter: Adapter;
	private sessionController: SessionController;
	private sessionCookieController: SessionCookieController;
	private csrfProtection: CSRFProtectionOptions | boolean;
	private env: Env;
	protected middleware: _Configuration["middleware"] extends Middleware
		? _Configuration["middleware"]
		: ReturnType<typeof defaultMiddleware> = defaultMiddleware();

	private experimental: {
		debugMode: boolean;
	};

	constructor(config: _Configuration) {
		this.adapter = config.adapter;
		this.env = config.env;

		this.getUserAttributes = (databaseUser) => {
			const defaultTransform = () => {
				return {} as any;
			};
			const transform = config.getUserAttributes ?? defaultTransform;
			return transform(databaseUser);
		};
		this.getSessionAttributes = (databaseSession) => {
			const defaultTransform = () => {
				return {} as any;
			};
			const transform = config.getSessionAttributes ?? defaultTransform;
			return transform(databaseSession);
		};
		this.sessionController = new SessionController(
			config.sessionExpiresIn ?? new TimeSpan(30, "d")
		);
		this.sessionCookieController = new SessionCookieController(
			config.sessionCookie?.name ?? "auth_session",
			this.sessionController.expiresIn,
			{
				...config.sessionCookie,
				secure: this.env === "PROD"
			}
		);
		this.csrfProtection = config.csrfProtection ?? true;
		if (config.middleware) {
			this.middleware = config.middleware;
		}
		this.experimental = {
			debugMode: config.experimental?.debugMode ?? false
		};

		debug.init(this.experimental.debugMode);
	}

	protected getUserAttributes: (
		databaseUser: DatabaseUserAttributes
	) => _Configuration extends Configuration<infer _UserAttributes>
		? _UserAttributes
		: never;

	protected getSessionAttributes: (
		databaseSession: DatabaseSessionAttributes
	) => _Configuration extends Configuration<any, infer _SessionAttributes>
		? _SessionAttributes
		: never;

	public async getUserSessions(userId: string): Promise<Session[]> {
		const databaseSessions = await this.adapter.getUserSessions(userId);
		const sessions: Session[] = [];
		for (const databaseSession of databaseSessions) {
			if (!isWithinExpirationDate(databaseSession.expiresAt)) {
				continue;
			}
			sessions.push({
				sessionId: databaseSession.sessionId,
				expiresAt: databaseSession.expiresAt,
				userId: databaseSession.userId,
				fresh: false,
				...this.getSessionAttributes(databaseSession)
			});
		}
		return sessions;
	}

	public async validateSession(
		sessionId: string
	): Promise<{ user: User; session: Session } | { user: null; session: null }> {
		const [databaseSession, databaseUser] =
			await this.adapter.getSessionAndUser(sessionId);
		if (!databaseSession) {
			debug.session.fail("Session not found", sessionId);
			return { session: null, user: null };
		}
		if (!databaseUser) {
			await this.adapter.deleteSession(databaseSession.sessionId);
			debug.session.fail("Session not found", sessionId);
			return { session: null, user: null };
		}
		const sessionState = this.sessionController.getSessionState(
			databaseSession.expiresAt
		);
		if (sessionState === "expired") {
			debug.session.fail("Session expired", sessionId);
			await this.adapter.deleteSession(databaseSession.sessionId);
			return { session: null, user: null };
		}
		let expiresAt = databaseSession.expiresAt;
		let fresh = false;
		if (sessionState === "idle") {
			expiresAt = this.sessionController.createExpirationDate();
			await this.adapter.updateSession(databaseSession.sessionId, {
				expiresAt
			});
			fresh = true;
		}
		const session: Session = {
			sessionId: databaseSession.sessionId,
			userId: databaseSession.userId,
			fresh,
			expiresAt,
			...this.getSessionAttributes(databaseSession.attributes)
		};
		const user: User = {
			...this.getUserAttributes(databaseUser),
			userId: databaseUser.userId
		};
		return { user, session };
	}

	public async createSession(
		userId: string,
		attributes: DatabaseSessionAttributes
	): Promise<Session> {
		const sessionId = generateRandomString(40, alphabet("0-9", "a-z"));
		const sessionExpiresAt = this.sessionController.createExpirationDate();
		await this.adapter.setSession({
			sessionId,
			userId,
			expiresAt: sessionExpiresAt,
			attributes
		});
		const session: Session = {
			sessionId,
			userId,
			fresh: true,
			expiresAt: sessionExpiresAt,
			...this.getSessionAttributes(attributes)
		};
		return session;
	}

	// public updateSessionAttributes = async (
	// 	sessionId: string,
	// 	attributes: Partial<DatabaseSessionAttributes>
	// ): Promise<Session> => {
	// 	this.validateSessionIdArgument(sessionId);
	// 	await this.adapter.updateSession(sessionId, attributes);
	// 	return this.getSession(sessionId);
	// };

	public async invalidateSession(sessionId: string): Promise<void> {
		await this.adapter.deleteSession(sessionId);
		debug.session.notice("Invalidated session", sessionId);
	}

	public async invalidateUserSessions(userId: string): Promise<void> {
		await this.adapter.deleteUserSessions(userId);
	}

	public readSessionCookie(
		cookieHeader: string | null | undefined
	): string | null {
		const sessionId = this.sessionCookieController.parseCookies(cookieHeader);
		if (sessionId) {
			debug.request.info("Found session cookie", sessionId);
		} else {
			debug.request.info("No session cookie found");
		}
		return sessionId;
	}

	public readBearerToken(
		authorizationHeader: string | null | undefined
	): string | null {
		if (!authorizationHeader) {
			debug.request.info("No token found in authorization header");
			return null;
		}
		const [authScheme, token] = authorizationHeader.split(" ") as [
			string,
			string | undefined
		];
		if (authScheme !== "Bearer") {
			debug.request.fail(
				"Invalid authorization header auth scheme",
				authScheme
			);
			return null;
		}
		return token ?? null;
	}

	public handleRequest(
		// cant reference middleware type with Lucia.Auth
		...args: Auth<_Configuration>["middleware"] extends Middleware<infer Args>
			? Args
			: never
	): AuthRequest<typeof this> {
		const middleware = this.middleware as Middleware;
		const requestContext = middleware({
			args,
			env: this.env,
			sessionCookieName: this.sessionCookieController.cookieName
		});
		debug.request.init(
			requestContext.request.method,
			requestContext.request.url ?? "(url unknown)"
		);
		const authorizationHeader =
			requestContext.request.headers.get("Authorization");
		let bearerToken = authorizationHeader;
		if (authorizationHeader) {
			const parts = authorizationHeader.split(" ");
			if (parts.length === 2 && parts[0] === "Bearer") {
				bearerToken = parts[1];
			}
		}
		if (this.csrfProtection !== false) {
			const options = this.csrfProtection === true ? {} : this.csrfProtection;
			const validRequestOrigin = this.verifyRequestOrigin(
				requestContext,
				options
			);
			if (!validRequestOrigin) {
				return new AuthRequest(
					this,
					null,
					bearerToken,
					requestContext.setCookie
				);
			}
		}
		const sessionCookie =
			requestContext.sessionCookie ??
			this.sessionCookieController.parseCookies(
				requestContext.request.headers.get("Cookie")
			);

		return new AuthRequest(
			this,
			sessionCookie,
			bearerToken,
			requestContext.setCookie
		);
	}

	private verifyRequestOrigin(
		requestContext: RequestContext,
		options: CSRFProtectionOptions
	): boolean {
		const whitelist = ["GET", "HEAD", "OPTIONS", "TRACE"];
		const allowedMethod = whitelist.some(
			(val) => val === requestContext.request.method.toUpperCase()
		);
		if (allowedMethod) {
			return true;
		}
		const requestOrigin = requestContext.request.headers.get("Origin");
		if (!requestOrigin) {
			debug.request.fail("No request origin available");
		}
		let host: string | null = null;
		if (options.host !== undefined) {
			host = options.host;
		} else if (options.hostHeader !== undefined) {
			host = requestContext.request.headers.get(options.hostHeader);
		} else if (requestContext.request.url !== undefined) {
			host = requestContext.request.url;
		} else {
			host = requestContext.request.headers.get("Host");
		}
		debug.request.info("Host", host ?? "(Host unknown)");
		debug.request.info("Origin", requestOrigin ?? "(Origin unknown)");
		const validOrigin = verifyRequestOrigin(requestOrigin, host, {
			allowedSubdomains: options.allowedSubDomains
		});
		if (validOrigin) {
			debug.request.info("Valid request origin");
			return true;
		}
		debug.request.info("Invalid request origin");
		return false;
	}

	public createSessionCookie(sessionId: string): SessionCookie {
		return this.sessionCookieController.createSessionCookie(sessionId);
	}

	public createBlankSessionCookie(): SessionCookie {
		return this.sessionCookieController.createBlankSessionCookie();
	}
}

export interface Configuration<
	_UserAttributes extends Record<string, any> = {},
	_SessionAttributes extends Record<string, any> = {}
> {
	adapter: Adapter;
	env: Env;
	middleware?: Middleware;
	csrfProtection?:
		| boolean
		| {
				host?: string;
				hostHeader?: string;
				allowedSubDomains?: string[] | "*";
		  };
	sessionExpiresIn?: TimeSpan;
	sessionCookie?: {
		name?: string;
		expires?: boolean;
		sameSite?: "lax" | "strict";
		domain?: string;
		path?: string;
	};
	getSessionAttributes?: (
		databaseSessionAttributes: DatabaseSessionAttributes
	) => _SessionAttributes;
	getUserAttributes?: (
		databaseUserAttributes: DatabaseUserAttributes
	) => _UserAttributes;
	experimental?: {
		debugMode?: boolean;
	};
}

interface CSRFProtectionOptions {
	host?: string;
	hostHeader?: string;
	allowedSubDomains?: string[] | "*";
}

export interface LuciaRequest {
	method: string;
	url?: string;
	headers: Pick<Headers, "get">;
}
export interface RequestContext {
	sessionCookie?: string | null;
	request: LuciaRequest;
	setCookie: (cookie: SessionCookie) => void;
}

export type Middleware<Args extends any[] = any> = (context: {
	args: Args;
	env: Env;
	sessionCookieName: string;
}) => RequestContext;
