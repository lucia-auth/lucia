import {
	Cookie,
	CookieOption,
	SESSION_COOKIE_NAME,
	createSessionCookie
} from "./cookie.js";
import { logError } from "../utils/log.js";
import { generateHashWithScrypt, validateScryptHash } from "../utils/crypto.js";
import { generateRandomString } from "../utils/nanoid.js";
import { LuciaError } from "./error.js";
import { parseCookie } from "../utils/cookie.js";
import { validateDatabaseSession } from "./session.js";
import { transformDatabaseKey, getOneTimeKeyExpiration } from "./key.js";
import { isWithinExpiration } from "../utils/date.js";
import { AuthRequest } from "./request.js";
import { lucia as defaultMiddleware } from "../middleware/index.js";

import type { UserSchema, SessionSchema, KeySchema } from "./schema.js";
import type { Adapter, UserAdapter, SessionAdapter } from "./adapter.js";
import type { LuciaErrorConstructor } from "./error.js";
import type { Middleware, LuciaRequest } from "./request.js";

export type Session = Readonly<{
	sessionId: string;
	userId: string;
	activePeriodExpiresAt: Date;
	idlePeriodExpiresAt: Date;
	state: "idle" | "active";
	fresh: boolean;
}>;

export type Key = SingleUseKey | PersistentKey;

export type SingleUseKey = Readonly<{
	type: "single_use";
	userId: string;
	providerId: string;
	providerUserId: string;
	passwordDefined: boolean;
	expiresAt: Date;
	expired: boolean;
}>;

export type PersistentKey = Readonly<{
	type: "persistent";
	userId: string;
	providerId: string;
	providerUserId: string;
	passwordDefined: boolean;
	primary: boolean;
}>;

