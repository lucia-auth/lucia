import {
	Cookie,
	CookieOption,
	SESSION_COOKIE_NAME,
	createSessionCookie
} from "./cookie.js";
import { logError } from "../utils/log.js";
import { generateScryptHash, validateScryptHash } from "../utils/crypto.js";
import { generateRandomString } from "../utils/nanoid.js";
import { LuciaError } from "./error.js";
import { parseCookie } from "../utils/cookie.js";
import { isValidDatabaseSession, transformDatabaseSession } from "./session.js";
import { transformDatabaseKey } from "./key.js";
import { AuthRequest } from "./request.js";
import { lucia as defaultMiddleware } from "../middleware/index.js";
import { debug } from "../utils/debug.js";

import type { UserSchema, SessionSchema } from "./schema.js";
import type { Adapter, UserAdapter, SessionAdapter } from "./adapter.js";
import type { LuciaErrorConstructor } from "./error.js";
import type { Middleware, LuciaRequest } from "./request.js";

export type Session = Readonly<{
	user: User;
	sessionId: string;
	activePeriodExpiresAt: Date;
	idlePeriodExpiresAt: Date;
	state: "idle" | "active";
	fresh: boolean;
}>;

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

export const lucia = <C extends Configuration>(config: C) => {
	return new Auth(config);
};

const validateConfiguration = (config: Configuration) => {
	const adapterProvided = config.adapter;
	if (!adapterProvided) {
		logError('Adapter is not defined in configuration ("config.adapter")');
		process.exit(1);
	}
};

export class Auth<C extends Configuration = any> {
	private adapter: Adapter;
	private generateUserId: () => MaybePromise<string>;
	private sessionCookieOption: CookieOption;
	private sessionExpiresIn: {
		activePeriod: number;
		idlePeriod: number;
	};
	private env: Env;
	private hash: {
		generate: (s: string) => MaybePromise<string>;
		validate: (s: string, hash: string) => MaybePromise<boolean>;
	};
	protected middleware: C["middleware"] extends Middleware
		? C["middleware"]
		: ReturnType<typeof defaultMiddleware>;
	private csrfProtection: boolean;
	private origin: string[];
	private experimental: {
		debugMode: boolean;
	};

	constructor(config: C) {
		validateConfiguration(config);
		const defaultSessionCookieOption: CookieOption = {
			sameSite: "lax",
			path: "/"
		};
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
		this.generateUserId =
			config.generateCustomUserId ?? (() => generateRandomString(15));
		this.env = config.env;
		this.csrfProtection = config.csrfProtection ?? true;
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
		this.sessionCookieOption =
			config.sessionCookie ?? defaultSessionCookieOption;
		this.hash = {
			generate: config.hash?.generate ?? generateScryptHash,
			validate: config.hash?.validate ?? validateScryptHash
		};
		this.middleware = config.middleware ?? defaultMiddleware();
		this.origin = config.origin ?? [];
		this.experimental = {
			debugMode: config.experimental?.debugMode ?? false
		};
		debug.init(this.experimental.debugMode);
	}

	protected getUserAttributes: (
		databaseUser: UserSchema
	) => C extends Configuration<infer _UserAttributes> ? _UserAttributes : never;

	public transformDatabaseUser = (databaseUser: UserSchema): User => {
		const attributes = this.getUserAttributes(databaseUser);
		return {
			...attributes,
			userId: databaseUser.id
		};
	};

	public getUser = async (userId: string): Promise<User> => {
		const databaseUser = await this.adapter.getUser(userId);
		if (!databaseUser) {
			throw new LuciaError("AUTH_INVALID_USER_ID");
		}
		const user = this.transformDatabaseUser(databaseUser);
		return user;
	};

	public createUser = async (data: {
		key: {
			providerId: string;
			providerUserId: string;
			password: string | null;
		} | null;
		attributes: Lucia.DatabaseUserAttributes;
	}): Promise<User> => {
		const userId = await this.generateUserId();
		const userAttributes = data.attributes ?? {};
		if (data.key === null) {
			const databaseUser = await this.adapter.setUser(
				{
					id: userId,
					...userAttributes
				},
				null
			);
			if (databaseUser) return this.transformDatabaseUser(databaseUser);
			return await this.getUser(userId);
		}
		const keyId = `${data.key.providerId}:${data.key.providerUserId}`;
		const password = data.key.password;
		const hashedPassword = password ? await this.hash.generate(password) : null;
		const databaseUser = await this.adapter.setUser(
			{
				id: userId,
				...userAttributes
			},
			{
				id: keyId,
				user_id: userId,
				hashed_password: hashedPassword
			}
		);
		if (databaseUser) return this.transformDatabaseUser(databaseUser);
		return await this.getUser(userId);
	};

