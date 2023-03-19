import { Cookie, CookieOption, createSessionCookie } from "./cookie.js";
import { logError } from "../utils/log.js";
import {
	generateHashWithScrypt,
	generateRandomString,
	validateScryptHash
} from "../utils/crypto.js";
import { LuciaError } from "./error.js";
import { parseCookie } from "../utils/cookie.js";
import { validateDatabaseSessionData } from "./session.js";
import { transformDatabaseKey, getOneTimeKeyExpiration } from "./key.js";
export { SESSION_COOKIE_NAME } from "./cookie.js";

import type { UserSchema, SessionSchema, KeySchema } from "./schema.type.js";
import type { Adapter, UserAdapter, SessionAdapter } from "./adapter.type.js";
import type { LuciaErrorConstructor } from "./error.js";
import { isWithinExpiration } from "../utils/date.js";

export type Session = Readonly<{
	sessionId: string;
	userId: string;
	activePeriodExpires: Date;
	idlePeriodExpires: Date;
	state: "idle" | "active";
	isFresh: boolean;
}>;

export type Key = SingleUseKey | PersistentKey;

export type SingleUseKey = Readonly<{
	type: "single_use";
	userId: string;
	providerId: string;
	providerUserId: string;
	isPasswordDefined: boolean;
	expires: Date | null;
	isExpired: boolean;
}>;

export type PersistentKey = Readonly<{
	type: "persistent";
	userId: string;
	providerId: string;
	providerUserId: string;
	isPasswordDefined: boolean;
	isPrimary: boolean;
}>;

export type Env = "DEV" | "PROD";
export type User = ReturnType<Lucia.Auth["transformUserData"]>;
export type UserData = { id: string } & Required<Lucia.UserAttributes>;
export type MinimalRequest = {
	headers: {
		get: (name: string) => null | string;
	};
	url: string;
	method: string;
};

export const lucia = <C extends Configuration>(config: C) => {
	return new Auth(config);
};

const validateConfiguration = (config: Configuration) => {
	const isAdapterProvided = config.adapter;
	if (!isAdapterProvided) {
		logError('Adapter is not defined in configuration ("config.adapter")');
		process.exit(1);
	}
};

