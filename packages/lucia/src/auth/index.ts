import { DEFAULT_SESSION_COOKIE_NAME, createSessionCookie } from "./cookie.js";
import { logError } from "../utils/log.js";
import { generateScryptHash, validateScryptHash } from "../utils/crypto.js";
import { generateRandomString } from "../utils/nanoid.js";
import { LuciaError } from "./error.js";
import { parseCookie } from "../utils/cookie.js";
import { isValidDatabaseSession } from "./session.js";
import { transformDatabaseKey } from "./key.js";
import { AuthRequest } from "./request.js";
import { lucia as defaultMiddleware } from "../middleware/index.js";
import { debug } from "../utils/debug.js";
import { isWithinExpiration } from "../utils/date.js";
import { isAllowedUrl } from "../utils/url.js";

import type { Cookie, SessionCookieAttributes } from "./cookie.js";
import type { UserSchema, SessionSchema } from "./schema.js";
import type { Adapter, SessionAdapter, InitializeAdapter } from "./adapter.js";
import type { Middleware, LuciaRequest } from "./request.js";

export type Session = Readonly<{
	user: User;
	sessionId: string;
	activePeriodExpiresAt: Date;
	idlePeriodExpiresAt: Date;
	state: "idle" | "active";
	fresh: boolean;
}> &
	ReturnType<Lucia.Auth["getSessionAttributes"]>;

export type Key = Readonly<{
	userId: string;
	providerId: string;
	providerUserId: string;
	passwordDefined: boolean;
}>;

export type Env = "DEV" | "PROD";

export type User = {
	userId: string;
} & ReturnType<Lucia.Auth["getUserAttributes"]>;

export const lucia = <_Configuration extends Configuration>(
	config: _Configuration
) => {
	return new Auth(config);
};

const validateConfiguration = (config: Configuration) => {
	const adapterProvided = config.adapter;
	if (!adapterProvided) {
		logError('Adapter is not defined in configuration ("config.adapter")');
		process.exit(1);
	}
};

const defaultSessionCookieAttributes: SessionCookieAttributes = {
	sameSite: "lax",
	path: "/"
};

export class Auth<_Configuration extends Configuration = any> {
	private adapter: Adapter;
	private sessionCookie: {
		name: string;
		attributes: SessionCookieAttributes;
		expires: boolean;
	};
	private sessionExpiresIn: {
		activePeriod: number;
		idlePeriod: number;
	};
	private env: Env;
	private passwordHash: {
		generate: (s: string) => MaybePromise<string>;
		validate: (s: string, hash: string) => MaybePromise<boolean>;
	};
	protected middleware: _Configuration["middleware"] extends Middleware
		? _Configuration["middleware"]
		: ReturnType<typeof defaultMiddleware>;
	public csrfProtectionEnabled: boolean;
	private allowedSubdomains: string[] | "*";
	private experimental: {
		debugMode: boolean;
	};

	constructor(config: _Configuration) {
		validateConfiguration(config);

		if ("user" in config.adapter) {
			let userAdapter = config.adapter.user(LuciaError);
			let sessionAdapter = config.adapter.session(LuciaError);

			if ("getSessionAndUserBySessionId" in userAdapter) {
				const { getSessionAndUserBySessionId: _, ...extractedUserAdapter } =
					userAdapter;
				userAdapter = extractedUserAdapter;
			}

			if ("getSessionAndUserBySessionId" in sessionAdapter) {
				const { getSessionAndUserBySessionId: _, ...extractedSessionAdapter } =
					sessionAdapter;
				sessionAdapter = extractedSessionAdapter;
			}

			this.adapter = {
				...userAdapter,
				...sessionAdapter
			};
		} else {
			this.adapter = config.adapter(LuciaError);
		}
		this.env = config.env;
		this.csrfProtectionEnabled =
			typeof config.csrfProtection === "boolean" ? config.csrfProtection : true;
		this.sessionExpiresIn = {
			activePeriod:
				config.sessionExpiresIn?.activePeriod ?? 1000 * 60 * 60 * 24,
			idlePeriod:
				config.sessionExpiresIn?.idlePeriod ?? 1000 * 60 * 60 * 24 * 14
		};
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
		this.sessionCookie = {
			name: config.sessionCookie?.name ?? DEFAULT_SESSION_COOKIE_NAME,
			attributes:
				config.sessionCookie?.attributes ?? defaultSessionCookieAttributes,
			expires: config.sessionCookie?.expires ?? true
		};
		this.passwordHash = {
			generate: config.passwordHash?.generate ?? generateScryptHash,
			validate: config.passwordHash?.validate ?? validateScryptHash
		};
		this.middleware = config.middleware ?? defaultMiddleware();
		this.allowedSubdomains =
			!config.csrfProtection || typeof config.csrfProtection === "boolean"
				? []
				: config.csrfProtection.allowedSubDomains;
		this.experimental = {
			debugMode: config.experimental?.debugMode ?? false
		};

		debug.init(this.experimental.debugMode);
	}

