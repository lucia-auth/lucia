import type { Auth, Session, User } from "./index.js";

export type LuciaRequest = {
	method: string;
	url: string;
	headers: {
		origin: string | null;
		cookie: string | null;
	};
};

export type Middleware<RequestInstance = any, ResponseInstance = any> = {
	transformRequest: (request: RequestInstance) => LuciaRequest;
	appendResponseHeader: (
		response: ResponseInstance,
		name: string,
		value: string
	) => void;
};

export class AuthRequest<A extends Auth, M extends Middleware<any, any>> {
	private auth: A;
	private middleware: M;
	private request: LuciaRequest;
	constructor(
		auth: A,
		middleware: M,
		request: M extends Middleware<infer RequestInstance, any>
			? RequestInstance
			: never
	) {
		this.auth = auth;
		this.middleware = middleware;
		this.request = middleware.transformRequest(request);
	}

	private validateSessionPromise: Promise<Session | null> | null = null;
	private validateSessionUserPromise: Promise<
		| { user: User; session: Session }
		| {
				user: null;
				session: null;
		  }
	> | null = null;
	private currentSession: undefined | null | Session;

	public setSession = (session: Session | null) => {
		this.currentSession = session;
		this.validateSessionPromise = null;
		this.validateSessionUserPromise = null;
	};

	public validateSession = async (): Promise<Session | null> => {
		if (this.currentSession !== undefined) return this.currentSession;
		if (this.validateSessionPromise) return this.validateSessionPromise;
		if (this.validateSessionUserPromise) {
			const { session } = await this.validateSessionUserPromise;
			return session;
		}

		this.validateSessionPromise = new Promise(async (resolve) => {
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
		return this.validateSessionPromise;
	};
	public validateSessionUser = async (): Promise<
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
			this.validateSessionUserPromise = new Promise(async (resolve) => {
				try {
					const user = await this.auth.getUser(currentSession.userId);
					return resolve({ user, session: currentSession });
				} catch {
					return resolveNullSession(resolve);
				}
			});
			return this.validateSessionUserPromise;
		}

		if (this.validateSessionUserPromise) return this.validateSessionUserPromise;

		if (this.validateSessionPromise) {
			this.validateSessionUserPromise = new Promise(async (resolve) => {
				const session = await this.validateSessionPromise;
				if (!session) return resolveNullSession(resolve);
				try {
					const user = await this.auth.getUser(session.userId);
					return resolve({ user, session });
				} catch {
					return resolveNullSession(resolve);
				}
			});
			return this.validateSessionUserPromise;
		}

		this.validateSessionUserPromise = new Promise(async (resolve) => {
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
		return this.validateSessionUserPromise;
	};

	public commit = (
		responseInstance: M extends Middleware<any, infer ResponseInstance>
			? ResponseInstance
			: never
	) => {
		const currentSession = this.currentSession;
		if (currentSession === undefined) return null;
		this.middleware.appendResponseHeader(
			responseInstance,
			"set-cookie",
			this.auth.createSessionCookie(currentSession).serialize()
		);
	};
}
