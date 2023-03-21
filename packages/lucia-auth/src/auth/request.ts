import type { Auth, Session, User } from "./index.js";

export type LuciaRequest = {
	method: string | null;
	url: string | null;
	headers: {
		origin: string | null;
		cookie: string | null;
	};
};

export type Middleware<RequestInstance = any> = {
	transformRequest: (request: RequestInstance) => LuciaRequest;
};

export class AuthRequest<A extends Auth, M extends Middleware> {
	private auth: A;
	private request: LuciaRequest;
	constructor(
		auth: A,
		middleware: M,
		request: M extends Middleware<infer RequestInstance>
			? RequestInstance
			: never
	) {
		this.auth = auth;
		this.request = middleware.transformRequest(request);
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
		this.currentSession = session;
		this.validatePromise = null;
		this.validateUserPromise = null;
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
				const sessionId = this.auth.parseRequestHeaders(this.request);
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
				const sessionId = this.auth.parseRequestHeaders(this.request);
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