	protected getUserAttributes: (
		databaseUser: UserSchema
	) => _Configuration extends Configuration<infer _UserAttributes>
		? _UserAttributes
		: never;

	protected getSessionAttributes: (
		databaseSession: SessionSchema
	) => _Configuration extends Configuration<any, infer _SessionAttributes>
		? _SessionAttributes
		: never;

	public transformDatabaseUser = (databaseUser: UserSchema): User => {
		const attributes = this.getUserAttributes(databaseUser);
		return {
			...attributes,
			userId: databaseUser.id
		};
	};

	public transformDatabaseSession = (
		databaseSession: SessionSchema,
		context: {
			user: User;
			fresh: boolean;
		}
	): Session => {
		const attributes = this.getSessionAttributes(databaseSession);
		const active = isWithinExpiration(databaseSession.active_expires);
		return {
			...attributes,
			user: context.user,
			sessionId: databaseSession.id,
			activePeriodExpiresAt: new Date(Number(databaseSession.active_expires)),
			idlePeriodExpiresAt: new Date(Number(databaseSession.idle_expires)),
			state: active ? "active" : "idle",
			fresh: context.fresh
		};
	};

	private getDatabaseUser = async (userId: string): Promise<UserSchema> => {
		const databaseUser = await this.adapter.getUser(userId);
		if (!databaseUser) {
			throw new LuciaError("AUTH_INVALID_USER_ID");
		}
		return databaseUser;
	};

	private getDatabaseSession = async (
		sessionId: string
	): Promise<SessionSchema> => {
		const databaseSession = await this.adapter.getSession(sessionId);
		if (!databaseSession) {
			debug.session.fail("Session not found", sessionId);
			throw new LuciaError("AUTH_INVALID_SESSION_ID");
		}
		if (!isValidDatabaseSession(databaseSession)) {
			debug.session.fail(
				`Session expired at ${new Date(Number(databaseSession.idle_expires))}`,
				sessionId
			);
			throw new LuciaError("AUTH_INVALID_SESSION_ID");
		}
		return databaseSession;
	};

	private getDatabaseSessionAndUser = async (
		sessionId: string
	): Promise<[SessionSchema, UserSchema]> => {
		if (this.adapter.getSessionAndUser) {
			const [databaseSession, databaseUser] =
				await this.adapter.getSessionAndUser(sessionId);

			if (!databaseSession) {
				debug.session.fail("Session not found", sessionId);
				throw new LuciaError("AUTH_INVALID_SESSION_ID");
			}

			if (!isValidDatabaseSession(databaseSession)) {
				debug.session.fail(
					`Session expired at ${new Date(
						Number(databaseSession.idle_expires)
					)}`,
					sessionId
				);
				throw new LuciaError("AUTH_INVALID_SESSION_ID");
			}

			return [databaseSession, databaseUser];
		}
		const databaseSession = await this.getDatabaseSession(sessionId);
		const databaseUser = await this.getDatabaseUser(databaseSession.user_id);
		return [databaseSession, databaseUser];
	};

	private validateSessionIdArgument = (sessionId: string) => {
		if (!sessionId) {
			debug.session.fail("Empty session id");
			throw new LuciaError("AUTH_INVALID_SESSION_ID");
		}
	};