export class Auth<C extends Configuration = any> {
	private adapter: Adapter;
	private generateUserId: () => MaybePromise<string>;
	private sessionCookie: CookieOption[];
	private sessionTimeout: {
		activePeriod: number;
		idlePeriod: number;
	};
	public ENV: Env;
	private hash: {
		generate: (s: string) => MaybePromise<string>;
		validate: (s: string, hash: string) => MaybePromise<boolean>;
	};
	private autoDatabaseCleanup: boolean;
	protected transformUserData: (
		userData: UserSchema
	) => C["transformUserData"] extends {}
		? ReturnType<C["transformUserData"]>
		: { userId: string };
	private csrfProtection: boolean;

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
		this.sessionTimeout = {
			activePeriod: config.sessionTimeout?.activePeriod ?? 1000 * 60 * 60 * 24,
			idlePeriod: config.sessionTimeout?.idlePeriod ?? 1000 * 60 * 60 * 24 * 14
		};
		this.autoDatabaseCleanup = config.autoDatabaseCleanup ?? true;
		this.transformUserData = ({
			id,
			hashed_password,
			provider_id,
			...attributes
		}) => {
			const defaultTransform = ({ id }: UserSchema) => {
				return {
					userId: id
				} as const;
			};
			const transform = config.transformUserData ?? defaultTransform;
			return transform({ id, ...attributes }) as User;
		};
		this.sessionCookie = config.sessionCookie ?? [defaultSessionCookieOption];
		this.hash = {
			generate: config.hash?.generate ?? generateHashWithScrypt,
			validate: config.hash?.validate ?? validateScryptHash
		};
	}
	public getUser = async (userId: string): Promise<User> => {
		const databaseUser = await this.adapter.getUser(userId);
		if (!databaseUser) throw new LuciaError("AUTH_INVALID_USER_ID");
		const user = this.transformUserData(databaseUser);
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
		let userData: UserSchema | null;
		let sessionData: SessionSchema | null;
		if (this.adapter.getSessionAndUserBySessionId !== undefined) {
			const databaseUserSession =
				await this.adapter.getSessionAndUserBySessionId(sessionId);
			if (!databaseUserSession) throw new LuciaError("AUTH_INVALID_SESSION_ID");
			userData = databaseUserSession.user;
			sessionData = databaseUserSession.session;
		} else {
			sessionData = await this.adapter.getSession(sessionId);
			userData = sessionData
				? await this.adapter.getUser(sessionData.user_id)
				: null;
		}
		if (!sessionData) throw new LuciaError("AUTH_INVALID_SESSION_ID");
		const session = validateDatabaseSessionData(sessionData);
		if (!session) {
			if (this.autoDatabaseCleanup) {
				await this.adapter.deleteSession(sessionId);
			}
			throw new LuciaError("AUTH_INVALID_SESSION_ID");
		}
		if (!userData) throw new LuciaError("AUTH_INVALID_USER_ID");
		return {
			user: this.transformUserData(userData),
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
			const userData = await this.adapter.setUser(userId, userAttributes, null);
			const user = this.transformUserData(userData);
			return user;
		}
		const keyId = `${data.primaryKey.providerId}:${data.primaryKey.providerUserId}`;
		const password = data.primaryKey.password;
		const hashedPassword = password ? await this.hash.generate(password) : null;
		const userData = await this.adapter.setUser(userId, userAttributes, {
			id: keyId,
			user_id: userId,
			hashed_password: hashedPassword,
			primary: true,
			expires: null
		});
		const user = this.transformUserData(userData);
		return user;
	};

	public updateUserAttributes = async (
		userId: string,
		attributes: Partial<Lucia.UserAttributes>
	): Promise<User> => {
		const [userData] = await Promise.all([
			this.adapter.updateUserAttributes(userId, attributes),
			this.autoDatabaseCleanup
				? await this.deleteDeadUserSessions(userId)
				: null
		]);
		const user = this.transformUserData(userData);
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
			const isPersistent = data.expires === null;
			if (isPersistent) return false;

			if (data.hashed_password === null) return true;
			if (password === null) return false;

			return await this.hash.validate(password, data.hashed_password);
		};

		const databaseKeyData = await this.adapter.getKey(
			keyId,
			shouldDataBeDeleted
		);
		if (!databaseKeyData) throw new LuciaError("AUTH_INVALID_KEY_ID");
		const isSingleUse = databaseKeyData.expires;
		if (isSingleUse) {
			const isValid = isWithinExpiration(databaseKeyData.expires);
			if (!isValid) throw new LuciaError("AUTH_EXPIRED_KEY");
		}
		const hashedPassword = databaseKeyData.hashed_password;
		if (hashedPassword) {
			if (!password) throw new LuciaError("AUTH_INVALID_PASSWORD");
			if (!hashedPassword) throw new LuciaError("AUTH_INVALID_PASSWORD");
			if (hashedPassword.startsWith("$2a"))
				throw new LuciaError("AUTH_OUTDATED_PASSWORD");
			const isValidPassword = await this.hash.validate(
				password,
				hashedPassword
			);
			if (!isValidPassword) throw new LuciaError("AUTH_INVALID_PASSWORD");
		}

		const key = transformDatabaseKey(databaseKeyData);
		return key;
	};

	public getSession = async (sessionId: string): Promise<Session> => {
		if (sessionId.length !== 40)
			throw new LuciaError("AUTH_INVALID_SESSION_ID");
		const databaseSession = await this.adapter.getSession(sessionId);
		if (!databaseSession) throw new LuciaError("AUTH_INVALID_SESSION_ID");
		const session = validateDatabaseSessionData(databaseSession);
		if (!session) {
			if (this.autoDatabaseCleanup) {
				await this.adapter.deleteSession(sessionId);
			}
			throw new LuciaError("AUTH_INVALID_SESSION_ID");
		}
		return session;
	};

	public getAllUserSessions = async (userId: string): Promise<Session[]> => {
		await this.getUser(userId);
		const databaseData = await this.adapter.getSessionsByUserId(userId);
		const storedUserSessions = databaseData.map((val) => {
			const session = validateDatabaseSessionData(val);
			if (session) {
				return {
					isValid: true,
					session
				} as const;
			}
			return {
				isValid: false,
				sessionId: val.id
			} as const;
		});
		if (storedUserSessions.some((val) => val.isValid === false)) {
			await Promise.all(
				storedUserSessions
					.filter(
						(
							val
						): val is {
							isValid: false;
							sessionId: string;
						} => val.isValid === false
					)
					.map((val) => val)
			);
		}
		const validUserSessions = storedUserSessions
			.map((val) => {
				return val.isValid ? val.session : null;
			})
			.filter((val): val is Session => val !== null);
		return validUserSessions;
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

	public generateSessionId = (): [
		sessionId: string,
		activePeriodExpires: Date,
		idlePeriodExpires: Date
	] => {
		const sessionId = generateRandomString(40);
		const activePeriodExpires = new Date(
			new Date().getTime() + this.sessionTimeout.activePeriod
		);
		const idlePeriodExpires = new Date(
			activePeriodExpires.getTime() + this.sessionTimeout.idlePeriod
		);
		return [sessionId, activePeriodExpires, idlePeriodExpires];
	};

	public createSession = async (userId: string): Promise<Session> => {
		const [sessionId, activePeriodExpires, idlePeriodExpires] =
			this.generateSessionId();
		await Promise.all([
			this.adapter.setSession({
				id: sessionId,
				user_id: userId,
				active_expires: activePeriodExpires.getTime(),
				idle_expires: idlePeriodExpires.getTime()
			}),
			this.autoDatabaseCleanup
				? await this.deleteDeadUserSessions(userId)
				: null
		]);
		return {
			userId,
			activePeriodExpires,
			sessionId,
			idlePeriodExpires,
			state: "active",
			isFresh: true
		};
	};

	public renewSession = async (sessionId: string): Promise<Session> => {
		if (sessionId.length !== 40)
			throw new LuciaError("AUTH_INVALID_SESSION_ID");
		const sessionData = await this.adapter.getSession(sessionId);
		if (!sessionData) throw new LuciaError("AUTH_INVALID_SESSION_ID");
		const session = validateDatabaseSessionData(sessionData);
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
		const sessions = await this.adapter.getSessionsByUserId(userId);
		const currentTime = new Date().getTime();
		const deadSessionIds = sessions
			.filter((val) => val.idle_expires < currentTime)
			.map((val) => val.id);
		if (deadSessionIds.length === 0) return;
		await this.adapter.deleteSession(...deadSessionIds);
	};

	public validateRequestHeaders = (request: MinimalRequest): string => {
		const cookies = parseCookie(request.headers.get("cookie") ?? "");
		const sessionId = cookies.auth_session ?? "";
		const checkForCsrf = request.method !== "GET" && request.method !== "HEAD";
		if (checkForCsrf && this.csrfProtection) {
			const origin = request.headers.get("Origin");
			if (!origin) throw new LuciaError("AUTH_INVALID_REQUEST");
			const url = new URL(request.url);
			if (url.origin !== origin) throw new LuciaError("AUTH_INVALID_REQUEST");
		}
		return sessionId;
	};

	public createSessionCookies = (session: Session | null): Cookie[] => {
		return this.sessionCookie.map((options) =>
			createSessionCookie(session, this.ENV, options)
		);
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
					timeout: number;
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
				primary: false,
				expires: null
			});
			return {
				type: "persistent",
				providerId: keyData.providerId,
				providerUserId: keyData.providerUserId,
				isPrimary: false,
				isPasswordDefined: !!keyData.password,
				userId
			} satisfies PersistentKey as any;
		}
		const oneTimeExpires = getOneTimeKeyExpiration(keyData.timeout);
		if (!oneTimeExpires) throw new TypeError();
		await this.adapter.setKey({
			id: keyId,
			user_id: userId,
			hashed_password: hashedPassword,
			primary: false,
			expires: oneTimeExpires.getTime()
		});
		return {
			type: "single_use",
			providerId: keyData.providerId,
			providerUserId: keyData.providerUserId,
			userId,
			expires: oneTimeExpires ?? null,
			isExpired: !isWithinExpiration(keyData.timeout),
			isPasswordDefined: !!keyData.password
		} satisfies SingleUseKey as any;
	};

	public deleteKey = async (providerId: string, providerUserId: string) => {
		const keyId = `${providerId}:${providerUserId}`;
		await this.adapter.deleteNonPrimaryKey(keyId);
	};

	public getKey = async (
		providerId: string,
		providerUserId: string
	): Promise<Key> => {
		const keyId = `${providerId}:${providerUserId}`;
		const shouldDataBeDeleted = async () => false;
		const keyData = await this.adapter.getKey(keyId, shouldDataBeDeleted);
		if (!keyData) throw new LuciaError("AUTH_INVALID_KEY_ID");
		const key = transformDatabaseKey(keyData);
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
	generateCustomUserId?: () => MaybePromise<string>;
	csrfProtection?: boolean;
	sessionTimeout?: {
		activePeriod: number;
		idlePeriod: number;
	};
	transformUserData?: (userData: UserData) => Record<string, any>;
	sessionCookie?: CookieOption[];
	hash?: {
		generate: (s: string) => MaybePromise<string>;
		validate: (s: string, hash: string) => MaybePromise<boolean>;
	};
	autoDatabaseCleanup?: boolean;
};
