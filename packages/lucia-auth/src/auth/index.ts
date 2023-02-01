import type {
	Env,
	Key,
	MinimalRequest,
	Session,
	SessionSchema,
	User
} from "../types.js";
import { Cookie, CookieOption, createSessionCookie } from "./cookie.js";
import {
	Adapter,
	SessionAdapter,
	UserAdapter,
	UserData,
	UserSchema
} from "../types.js";
import { logError } from "../utils/log.js";
import {
	generateHashWithScrypt,
	generateRandomString,
	validateScryptHash
} from "../utils/crypto.js";
import { LuciaError, LuciaErrorConstructor } from "./error.js";
import { parseCookie } from "../utils/cookie.js";
import { transformDatabaseSessionData } from "./session.js";
import { transformDatabaseKeyData } from "./key.js";

export { SESSION_COOKIE_NAME } from "./cookie.js";

export const lucia = <C extends Configurations>(configs: C) => {
	return new Auth(configs);
};

const validateConfigurations = (configs: Configurations) => {
	const isAdapterProvided = configs.adapter;
	if (!isAdapterProvided) {
		logError('Adapter is not defined in configuration ("config.adapter")');
		process.exit(1);
	}
};

export class Auth<C extends Configurations = any> {
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

	constructor(configs: C) {
		validateConfigurations(configs);
		const defaultSessionCookieOption: CookieOption = {
			sameSite: "lax",
			path: "/"
		};
		if ("user" in configs.adapter) {
			if ("getSessionAndUserBySessionId" in configs.adapter.user) {
				delete configs.adapter.user.getSessionAndUserBySessionId;
			}
			if ("getSessionAndUserBySessionId" in configs.adapter.session) {
				delete configs.adapter.session.getSessionAndUserBySessionId;
			}
		}
		this.adapter =
			"user" in configs.adapter
				? {
						...configs.adapter.user(LuciaError),
						...configs.adapter.session(LuciaError)
				  }
				: configs.adapter(LuciaError);
		this.generateUserId =
			configs.generateCustomUserId ?? (() => generateRandomString(15));
		this.ENV = configs.env;
		this.csrfProtection = configs.csrfProtection ?? true;
		this.sessionTimeout = {
			activePeriod: configs.sessionTimeout?.activePeriod ?? 1000 * 60 * 60 * 24,
			idlePeriod: configs.sessionTimeout?.idlePeriod ?? 1000 * 60 * 60 * 24 * 14
		};
		this.autoDatabaseCleanup = configs.autoDatabaseCleanup ?? true;
		this.transformUserData = ({
			id,
			hashed_password,
			provider_id,
			...attributes
		}) => {
			const transform =
				configs.transformUserData ??
				(({ id }) => {
					return {
						userId: id
					};
				});
			return transform({ id, ...attributes }) as User;
		};
		this.sessionCookie = configs.sessionCookie ?? [defaultSessionCookieOption];
		this.hash = {
			generate: configs.hash?.generate ?? generateHashWithScrypt,
			validate: configs.hash?.validate ?? validateScryptHash
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
		const session = transformDatabaseSessionData(sessionData);
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
		key: {
			providerId: string;
			providerUserId: string;
			password?: string;
		} | null;
		attributes: Lucia.UserAttributes;
	}): Promise<User> => {
		const userId = await this.generateUserId();
		const userAttributes = data.attributes ?? {};
		if (data.key) {
			const keyId = `${data.key.providerId}:${data.key.providerUserId}`;
			const password = data.key.password;
			const hashedPassword = password
				? await this.hash.generate(password)
				: null;
			const userData = await this.adapter.setUser(userId, userAttributes, {
				id: keyId,
				user_id: userId,
				hashed_password: hashedPassword,
				primary: true
			});
			const user = this.transformUserData(userData);
			return user;
		}
		const userData = await this.adapter.setUser(userId, userAttributes, null);
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
	public validateKeyPassword = async (
		providerId: string,
		providerUserId: string,
		password: string
	): Promise<User> => {
		const keyId = `${providerId}:${providerUserId}`;
		const databaseKeyData = await this.adapter.getKey(keyId);
		if (!databaseKeyData) throw new LuciaError("AUTH_INVALID_KEY_ID");
		const hashedPassword = databaseKeyData.hashed_password;
		if (!hashedPassword) throw new LuciaError("AUTH_INVALID_PASSWORD");
		if (hashedPassword.startsWith("$2a"))
			throw new LuciaError("AUTH_OUTDATED_PASSWORD");
		const isValidPassword = await this.hash.validate(password, hashedPassword);
		if (!isValidPassword) throw new LuciaError("AUTH_INVALID_PASSWORD");
		return transformDatabaseKeyData(databaseKeyData);
	};
	public getSession = async (sessionId: string): Promise<Session> => {
		if (sessionId.length !== 40)
			throw new LuciaError("AUTH_INVALID_SESSION_ID");
		const databaseSession = await this.adapter.getSession(sessionId);
		if (!databaseSession) throw new LuciaError("AUTH_INVALID_SESSION_ID");
		const session = transformDatabaseSessionData(databaseSession);
		if (!session) {
			if (this.autoDatabaseCleanup) {
				await this.adapter.deleteSession(sessionId);
			}
			throw new LuciaError("AUTH_INVALID_SESSION_ID");
		}
		return session;
	};
	public getAllUserSessions = async (userId: string) => {
		await this.getUser(userId);
		const databaseData = await this.adapter.getSessionsByUserId(userId);
		return databaseData.map((val) => transformDatabaseSessionData(val));
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
		const session = transformDatabaseSessionData(sessionData);
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
	public createKey = async (
		userId: string,
		keyData: {
			providerId: string;
			providerUserId: string;
			password: string | null;
		}
	): Promise<Key> => {
		const keyId = `${keyData.providerId}:${keyData.providerUserId}`;
		const hashedPassword = keyData.password
			? await this.hash.generate(keyData.password)
			: null;
		await this.adapter.setKey({
			id: keyId,
			user_id: userId,
			hashed_password: hashedPassword,
			primary: false
		});
		return {
			providerId: keyData.providerId,
			providerUserId: keyData.providerUserId,
			isPrimary: false,
			isPasswordDefined: !!keyData.password,
			userId
		};
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
		const keyData = await this.adapter.getKey(keyId);
		if (!keyData) throw new LuciaError("AUTH_INVALID_KEY_ID");
		return {
			providerId,
			providerUserId,
			isPrimary: keyData.primary,
			isPasswordDefined: !!keyData.hashed_password,
			userId: keyData.user_id
		};
	};
	public getKeyUser = async (
		providerId: string,
		providerUserId: string
	): Promise<{
		key: Key;
		user: User;
	}> => {
		const key = await this.getKey(providerId, providerUserId);
		const user = await this.getUser(key.userId);
		return {
			key,
			user
		};
	};
	public getAllUserKeys = async (userId: string) => {
		await this.getUser(userId);
		const databaseData = await this.adapter.getKeysByUserId(userId);
		return databaseData.map((val) => transformDatabaseKeyData(val));
	};
	public updateKeyPassword = async (
		providerId: string,
		providerUserId: string,
		password: string | null
	): Promise<void> => {
		const keyId = `${providerId}:${providerUserId}`;
		const hashedPassword = password ? await this.hash.generate(password) : null;
		await this.adapter.updateKeyPassword(keyId, hashedPassword);
	};
}

type MaybePromise<T> = T | Promise<T>;

export interface Configurations {
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
}