	private getNewSessionExpiration = (sessionExpiresIn?: {
		activePeriod: number;
		idlePeriod: number;
	}): {
		activePeriodExpiresAt: Date;
		idlePeriodExpiresAt: Date;
	} => {
		const activePeriodExpiresAt = new Date(
			new Date().getTime() +
				(sessionExpiresIn?.activePeriod ?? this.sessionExpiresIn.activePeriod)
		);
		const idlePeriodExpiresAt = new Date(
			activePeriodExpiresAt.getTime() +
				(sessionExpiresIn?.idlePeriod ?? this.sessionExpiresIn.idlePeriod)
		);
		return { activePeriodExpiresAt, idlePeriodExpiresAt };
	};

	public getUser = async (userId: string): Promise<User> => {
		const databaseUser = await this.getDatabaseUser(userId);
		const user = this.transformDatabaseUser(databaseUser);
		return user;
	};

	public createUser = async (options: {
		userId?: string;
		key: {
			providerId: string;
			providerUserId: string;
			password: string | null;
		} | null;
		attributes: Lucia.DatabaseUserAttributes;
	}): Promise<User> => {
		const userId = options.userId ?? generateRandomString(15);
		const userAttributes = options.attributes ?? {};
		const databaseUser = {
			...userAttributes,
			id: userId
		} satisfies UserSchema;
		if (options.key === null) {
			await this.adapter.setUser(databaseUser, null);
			return this.transformDatabaseUser(databaseUser);
		}
		const keyId = `${options.key.providerId}:${options.key.providerUserId}`;
		const password = options.key.password;
		const hashedPassword = password
			? await this.passwordHash.generate(password)
			: null;
		await this.adapter.setUser(databaseUser, {
			id: keyId,
			user_id: userId,
			hashed_password: hashedPassword
		});
		return this.transformDatabaseUser(databaseUser);
	};

	public updateUserAttributes = async (
		userId: string,
		attributes: Partial<Lucia.DatabaseUserAttributes>
	): Promise<User> => {
		await this.adapter.updateUser(userId, attributes);
		return await this.getUser(userId);
	};

	public deleteUser = async (userId: string): Promise<void> => {
		await this.adapter.deleteSessionsByUserId(userId);
		await this.adapter.deleteKeysByUserId(userId);
		await this.adapter.deleteUser(userId);
	};

	public useKey = async (
		providerId: string,
		providerUserId: string,
		password: string | null
	): Promise<Key> => {
		const keyId = `${providerId}:${providerUserId}`;
		const databaseKey = await this.adapter.getKey(keyId);
		if (!databaseKey) {
			debug.key.fail("Key not found", keyId);
			throw new LuciaError("AUTH_INVALID_KEY_ID");
		}
		const hashedPassword = databaseKey.hashed_password;
		if (hashedPassword) {
			debug.key.info("Key includes password");
			if (!password) {
				debug.key.fail("Key password not provided", keyId);
				throw new LuciaError("AUTH_INVALID_PASSWORD");
			}
			if (hashedPassword.startsWith("$2a")) {
				throw new LuciaError("AUTH_OUTDATED_PASSWORD");
			}
			const validPassword = await this.passwordHash.validate(
				password,
				hashedPassword
			);
			if (!validPassword) {
				debug.key.fail("Incorrect key password", password);
				throw new LuciaError("AUTH_INVALID_PASSWORD");
			}
			debug.key.notice("Validated key password");
		} else {
			debug.key.info("No password included in key");
		}
		debug.key.success("Validated key", keyId);
		return transformDatabaseKey(databaseKey);
	};

	public getSession = async (sessionId: string): Promise<Session> => {
		this.validateSessionIdArgument(sessionId);
		const [databaseSession, databaseUser] =
			await this.getDatabaseSessionAndUser(sessionId);
		const user = this.transformDatabaseUser(databaseUser);
		return this.transformDatabaseSession(databaseSession, {
			user,
			fresh: false
		});
	};

	public getAllUserSessions = async (userId: string): Promise<Session[]> => {
		const [user, databaseSessions] = await Promise.all([
			this.getUser(userId),
			await this.adapter.getSessionsByUserId(userId)
		]);
		const validStoredUserSessions = databaseSessions
			.filter((databaseSession) => {
				return isValidDatabaseSession(databaseSession);
			})
			.map((databaseSession) => {
				return this.transformDatabaseSession(databaseSession, {
					user,
					fresh: false
				});
			});
		return validStoredUserSessions;
	};

