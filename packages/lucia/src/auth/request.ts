import { debug } from "../utils/debug.js";

import type { Auth, Env, Session } from "./index.js";
import type { Cookie } from "./cookie.js";

export type LuciaRequest = {
	method: string;
	url: string;
	headers: {
		origin: string | null;
		cookie: string | null;
		authorization: string | null;
	};
	storedSessionCookie?: string | null;
};
export type RequestContext = {
	request: LuciaRequest;
	setCookie: (cookie: Cookie) => void;
};

export type Middleware<Args extends any[] = any> = (context: {
	args: Args;
	env: Env;
	cookieName: string;
}) => RequestContext;

export class AuthRequest<A extends Auth = any> {
	private auth: A;
	private context: RequestContext;
	constructor(auth: A, context: RequestContext) {
		debug.request.init(context.request.method, context.request.url);
		this.auth = auth;
		this.context = context;
		try {
			auth.validateRequestOrigin(context.request);
			this.storedSessionId = auth.readSessionCookie(context.request);
		} catch (e) {
			this.storedSessionId = null;
		}
		this.bearerToken = auth.readBearerToken(context.request);
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

	private setSessionCookie = (session: Session | null) => {
		const sessionId = session?.sessionId ?? null;
		if (this.storedSessionId === sessionId) return;
		this.storedSessionId = sessionId;
		try {
			this.context.setCookie(this.auth.createSessionCookie(session));
			if (session) {
				debug.request.notice("Session cookie stored", session.sessionId);
			} else {
				debug.request.notice("Session cookie deleted");
			}
		} catch (e) {
			// ignore
		}
	};

	public validate = async (): Promise<Session | null> => {
		if (this.validatePromise) {
			debug.request.info("Using cached result for session validation");
			return this.validatePromise;
		}
		this.validatePromise = new Promise(async (resolve) => {
			if (!this.storedSessionId) return resolve(null);
			try {
				const session = await this.auth.validateSession(this.storedSessionId);
				if (session.fresh) {
					this.setSessionCookie(session);
				}
				return resolve(session);
			} catch {
				this.setSessionCookie(null);
				return resolve(null);
			}
		});

		return await this.validatePromise;
	};

	public validateBearerToken = async (): Promise<Session | null> => {
		if (this.validateBearerTokenPromise) {
			debug.request.info("Using cached result for bearer token validation");
			return this.validatePromise;
		}
		this.validatePromise = new Promise(async (resolve) => {
			if (!this.bearerToken) return resolve(null);
			try {
				const session = await this.auth.getSession(this.bearerToken);
				if (session.state === "idle") return resolve(null);
				return resolve(session);
			} catch {
				return resolve(null);
			}
		});

		return await this.validatePromise;
	};
}
