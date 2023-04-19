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

export class AuthRequest<
	A extends Auth = any,
	Context extends RequestContext = any
> {
	private auth: A;
	private context: Context;
	constructor(auth: A, context: Context) {
		this.auth = auth;
		this.context = context;
	}

	private validatePromise: Promise<Session | null> | null = null;
	private validateUserPromise: Promise<
		| { user: User; session: Session }
		| {
				user: null;
				session: null;
		  }
	> | null = null;
	private currentSession: undefined | null | Session;

	public setSession = (session: Session | null) => {
		const storedSession = this.currentSession;
		const storedSessionId = storedSession?.sessionId ?? null;
		const newSessionId = session?.sessionId ?? null;
		if (storedSession !== undefined && storedSessionId === newSessionId) return;
		this.currentSession = session;
		this.validateUserPromise = null;
		try {
			this.context.setCookie(this.auth.createSessionCookie(session));
		} catch {
			// response was already created
		}
	};

	public validate = async (): Promise<Session | null> => {
		if (this.currentSession !== undefined) return this.currentSession;
		if (this.validatePromise) return this.validatePromise;
		if (this.validateUserPromise) {
			const { session } = await this.validateUserPromise;
			return session;
		}

		this.validatePromise = new Promise(async (resolve) => {
			try {
				const sessionId = this.auth.parseRequestHeaders(this.context.request);
				if (!sessionId) {
					this.setSession(null);
					return resolve(null);
				}
				const session = await this.auth.validateSession(sessionId);
				this.setSession(session);
				return resolve(session);
			} catch {
				this.setSession(null);
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
		const currentSession = this.currentSession;
		if (currentSession === null) {
			return {
				session: null,
				user: null
			};
		}

		const resolveNullSession = (
			resolve: (result: { user: null; session: null }) => void
		) => {
			this.setSession(null);
			return resolve({
				user: null,
				session: null
			});
		};

		if (currentSession !== undefined) {
			this.validateUserPromise = new Promise(async (resolve) => {
				try {
					const user = await this.auth.getUser(currentSession.userId);
					return resolve({ user, session: currentSession });
				} catch {
					return resolveNullSession(resolve);
				}
			});
			return this.validateUserPromise;
		}

		if (this.validateUserPromise) return this.validateUserPromise;

		if (this.validatePromise) {
			this.validateUserPromise = new Promise(async (resolve) => {
				const session = await this.validatePromise;
				if (!session) return resolveNullSession(resolve);
				try {
					const user = await this.auth.getUser(session.userId);
					return resolve({ user, session });
				} catch {
					return resolveNullSession(resolve);
				}
			});
			return this.validateUserPromise;
		}

		this.validateUserPromise = new Promise(async (resolve) => {
			try {
				const sessionId = this.auth.parseRequestHeaders(this.context.request);
				if (!sessionId) return resolveNullSession(resolve);
				const { session, user } = await this.auth.validateSessionUser(
					sessionId
				);
				this.setSession(session);
				return resolve({ session, user });
			} catch {
				return resolveNullSession(resolve);
			}
		});
		return this.validateUserPromise;
	};

	public getCookie = () => {
		const currentSession = this.currentSession;
		if (currentSession === undefined) return null;
		return this.auth.createSessionCookie(currentSession);
	};
}