	public validateSession = async (sessionId: string): Promise<Session> => {
		this.validateSessionIdArgument(sessionId);
		const [databaseSession, databaseUser] =
			await this.getDatabaseSessionAndUser(sessionId);
		const user = this.transformDatabaseUser(databaseUser);
		const session = this.transformDatabaseSession(databaseSession, {
			user,
			fresh: false
		});
		if (session.state === "active") {
			debug.session.success("Validated session", session.sessionId);
			return session;
		}
		const { activePeriodExpiresAt, idlePeriodExpiresAt } =
			this.getNewSessionExpiration();
		await this.adapter.updateSession(session.sessionId, {
			active_expires: activePeriodExpiresAt.getTime(),
			idle_expires: idlePeriodExpiresAt.getTime()
		});
		const renewedDatabaseSession: Session = {
			...session,
			idlePeriodExpiresAt,
			activePeriodExpiresAt,
			fresh: true
		};
		return renewedDatabaseSession;
	};

	public createSession = async (options: {
		sessionId?: string;
		userId: string;
		attributes: Lucia.DatabaseSessionAttributes;
	}): Promise<Session> => {
		const { activePeriodExpiresAt, idlePeriodExpiresAt } =
			this.getNewSessionExpiration();
		const userId = options.userId;
		const sessionId = options?.sessionId ?? generateRandomString(40);
		const attributes = options.attributes;
		const databaseSession = {
			...attributes,
			id: sessionId,
			user_id: userId,
			active_expires: activePeriodExpiresAt.getTime(),
			idle_expires: idlePeriodExpiresAt.getTime()
		} satisfies SessionSchema;
		const [user] = await Promise.all([
			this.getUser(userId),
			this.adapter.setSession(databaseSession)
		]);
		return this.transformDatabaseSession(databaseSession, {
			user,
			fresh: false
		});
	};

	public updateSessionAttributes = async (
		sessionId: string,
		attributes: Partial<Lucia.DatabaseSessionAttributes>
	): Promise<Session> => {
		this.validateSessionIdArgument(sessionId);
		await this.adapter.updateSession(sessionId, attributes);
		return this.getSession(sessionId);
	};

	public invalidateSession = async (sessionId: string): Promise<void> => {
		this.validateSessionIdArgument(sessionId);
		await this.adapter.deleteSession(sessionId);
		debug.session.notice("Invalidated session", sessionId);
	};

	public invalidateAllUserSessions = async (userId: string): Promise<void> => {
		await this.adapter.deleteSessionsByUserId(userId);
	};

	public deleteDeadUserSessions = async (userId: string): Promise<void> => {
		const databaseSessions = await this.adapter.getSessionsByUserId(userId);
		const deadSessionIds = databaseSessions
			.filter((databaseSession) => {
				return !isValidDatabaseSession(databaseSession);
			})
			.map((databaseSession) => databaseSession.id);
		await Promise.all(
			deadSessionIds.map((deadSessionId) => {
				this.adapter.deleteSession(deadSessionId);
			})
		);
	};

	public validateRequestOrigin = (
		request: Omit<LuciaRequest, "headers"> & {
			headers: Pick<LuciaRequest["headers"], "origin">;
		}
	): void => {
		if (request.method === null) {
			debug.request.fail("Request method unavailable");
			throw new LuciaError("AUTH_INVALID_REQUEST");
		}
		if (request.url === null) {
			debug.request.fail("Request url unavailable");
			throw new LuciaError("AUTH_INVALID_REQUEST");
		}
		if (
			request.method.toUpperCase() !== "GET" &&
			request.method.toUpperCase() !== "HEAD"
		) {
			const requestOrigin = request.headers.origin;
			if (!requestOrigin) {
				debug.request.fail("No request origin available");
				throw new LuciaError("AUTH_INVALID_REQUEST");
			}
			try {
				const url = new URL(request.url);
				if (
					!isAllowedUrl(requestOrigin, {
						url,
						allowedSubdomains: this.allowedSubdomains
					})
				) {
					throw new LuciaError("AUTH_INVALID_REQUEST");
				}
				debug.request.info("Valid request origin", requestOrigin);
			} catch {
				debug.request.fail("Invalid origin string", requestOrigin);
				// failed to parse url
				throw new LuciaError("AUTH_INVALID_REQUEST");
			}
		} else {
			debug.request.notice("Skipping CSRF check");
		}
	};

