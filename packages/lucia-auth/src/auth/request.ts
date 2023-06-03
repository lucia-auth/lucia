import { Cookie } from "./cookie.js";
import type { Auth, Session, User } from "./index.js";
import { debug } from "../utils/debug.js";

export type LuciaRequest = {
	method: string;
	url: string;
	headers: {
		origin: string | null;
		cookie: string | null;
	};
};
export type RequestContext = {
	request: LuciaRequest;
	setCookie: (cookie: Cookie) => void;
};

export type Middleware<Args extends any[] = any> = (
	...args: [...Args, "DEV" | "PROD"]
) => RequestContext;

export class AuthRequest<A extends Auth = any> {
	private auth: A;
	private context: RequestContext;
	constructor(auth: A, context: RequestContext) {
		this.auth = auth;
		this.context = context;
		try {
			this.storedSessionId = auth.parseRequestHeaders(context.request);
		} catch (e) {
			this.storedSessionId = null;
		}
	}

	private validatePromise: Promise<Session | null> | null = null;
	public storedSessionId: string | null;

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
			if (!this.storedSessionId) {
				return resolve(null);
			}
			try {
				const session = await this.auth.validateSession(this.storedSessionId);
				if (session.fresh) {
					this.setSessionCookie(session);
				}
				return resolve(session);
			} catch (e) {
				this.setSessionCookie(null);
				return resolve(null);
			}
		});

		return await this.validatePromise;
	};
}
