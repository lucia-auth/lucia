import { Cookie } from "./cookie.js";
import type { Auth, Session, User } from "./index.js";

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
		} catch {
			this.storedSessionId = null;
		}
	}

	private validatePromise: Promise<Session | null> | null = null;
	private validateUserPromise: Promise<
		| { user: User; session: Session }
		| {
				user: null;
				session: null;
		  }
	> | null = null;
	public storedSessionId: string | null;

	public setSession = (session: Session | null) => {
		const sessionId = session?.sessionId ?? null;
		if (this.storedSessionId === sessionId) return;
		this.validateUserPromise = null;
		this.validatePromise = null;
		this.setSessionCookie(session);
	};

	private setSessionCookie = (session: Session | null) => {
		const sessionId = session?.sessionId ?? null;
		if (this.storedSessionId === sessionId) return;
		this.storedSessionId = sessionId;
		try {
			this.context.setCookie(this.auth.createSessionCookie(session));
		} catch {
			// response was already created, etc
		}
	};

	public validate = async (): Promise<Session | null> => {
		if (this.validatePromise) return this.validatePromise;

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

		return this.validatePromise;
	};

	public validateUser = async (): Promise<
		| { user: null; session: null }
		| {
				user: User;
				session: Session;
		  }
	> => {
		const resolveNullSession = (
			resolve: (result: { user: null; session: null }) => void
		) => {
			this.setSessionCookie(null);
			return resolve({
				user: null,
				session: null
			});
		};

		if (this.validateUserPromise) return this.validateUserPromise;

		this.validateUserPromise = new Promise(async (resolve) => {
			if (this.storedSessionId === null) return resolveNullSession(resolve);
			try {
				const { session, user } = await this.auth.validateSessionUser(
					this.storedSessionId
				);
				if (session.fresh) {
					this.setSessionCookie(session);
				}
				return resolve({ session, user });
			} catch {
				return resolveNullSession(resolve);
			}
		});

		return this.validateUserPromise;
	};
}