	public readSessionCookie = (
		cookieHeader: string | null | undefined
	): string | null => {
		if (!cookieHeader) {
			debug.request.info("No session cookie found");
			return null;
		}
		const cookies = parseCookie(cookieHeader);
		const sessionId = cookies[this.sessionCookie.name] ?? null;
		if (sessionId) {
			debug.request.info("Found session cookie", sessionId);
		} else {
			debug.request.info("No session cookie found");
		}
		return sessionId;
	};

	public readBearerToken = (
		authorizationHeader: string | null | undefined
	): string | null => {
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
	};

	public handleRequest = (
		// cant reference middleware type with Lucia.Auth
		...args: Auth<_Configuration>["middleware"] extends Middleware<infer Args>
			? Args
			: never
	): AuthRequest<Lucia.Auth> => {
		const middleware = this.middleware as Middleware;
		return new AuthRequest(
			this,
			middleware({
				args,
				env: this.env,
				cookieName: this.sessionCookie.name
			})
		);
	};

	public createSessionCookie = (session: Session | null): Cookie => {
		return createSessionCookie(session, {
			env: this.env,
			...this.sessionCookie
		});
	};

	public createKey = async (options: {
		userId: string;
		providerId: string;
		providerUserId: string;
		password: string | null;
	}): Promise<Key> => {
		const keyId = `${options.providerId}:${options.providerUserId}`;
		let hashedPassword: string | null = null;
		if (options.password !== null) {
			hashedPassword = await this.passwordHash.generate(options.password);
		}
		const userId = options.userId;
		await this.adapter.setKey({
			id: keyId,
			user_id: userId,
			hashed_password: hashedPassword
		});
		return {
			providerId: options.providerId,
			providerUserId: options.providerUserId,
			passwordDefined: !!options.password,
			userId
		} satisfies Key as any;
	};

	public deleteKey = async (
		providerId: string,
		providerUserId: string
	): Promise<void> => {
		const keyId = `${providerId}:${providerUserId}`;
		await this.adapter.deleteKey(keyId);
	};

	public getKey = async (
		providerId: string,
		providerUserId: string
	): Promise<Key> => {
		const keyId = `${providerId}:${providerUserId}`;
		const databaseKey = await this.adapter.getKey(keyId);
		if (!databaseKey) {
			throw new LuciaError("AUTH_INVALID_KEY_ID");
		}
		const key = transformDatabaseKey(databaseKey);
		return key;
	};

	public getAllUserKeys = async (userId: string): Promise<Key[]> => {
		const [databaseKeys] = await Promise.all([
			await this.adapter.getKeysByUserId(userId),
			this.getUser(userId)
		]);
		return databaseKeys.map((databaseKey) => transformDatabaseKey(databaseKey));
	};

	public updateKeyPassword = async (
		providerId: string,
		providerUserId: string,
		password: string | null
	): Promise<void> => {
		const keyId = `${providerId}:${providerUserId}`;
		const hashedPassword =
			password === null ? null : await this.passwordHash.generate(password);
		await this.adapter.updateKey(keyId, {
			hashed_password: hashedPassword
		});
		await this.getKey(providerId, providerUserId);
	};
}

type MaybePromise<T> = T | Promise<T>;

export type Configuration<
	_UserAttributes extends Record<string, any> = {},
	_SessionAttributes extends Record<string, any> = {}
> = {
	adapter:
		| InitializeAdapter<Adapter>
		| {
				user: InitializeAdapter<Adapter>;
				session: InitializeAdapter<SessionAdapter>;
		  };
	env: Env;

	middleware?: Middleware;
	csrfProtection?:
		| boolean
		| {
				baseDomain: string;
				allowedSubDomains: string[] | "*";
		  };
	sessionExpiresIn?: {
		activePeriod: number;
		idlePeriod: number;
	};
	sessionCookie?: {
		name?: string;
		attributes?: SessionCookieAttributes;
		expires?: boolean;
	};
	getSessionAttributes?: (databaseSession: SessionSchema) => _SessionAttributes;
	getUserAttributes?: (databaseUser: UserSchema) => _UserAttributes;
	passwordHash?: {
		generate: (password: string) => MaybePromise<string>;
		validate: (password: string, hash: string) => MaybePromise<boolean>;
	};
	experimental?: {
		debugMode?: boolean;
	};
};
