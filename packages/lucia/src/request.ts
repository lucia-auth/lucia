import type { SessionCookie } from "oslo/session";
import type { Lucia, Session, User } from "./core.js";

export class AuthRequest<_Lucia extends Lucia = Lucia> {
	private auth: _Lucia;
	private sessionCookie: string | null;
	private bearerToken: string | null;
	private setCookie: (cookie: SessionCookie) => void;

	constructor(
		auth: _Lucia,
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
		{ user: User; session: Session } | { user: null; session: null }
	> | null = null;

	private validateBearerTokenPromise: Promise<
		{ user: User; session: Session } | { user: null; session: null }
	> | null = null;

	public setSessionCookie(sessionId: string): void {
		if (this.sessionCookie !== sessionId) {
			this.validatePromise = null;
		}
		this.setCookie(this.auth.createSessionCookie(sessionId));
	}

	public deleteSessionCookie(): void {
		if (this.sessionCookie === null) return;
		this.sessionCookie = null;
		this.validatePromise = null;
		this.setCookie(this.auth.createBlankSessionCookie());
	}

	public async validate(): Promise<
		{ user: User; session: Session } | { user: null; session: null }
	> {
		if (!this.validatePromise) {
			this.validatePromise = new Promise(async (resolve) => {
				if (!this.sessionCookie) {
					return resolve({ session: null, user: null });
				}
				const result = await this.auth.validateSession(this.sessionCookie);
				if (result.session && result.session.fresh) {
					const sessionCookie = this.auth.createSessionCookie(result.session.id);
					this.setCookie(sessionCookie);
				}
				return resolve(result);
			});
		}
		return await this.validatePromise;
	}

	public async validateBearerToken(): Promise<
		{ user: User; session: Session } | { user: null; session: null }
	> {
		if (!this.validateBearerTokenPromise) {
			this.validateBearerTokenPromise = new Promise(async (resolve, reject) => {
				if (!this.bearerToken) {
					return resolve({ session: null, user: null });
				}
				const result = await this.auth.validateSession(this.bearerToken);
				return resolve(result);
			});
		}
		return await this.validateBearerTokenPromise;
	}

	public invalidate(): void {
		this.validatePromise = null;
		this.validateBearerTokenPromise = null;
	}
}