export type Env = "DEV" | "PROD";
export type User = ReturnType<Lucia.Auth["_transformDatabaseUser"]>;
type DatabaseUser = { id: string } & Required<Lucia.UserAttributes>;

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
	public ENV: Env;
	private hash: {
		generate: (s: string) => MaybePromise<string>;
		validate: (s: string, hash: string) => MaybePromise<boolean>;
	};
	private autoDatabaseCleanup: boolean;
	protected middleware: C["middleware"] extends Middleware
		? C["middleware"]
		: ReturnType<typeof defaultMiddleware>;
	private csrfProtection: boolean;
	private origin: string[];

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
		this.ENV = config.env;
		this.csrfProtection = config.csrfProtection ?? true;
		this.sessionExpiresIn = {
			activePeriod:
				config.sessionExpiresIn?.activePeriod ?? 1000 * 60 * 60 * 24,
			idlePeriod:
				config.sessionExpiresIn?.idlePeriod ?? 1000 * 60 * 60 * 24 * 14
		};
		this.autoDatabaseCleanup = config.autoDatabaseCleanup ?? true;
		this._transformDatabaseUser = (databaseUser) => {
			const defaultTransform = ({ id }: UserSchema) => {
				return {
					userId: id
				} as const;
			};
			const transform = config.transformDatabaseUser ?? defaultTransform;
			return transform(databaseUser) as any;
		};
		this.sessionCookieOption =
			config.sessionCookie ?? defaultSessionCookieOption;
		this.hash = {
			generate: config.hash?.generate ?? generateHashWithScrypt,
			validate: config.hash?.validate ?? validateScryptHash
		};
		this.middleware = config.middleware ?? defaultMiddleware();
		this.origin = config.origin ?? [];
	}
	protected _transformDatabaseUser: (
		databaseUser: UserSchema
	) => C["transformDatabaseUser"] extends Function
		? ReturnType<C["transformDatabaseUser"]>
		: { userId: string };
	public transformDatabaseUser = (databaseUser: UserSchema): User => {
		return this._transformDatabaseUser(databaseUser);
	};
	public getUser = async (userId: string): Promise<User> => {
		const databaseUser = await this.adapter.getUser(userId);
		if (!databaseUser) throw new LuciaError("AUTH_INVALID_USER_ID");
		const user = this.transformDatabaseUser(databaseUser);
		return user;
	};

	public getSessionUser = async (
		sessionId: string
	): Promise<{
		user: User;
		session: Session;
	}> => {
		if (sessionId.length !== 40)
			throw new LuciaError("AUTH_INVALID_SESSION_ID");
		let databaseUser: UserSchema | null;
		let sessionData: SessionSchema | null;
		if (this.adapter.getSessionAndUserBySessionId !== undefined) {
			const databaseUserSession =
				await this.adapter.getSessionAndUserBySessionId(sessionId);
			if (!databaseUserSession) throw new LuciaError("AUTH_INVALID_SESSION_ID");
			databaseUser = databaseUserSession.user;
			sessionData = databaseUserSession.session;
		} else {
			sessionData = await this.adapter.getSession(sessionId);
			databaseUser = sessionData
				? await this.adapter.getUser(sessionData.user_id)
				: null;
		}
		if (!sessionData) throw new LuciaError("AUTH_INVALID_SESSION_ID");
		const session = validateDatabaseSession(sessionData);
		if (!session) {
			if (this.autoDatabaseCleanup) {
				await this.adapter.deleteSession(sessionId);
			}
			throw new LuciaError("AUTH_INVALID_SESSION_ID");
		}
		if (!databaseUser) throw new LuciaError("AUTH_INVALID_USER_ID");
		return {
			user: this.transformDatabaseUser(databaseUser),
			session
		};
	};

	public createUser = async (data: {
		primaryKey: {
			providerId: string;
			providerUserId: string;
			password: string | null;
		} | null;
		attributes: Lucia.UserAttributes;
	}): Promise<User> => {
		const userId = await this.generateUserId();
		const userAttributes = data.attributes ?? {};
		if (data.primaryKey === null) {
			const databaseUser = await this.adapter.setUser(
				userId,
				userAttributes,
				null
			);
			const user = this.transformDatabaseUser(databaseUser);
			return user;
		}
		const keyId = `${data.primaryKey.providerId}:${data.primaryKey.providerUserId}`;
		const password = data.primaryKey.password;
		const hashedPassword = password ? await this.hash.generate(password) : null;
		const databaseUser = await this.adapter.setUser(userId, userAttributes, {
			id: keyId,
			user_id: userId,
			hashed_password: hashedPassword,
			primary_key: true,
			expires: null
		});
		const user = this.transformDatabaseUser(databaseUser);
		return user;
	};

	public updateUserAttributes = async (
		userId: string,
		attributes: Partial<Lucia.UserAttributes>
	): Promise<User> => {
		const [databaseUser] = await Promise.all([
			this.adapter.updateUserAttributes(userId, attributes),
			this.autoDatabaseCleanup
				? await this.deleteDeadUserSessions(userId)
				: null
		]);
		const user = this.transformDatabaseUser(databaseUser);
		return user;
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

		const shouldDataBeDeleted = async (data: KeySchema) => {
			const persistentKey = data.expires === null;
			if (persistentKey) return false;

			if (data.hashed_password === null) return true;
			if (password === null) return false;

			return await this.hash.validate(password, data.hashed_password);
		};

		const databaseKeyData = await this.adapter.getKey(
			keyId,
			shouldDataBeDeleted
		);
		if (!databaseKeyData) throw new LuciaError("AUTH_INVALID_KEY_ID");
		const singleUse = !!databaseKeyData.expires;
		if (singleUse) {
			const withinExpiration = isWithinExpiration(databaseKeyData.expires);
			if (!withinExpiration) throw new LuciaError("AUTH_EXPIRED_KEY");
		}
		const hashedPassword = databaseKeyData.hashed_password;
		if (hashedPassword) {
			if (!password) throw new LuciaError("AUTH_INVALID_PASSWORD");
			if (!hashedPassword) throw new LuciaError("AUTH_INVALID_PASSWORD");
			if (hashedPassword.startsWith("$2a"))
				throw new LuciaError("AUTH_OUTDATED_PASSWORD");
			const validPassword = await this.hash.validate(password, hashedPassword);
			if (!validPassword) throw new LuciaError("AUTH_INVALID_PASSWORD");
		}

		const key = transformDatabaseKey(databaseKeyData);
		return key;
	};

	public getSession = async (sessionId: string): Promise<Session> => {
		if (sessionId.length !== 40)
			throw new LuciaError("AUTH_INVALID_SESSION_ID");
		const databaseSession = await this.adapter.getSession(sessionId);
		if (!databaseSession) throw new LuciaError("AUTH_INVALID_SESSION_ID");
		const session = validateDatabaseSession(databaseSession);
		if (!session) {
			if (this.autoDatabaseCleanup) {
				await this.adapter.deleteSession(sessionId);
			}
			throw new LuciaError("AUTH_INVALID_SESSION_ID");
		}
		return session;
	};

	public getAllUserSessions = async (userId: string): Promise<Session[]> => {
		// validate user id
		await this.getUser(userId);
		const databaseData = await this.adapter.getSessionsByUserId(userId);
		const validStoredUserSessions = databaseData
			.map((databaseSession) => {
				return validateDatabaseSession(databaseSession);
			})
			.filter((session): session is Session => session !== null);
		const deadStoredUserSessionIds = databaseData
			.map((databaseSession) => {
				return databaseSession.id;
			})
			.filter((sessionId) => {
				return !validStoredUserSessions.some(
					(validSession) => validSession.sessionId === sessionId
				);
			});
		if (deadStoredUserSessionIds.length > 0) {
			await Promise.all(
				deadStoredUserSessionIds.map((deadSessionId) =>
					this.adapter.deleteSession(deadSessionId)
				)
			);
		}
		return validStoredUserSessions;
	};

	public validateSession = async (sessionId: string): Promise<Session> => {
		const session = await this.getSession(sessionId);
		if (session.state === "active") return session;
		const renewedSession = await this.renewSession(sessionId);
		return renewedSession;
	};

	public validateSessionUser = async (
		sessionId: string
	): Promise<{ session: Session; user: User }> => {
		const { session, user } = await this.getSessionUser(sessionId);
		if (session.state === "active") return { session, user };
		const renewedSession = await this.renewSession(sessionId);
		return {
			session: renewedSession,
			user
		};
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
		await Promise.all([
			this.adapter.setSession({
				id: sessionId,
				user_id: userId,
				active_expires: activePeriodExpiresAt.getTime(),
				idle_expires: idlePeriodExpiresAt.getTime()
			}),
			this.autoDatabaseCleanup
				? await this.deleteDeadUserSessions(userId)
				: null
		]);
		return {
			userId,
			activePeriodExpiresAt,
			sessionId,
			idlePeriodExpiresAt,
			state: "active",
			fresh: true
		};
	};

	public renewSession = async (sessionId: string): Promise<Session> => {
		if (sessionId.length !== 40)
			throw new LuciaError("AUTH_INVALID_SESSION_ID");
		const databaseSession = await this.adapter.getSession(sessionId);
		if (!databaseSession) throw new LuciaError("AUTH_INVALID_SESSION_ID");
		const session = validateDatabaseSession(databaseSession);
		if (!session) {
			if (this.autoDatabaseCleanup) {
				await this.adapter.deleteSession(sessionId);
			}
			throw new LuciaError("AUTH_INVALID_SESSION_ID");
		}
		const [renewedSession] = await Promise.all([
			await this.createSession(session.userId),
			this.autoDatabaseCleanup
				? await this.deleteDeadUserSessions(session.userId)
				: null
		]);
		return renewedSession;
	};

	public invalidateSession = async (sessionId: string): Promise<void> => {
		await this.adapter.deleteSession(sessionId);
	};

	public invalidateAllUserSessions = async (userId: string): Promise<void> => {
		await this.adapter.deleteSessionsByUserId(userId);
	};

	public deleteDeadUserSessions = async (userId: string): Promise<void> => {
		const databaseSessions = await this.adapter.getSessionsByUserId(userId);
		const deadSessionIds = databaseSessions
			.filter((databaseSession) => {
				return validateDatabaseSession(databaseSession) === null;
			})
			.map((databaseSession) => databaseSession.id);
		if (deadSessionIds.length === 0) return;
		await Promise.all(
			deadSessionIds.map((deadSessionId) => {
				this.adapter.deleteSession(deadSessionId);
			})
		);
	};

	public parseRequestHeaders = (request: LuciaRequest): string | null => {
		const cookies = parseCookie(request.headers.cookie ?? "");
		const sessionId = cookies[SESSION_COOKIE_NAME] ?? null;
		if (request.method === null || request.url === null)
			throw new LuciaError("AUTH_INVALID_REQUEST");
		const checkForCsrf =
			request.method.toUpperCase() !== "GET" &&
			request.method.toUpperCase() !== "HEAD";
		if (checkForCsrf && this.csrfProtection) {
			const requestOrigin = request.headers.origin;
			if (!requestOrigin) throw new LuciaError("AUTH_INVALID_REQUEST");
			const url = new URL(request.url);
			if (![url.origin, ...this.origin].includes(requestOrigin))
				throw new LuciaError("AUTH_INVALID_REQUEST");
		}
		return sessionId;
	};

	public handleRequest = (
		...args: Parameters<Lucia.Auth["middleware"]>
	): AuthRequest<Lucia.Auth, ReturnType<Lucia.Auth["middleware"]>> => {
		const middleware = this.middleware as Middleware;
		return new AuthRequest(this, middleware(...args));
	};

	public createSessionCookie = (session: Session | null): Cookie => {
		return createSessionCookie(session, this.ENV, this.sessionCookieOption);
	};

	public createKey = async <
		KeyData extends
			| {
					readonly type: PersistentKey["type"];
					providerId: string;
					providerUserId: string;
					password: string | null;
			  }
			| {
					readonly type: SingleUseKey["type"];
					providerId: string;
					providerUserId: string;
					password: string | null;
					expiresIn: number;
			  }
	>(
		userId: string,
		keyData: KeyData
	): Promise<
		KeyData["type"] extends PersistentKey["type"] ? PersistentKey : SingleUseKey
	> => {
		const keyId = `${keyData.providerId}:${keyData.providerUserId}`;
		const hashedPassword = keyData.password
			? await this.hash.generate(keyData.password)
			: null;
		if (keyData.type === "persistent") {
			await this.adapter.setKey({
				id: keyId,
				user_id: userId,
				hashed_password: hashedPassword,
				primary_key: false,
				expires: null
			});
			return {
				type: "persistent",
				providerId: keyData.providerId,
				providerUserId: keyData.providerUserId,
				primary: false,
				passwordDefined: !!keyData.password,
				userId
			} satisfies PersistentKey as any;
		}
		const expiresAt = getOneTimeKeyExpiration(keyData.expiresIn);
		if (!expiresAt) throw new TypeError();
		await this.adapter.setKey({
			id: keyId,
			user_id: userId,
			hashed_password: hashedPassword,
			primary_key: false,
			expires: expiresAt.getTime()
		});
		return {
			type: "single_use",
			providerId: keyData.providerId,
			providerUserId: keyData.providerUserId,
			userId,
			expiresAt,
			expired: !isWithinExpiration(keyData.expiresIn),
			passwordDefined: !!keyData.password
		} satisfies SingleUseKey as any;
	};

	public deleteKey = async (
		providerId: string,
		providerUserId: string
	): Promise<void> => {
		const keyId = `${providerId}:${providerUserId}`;
		await this.adapter.deleteNonPrimaryKey(keyId);
	};

	public getKey = async (
		providerId: string,
		providerUserId: string
	): Promise<Key> => {
		const keyId = `${providerId}:${providerUserId}`;
		const shouldDataBeDeleted = async () => false;
		const databaseKey = await this.adapter.getKey(keyId, shouldDataBeDeleted);
		if (!databaseKey) throw new LuciaError("AUTH_INVALID_KEY_ID");
		const key = transformDatabaseKey(databaseKey);
		return key;
	};

	public getAllUserKeys = async (userId: string): Promise<Key[]> => {
		await this.getUser(userId);
		const databaseData = await this.adapter.getKeysByUserId(userId);
		return databaseData.map((val) => transformDatabaseKey(val));
	};

	public updateKeyPassword = async (
		providerId: string,
		providerUserId: string,
		password: string | null
	): Promise<void> => {
		const keyId = `${providerId}:${providerUserId}`;
		if (password === null) {
			return await this.adapter.updateKeyPassword(keyId, null);
		}
		const hashedPassword = await this.hash.generate(password);
		await this.adapter.updateKeyPassword(keyId, hashedPassword);
	};
}

type MaybePromise<T> = T | Promise<T>;

export type Configuration = {
	adapter:
		| ((E: LuciaErrorConstructor) => Adapter)
		| {
				user: (E: LuciaErrorConstructor) => UserAdapter | Adapter;
				session: (E: LuciaErrorConstructor) => SessionAdapter | Adapter;
		  };
	env: Env;

	autoDatabaseCleanup?: boolean;
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
	transformDatabaseUser?: (
		databaseUser: Required<UserSchema>
	) => Record<string, any>;
};
