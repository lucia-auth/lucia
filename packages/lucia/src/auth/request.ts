import { debug } from "../utils/debug.js";
import { LuciaError } from "./error.js";

import type { SessionCookie } from "oslo/session";
import type { Auth, Session, User } from "./index.js";

export class AuthRequest<_Auth extends Auth = any> {
	private auth: _Auth;
	private sessionCookie: string | null;
	private bearerToken: string | null;
	private setCookie: (cookie: SessionCookie) => void;

	constructor(
		auth: _Auth,
		sessionCookie: string | null,
		bearerToken: string | null,
		setCookie: (cookie: SessionCookie) => void
	) {
		this.auth = auth;
		this.sessionCookie = sessionCookie;
		this.bearerToken = bearerToken;
		this.setCookie = setCookie;
	}

	private validatePromise: Promise<
		[session: Session, user: User] | [session: null, user: null]
	> | null = null;
	private validateBearerTokenPromise: Promise<
		[session: Session, user: User] | [session: null, user: null]
	> | null = null;

	public setSessionCookie(sessionId: string) {
		if (this.sessionCookie !== sessionId) {
			this.validatePromise = null;
		}
		try {
			this.setCookie(this.auth.createSessionCookie(sessionId));
			debug.request.notice("Session cookie set", sessionId);
		} catch {
			// ignore middleware errors
		}
	}

	public deleteSessionCookie() {
		if (this.sessionCookie === null) return;
		this.sessionCookie = null;
		this.validatePromise = null;
		try {
			this.setCookie(this.auth.createBlankSessionCookie());
			debug.request.notice("Session cookie deleted");
		} catch {
			// ignore middleware errors
		}
	}

	public async validate(): Promise<
		[session: Session, user: User] | [session: null, user: null]
	> {
		if (this.validatePromise) {
			debug.request.info("Using cached result for session validation");
			return this.validatePromise;
		}
		this.validatePromise = new Promise(async (resolve, reject) => {
			if (!this.sessionCookie) return resolve([null, null]);
			try {
				const [session, user] = await this.auth.validateSession(
					this.sessionCookie
				);
				if (session.fresh) {
					this.setSessionCookie(session.sessionId);
				}
				return resolve([session, user]);
			} catch (e) {
				if (e instanceof LuciaError) {
					this.deleteSessionCookie();
					return resolve([null, null]);
				}
				return reject(e);
			}
		});

		return await this.validatePromise;
	}

	public async validateBearerToken(): Promise<
		[session: Session, user: User] | [session: null, user: null]
	> {
		if (this.validateBearerTokenPromise) {
			debug.request.info("Using cached result for bearer token validation");
			return this.validateBearerTokenPromise;
		}
		this.validateBearerTokenPromise = new Promise(async (resolve, reject) => {
			if (!this.bearerToken) return resolve([null, null]);
			try {
				const [session, user] = await this.auth.validateSession(
					this.bearerToken
				);
				return resolve([session, user]);
			} catch (e) {
				if (e instanceof LuciaError) {
					return resolve([null, null]);
				}
				return reject(e);
			}
		});

		return await this.validateBearerTokenPromise;
	}

	public invalidate(): void {
		this.validatePromise = null;
		this.validateBearerTokenPromise = null;
	}
}
