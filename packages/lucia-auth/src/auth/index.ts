import type { Env, MinimalRequest, Session, SessionSchema, User } from "../types.js";
import { Cookie, CookieOption, createSessionCookie } from "./cookie.js";
import { Adapter, SessionAdapter, UserAdapter, UserData, UserSchema } from "../types.js";
import { logError } from "../utils/log.js";
import {
	generateHashWithScrypt,
	generateRandomString,
	validateScryptHash
} from "../utils/crypto.js";
import { LuciaError } from "./error.js";
import { parseCookie } from "../utils/cookie.js";
import { getSessionFromDatabaseData } from "./session.js";

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
	private generateUserId: () => MaybePromise<string | null>;
	private sessionCookie: CookieOption[];
	private sessionTimeout: {
		activePeriod: number;
		idlePeriod: number;
	};
	private env: Env;
	private hash: {
		generate: (s: string) => MaybePromise<string>;
		validate: (s: string, hash: string) => MaybePromise<boolean>;
	};
	private autoDatabaseCleanup: boolean;
	private transformUserData: (
		userData: UserSchema
	) => C["transformUserData"] extends {} ? ReturnType<C["transformUserData"]> : { userId: string };
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
				? { ...configs.adapter.user, ...configs.adapter.session }
				: configs.adapter;
		this.generateUserId = configs.generateCustomUserId ?? (async () => null);
		this.env = configs.env;
		this.csrfProtection = configs.csrfProtection ?? true;
		this.sessionTimeout = {
			activePeriod: configs.sessionTimeout?.activePeriod ?? 1000 * 60 * 60 * 24,
			idlePeriod: configs.sessionTimeout?.idlePeriod ?? 1000 * 60 * 60 * 24 * 14
		};
		this.autoDatabaseCleanup = configs.autoDatabaseCleanup ?? true;
		this.transformUserData = ({ id, hashed_password, provider_id, ...attributes }) => {
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
	public getUserByProviderId = async (provider: string, identifier: string): Promise<User> => {
		const providerId = `${provider}:${identifier}`;
		const databaseUser = await this.adapter.getUserByProviderId(providerId);
		if (!databaseUser) throw new LuciaError("AUTH_INVALID_PROVIDER_ID");
		const user = this.transformUserData(databaseUser);
		return user;
	};
	public getSessionUser = async (
		sessionId: string
	): Promise<{
		user: User;
		session: Session;
	}> => {
		if (sessionId.length !== 40) throw new LuciaError("AUTH_INVALID_SESSION_ID");
		let userData: UserSchema | null;
		let sessionData: SessionSchema | null;
		if (this.adapter.getSessionAndUserBySessionId !== undefined) {
			const databaseUserSession = await this.adapter.getSessionAndUserBySessionId(sessionId);
			if (!databaseUserSession) throw new LuciaError("AUTH_INVALID_SESSION_ID");
			userData = databaseUserSession.user;
			sessionData = databaseUserSession.session;
		} else {
			sessionData = await this.adapter.getSession(sessionId);
			userData = sessionData ? await this.adapter.getUser(sessionData.user_id) : null;
		}
		if (!sessionData) throw new LuciaError("AUTH_INVALID_SESSION_ID");
		const session = getSessionFromDatabaseData(sessionData);
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
	public createUser = async (
		provider: string,
		identifier: string,
		options?: {
			password?: string;
			attributes?: Lucia.UserAttributes;
		}
	): Promise<User> => {
		const providerId = `${provider}:${identifier}`;
		const attributes = options?.attributes ?? {};
		const userId = await this.generateUserId();
		const hashedPassword = options?.password ? await this.hash.generate(options.password) : null;
		const userData = await this.adapter.setUser(userId, {
			providerId,
			hashedPassword: hashedPassword,
			attributes
		});
		const user = this.transformUserData(userData);
		return user;
	};
	public updateUserAttributes = async (
		userId: string,
		attributes: Partial<Lucia.UserAttributes>
	): Promise<User> => {
		const [userData] = await Promise.all([
			this.adapter.updateUser(userId, {
				attributes
			}),
			this.autoDatabaseCleanup ? await this.deleteDeadUserSessions(userId) : null
		]);
		const user = this.transformUserData(userData);
		return user;
	};
	public updateUserProviderId = async (
		userId: string,
		provider: string,
		identifier: string
	): Promise<User> => {
		const providerId = `${provider}:${identifier}`;
		const [userData] = await Promise.all([
			this.adapter.updateUser(userId, {
				providerId
			}),
			this.autoDatabaseCleanup ? await this.deleteDeadUserSessions(userId) : null
		]);
		const user = this.transformUserData(userData);
		return user;
	};
	public updateUserPassword = async (userId: string, password: string): Promise<User> => {
		const hashedPassword = password ? await this.hash.generate(password) : null;
		const [userData] = await Promise.all([
			this.adapter.updateUser(userId, {
				hashedPassword
			}),
			this.invalidateAllUserSessions(userId)
		]);
		const user = this.transformUserData(userData);
		return user;
	};
	public deleteUser = async (userId: string): Promise<void> => {
		await this.adapter.deleteSessionsByUserId(userId);
		await this.adapter.deleteUser(userId);
	};
	public authenticateUser = async (
		provider: string,
		identifier: string,
		password: string
	): Promise<User> => {
		const providerId = `${provider}:${identifier}`;
		const databaseData = await this.adapter.getUserByProviderId(providerId);
		if (!databaseData) throw new LuciaError("AUTH_INVALID_PROVIDER_ID");
		if (!databaseData.hashed_password) throw new LuciaError("AUTH_INVALID_PASSWORD");
		if (databaseData.hashed_password.startsWith("$2a"))
			throw new LuciaError("AUTH_OUTDATED_PASSWORD");
		const isValid = await this.hash.validate(password, databaseData.hashed_password);
		if (!isValid) throw new LuciaError("AUTH_INVALID_PASSWORD");
		const user = this.transformUserData(databaseData);
		return user;
	};
	public getSession = async (sessionId: string): Promise<Session> => {
		if (sessionId.length !== 40) throw new LuciaError("AUTH_INVALID_SESSION_ID");
		const databaseSession = await this.adapter.getSession(sessionId);
		if (!databaseSession) throw new LuciaError("AUTH_INVALID_SESSION_ID");
		const session = getSessionFromDatabaseData(databaseSession);
		if (!session) {
			if (this.autoDatabaseCleanup) {
				await this.adapter.deleteSession(sessionId);
			}
			throw new LuciaError("AUTH_INVALID_SESSION_ID");
		}
		return session;
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
		const activePeriodExpires = new Date(new Date().getTime() + this.sessionTimeout.activePeriod);
		const idlePeriodExpires = new Date(
			activePeriodExpires.getTime() + this.sessionTimeout.idlePeriod
		);
		return [sessionId, activePeriodExpires, idlePeriodExpires];
	};
	public createSession = async (userId: string): Promise<Session> => {
		const [sessionId, activePeriodExpires, idlePeriodExpires] = this.generateSessionId();
		await Promise.all([
			this.adapter.setSession(sessionId, {
				userId,
				expires: activePeriodExpires.getTime(),
				idlePeriodExpires: idlePeriodExpires.getTime()
			}),
			this.autoDatabaseCleanup ? await this.deleteDeadUserSessions(userId) : null
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
		if (sessionId.length !== 40) throw new LuciaError("AUTH_INVALID_SESSION_ID");
		const sessionData = await this.adapter.getSession(sessionId);
		if (!sessionData) throw new LuciaError("AUTH_INVALID_SESSION_ID");
		const session = getSessionFromDatabaseData(sessionData);
		if (!session) {
			if (this.autoDatabaseCleanup) {
				await this.adapter.deleteSession(sessionId);
			}
			throw new LuciaError("AUTH_INVALID_SESSION_ID");
		}
		const [renewedSession] = await Promise.all([
			await this.createSession(session.userId),
			this.autoDatabaseCleanup ? await this.deleteDeadUserSessions(session.userId) : null
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
		return this.sessionCookie.map((options) => createSessionCookie(session, this.env, options));
	};
}

type MaybePromise<T> = T | Promise<T>;

export interface Configurations {
	adapter:
		| Adapter
		| {
				user: UserAdapter | Adapter;
				session: SessionAdapter | Adapter;
		  };
	env: Env;
	generateCustomUserId?: () => Promise<string | null>;
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