	public updateUserAttributes = async (
		userId: string,
		attributes: Partial<Lucia.DatabaseUserAttributes>
	): Promise<User> => {
		const updatedDatabaseUser = await this.adapter.updateUser(
			userId,
			attributes
		);
		if (updatedDatabaseUser) {
			return this.transformDatabaseUser(updatedDatabaseUser);
		}
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
			const validPassword = await this.hash.validate(password, hashedPassword);
			if (!validPassword) {
				debug.key.fail("Incorrect key password", password);
				throw new LuciaError("AUTH_INVALID_PASSWORD");
			}
			debug.key.notice("Validated key password");
		} else {
			debug.key.info("No password included in key");
		}
		debug.key.success("Validated key", keyId);
		const key = transformDatabaseKey(databaseKey);
		return key;
	};

	public getSession = async (sessionId: string): Promise<Session> => {
		if (sessionId.length !== 40) {
			debug.session.fail("Expected id length to be 40", sessionId);
			throw new LuciaError("AUTH_INVALID_SESSION_ID");
		}
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
			return transformDatabaseSession(
				databaseSession,
				this.transformDatabaseUser(databaseUser)
			);
		}
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
		const user = await this.getUser(databaseSession.user_id);
		return transformDatabaseSession(databaseSession, user);
	};

	public getAllUserSessions = async (userId: string): Promise<Session[]> => {
		// validate user id
		await this.getUser(userId);
		const [user, databaseSessions] = await Promise.all([
			this.getUser(userId),
			await this.adapter.getSessionsByUserId(userId)
		]);
		const validStoredUserSessions = databaseSessions
			.filter((databaseSession) => {
				return isValidDatabaseSession(databaseSession);
			})
			.map((databaseSession) => {
				return transformDatabaseSession(databaseSession, user);
			});
		return validStoredUserSessions;
	};

	public validateSession = async (sessionId: string): Promise<Session> => {
		const session = await this.getSession(sessionId);
		if (session.state === "active") {
			debug.session.success("Validated session", session.sessionId);
			return session;
		}
		const renewedSession = await this.renewSession(sessionId);
		return renewedSession;
	};

	public generateSessionId = (): readonly [
		sessionId: string,
		activePeriodExpiresAt: Date,
		idlePeriodExpiresAt: Date
	] => {
		const sessionId = generateRandomString(40);
		const activePeriodExpiresAt = new Date(
			new Date().getTime() + this.sessionExpiresIn.activePeriod
		);
		const idlePeriodExpiresAt = new Date(
			activePeriodExpiresAt.getTime() + this.sessionExpiresIn.idlePeriod
		);
		return [sessionId, activePeriodExpiresAt, idlePeriodExpiresAt];
	};

	public createSession = async (userId: string): Promise<Session> => {
		const [sessionId, activePeriodExpiresAt, idlePeriodExpiresAt] =
			this.generateSessionId();
		const [user] = await Promise.all([
			this.getUser(userId),
			this.adapter.setSession({
				id: sessionId,
				user_id: userId,
				active_expires: activePeriodExpiresAt.getTime(),
				idle_expires: idlePeriodExpiresAt.getTime()
			})
		]);
		return {
			user: user,
			activePeriodExpiresAt,
			sessionId,
			idlePeriodExpiresAt,
			state: "active",
			fresh: true
		};
	};

	public renewSession = async (sessionId: string): Promise<Session> => {
		if (sessionId.length !== 40) {
			debug.session.fail("Expected id length to be 40", sessionId);
			throw new LuciaError("AUTH_INVALID_SESSION_ID");
		}
		const session = await this.getSession(sessionId);
		const [renewedSession] = await Promise.all([
			this.createSession(session.user.userId),
			this.adapter.deleteSession(sessionId)
		]);
		debug.session.success("Session renewed", renewedSession.sessionId);
		return renewedSession;
	};

	public invalidateSession = async (sessionId: string): Promise<void> => {
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

	public parseRequestHeaders = (request: LuciaRequest): string | null => {
		debug.request.init(request.method ?? "<method>", request.url ?? "<url>");
		if (request.method === null) {
			debug.request.fail("Request method unavailable");
			throw new LuciaError("AUTH_INVALID_REQUEST");
		}
		if (request.url === null) {
			debug.request.fail("Request url unavailable");
			throw new LuciaError("AUTH_INVALID_REQUEST");
		}
		const cookies = parseCookie(request.headers.cookie ?? "");
		const sessionId = cookies[SESSION_COOKIE_NAME] ?? null;
		if (sessionId) {
			debug.request.info("Found session cookie", sessionId);
		} else {
			debug.request.info("No session cookie found");
		}
		const csrfCheck =
			request.method.toUpperCase() !== "GET" &&
			request.method.toUpperCase() !== "HEAD";
		if (csrfCheck && this.csrfProtection) {
			const requestOrigin = request.headers.origin;
			if (!requestOrigin) {
				debug.request.fail("No request origin available");
				throw new LuciaError("AUTH_INVALID_REQUEST");
			}
			try {
				const url = new URL(request.url);
				if (![url.origin, ...this.origin].includes(requestOrigin)) {
					debug.request.fail("Invalid request origin", requestOrigin);
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
		return sessionId;
	};

	public handleRequest = (
		// cant reference middleware type with Lucia.Auth
		...args: Auth<C>["middleware"] extends Middleware<infer Args> ? Args : never
	): AuthRequest<Lucia.Auth> => {
		const middleware = this.middleware as Middleware;
		return new AuthRequest(this, middleware(...[...args, this.env]));
	};

	public createSessionCookie = (session: Session | null): Cookie => {
		return createSessionCookie(session, this.env, this.sessionCookieOption);
	};

	public createKey = async (
		userId: string,
		keyData: {
			providerId: string;
			providerUserId: string;
			password: string | null;
		}
	): Promise<Key> => {
		const keyId = `${keyData.providerId}:${keyData.providerUserId}`;
		let hashedPassword: string | null = null;
		if (keyData.password !== null) {
			hashedPassword = await this.hash.generate(keyData.password);
		}
		await this.adapter.setKey({
			id: keyId,
			user_id: userId,
			hashed_password: hashedPassword
		});
		return {
			providerId: keyData.providerId,
			providerUserId: keyData.providerUserId,
			passwordDefined: !!keyData.password,
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
		// validate user id
		await this.getUser(userId);
		const databaseKeys = await this.adapter.getKeysByUserId(userId);
		return databaseKeys.map((dbKey) => transformDatabaseKey(dbKey));
	};

	public updateKeyPassword = async (
		providerId: string,
		providerUserId: string,
		password: string | null
	): Promise<void> => {
		const keyId = `${providerId}:${providerUserId}`;
		const hashedPassword =
			password === null ? null : await this.hash.generate(password);
		const databaseKey = await this.adapter.updateKey(keyId, {
			hashed_password: hashedPassword
		});
		if (databaseKey) return;
		// validate key
		await this.getKey(providerId, providerUserId);
	};
}

type MaybePromise<T> = T | Promise<T>;

export type Configuration<_UserAttributes extends Record<string, any> = {}> = {
	adapter:
		| ((E: LuciaErrorConstructor) => Adapter)
		| {
				user: (E: LuciaErrorConstructor) => UserAdapter | Adapter;
				session: (E: LuciaErrorConstructor) => SessionAdapter | Adapter;
		  };
	env: Env;

	csrfProtection?: boolean;
	generateCustomUserId?: () => MaybePromise<string>;
	hash?: {
		generate: (s: string) => MaybePromise<string>;
		validate: (s: string, hash: string) => MaybePromise<boolean>;
	};
	middleware?: Middleware;
	origin?: string[];
	sessionExpiresIn?: {
		activePeriod: number;
		idlePeriod: number;
	};
	sessionCookie?: CookieOption;
	getUserAttributes?: (databaseUser: Required<UserSchema>) => _UserAttributes;
	getSessionAttributes?: (
		databaseSession: Required<SessionSchema>
	) => Record<string, any>;
	experimental?: {
		debugMode?: boolean;
	};
};
