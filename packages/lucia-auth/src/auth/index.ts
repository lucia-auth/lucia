import type { Env, User } from "../types.js";
import {
	authenticateUserFunction,
	createUserFunction,
	deleteUserFunction,
	getUserFunction,
	getUserByProviderIdFunction,
	updateUserAttributesFunction,
	updateUserPasswordFunction,
	updateUserProviderIdFunction
} from "./user/index.js";
import { validateRequestHeadersFunction } from "./request.js";
import {
	createSessionFunction,
	deleteDeadUserSessionsFunction,
	renewSessionFunction,
	invalidateAllUserSessionsFunction,
	validateSessionFunction,
	validateSessionUserFunction,
	invalidateSessionFunction,
	getSessionFunction,
	generateSessionIdFunction,
	getSessionUserFunction
} from "./session.js";
import { createSessionCookiesFunction } from "./cookie.js";
import { Adapter, SessionAdapter, UserAdapter, UserData, UserSchema } from "../types.js";
import { logError } from "../utils/log.js";
import { generateHashWithScrypt, validateHash } from "../utils/crypto.js";

export { SESSION_COOKIE_NAME } from "./cookie.js";

export const lucia = <C extends Configurations>(configs: C) => {
	return new Auth(configs) as Omit<Auth<C>, "getAuthSession">;
};

const validateConfigurations = (configs: Configurations) => {
	const isAdapterIdentified = !configs.adapter;
	if (isAdapterIdentified) {
		logError('Adapter is not defined in configuration ("config.adapter")');
		process.exit(1);
	}
};

export class Auth<C extends Configurations = any> {
	public configs: UserConfig<C>;
	constructor(configs: C) {
		validateConfigurations(configs);
		const defaultCookieOption: CookieOption = {
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
		const adapter =
			"user" in configs.adapter
				? { ...configs.adapter.user, ...configs.adapter.session }
				: configs.adapter;
		this.configs = {
			adapter,
			generateCustomUserId: configs.generateCustomUserId || (async () => null),
			env: configs.env,
			csrfProtection: configs.csrfProtection || true,
			sessionTimeout: configs.sessionTimeout || 1000 * 60 * 60 * 24,
			idlePeriodTimeout: configs.idlePeriodTimeout || 1000 * 60 * 60 * 24 * 14,
			transformUserData: ({ id, hashed_password, provider_id, ...attributes }) => {
				const transform =
					configs.transformUserData ||
					(({ id }) => {
						return {
							userId: id
						};
					});
				return transform({ id, ...attributes }) as User;
			},
			sessionCookieOptions: configs.sessionCookieOptions || [defaultCookieOption],
			deleteCookieOptions: configs.deleteCookieOptions || [],
			hash: {
				generate: configs.hash?.generate ?? generateHashWithScrypt,
				validate: configs.hash?.validate ?? validateHash
			}
		};
		this.getUser = getUserFunction(this);
		this.getUserByProviderId = getUserByProviderIdFunction(this);
		this.getSessionUser = getSessionUserFunction(this);
		this.createUser = createUserFunction(this);
		this.updateUserAttributes = updateUserAttributesFunction(this);
		this.updateUserProviderId = updateUserProviderIdFunction(this);
		this.updateUserPassword = updateUserPasswordFunction(this);
		this.deleteUser = deleteUserFunction(this);
		this.authenticateUser = authenticateUserFunction(this);

		this.getSession = getSessionFunction(this);
		this.validateSession = validateSessionFunction(this);
		this.validateSessionUser = validateSessionUserFunction(this);
		this.generateSessionId = generateSessionIdFunction(this);
		this.createSession = createSessionFunction(this);
		this.renewSession = renewSessionFunction(this);
		this.invalidateSession = invalidateSessionFunction(this);
		this.invalidateAllUserSessions = invalidateAllUserSessionsFunction(this);
		this.deleteDeadUserSessions = deleteDeadUserSessionsFunction(this);

		this.validateRequestHeaders = validateRequestHeadersFunction(this);

		this.createSessionCookies = createSessionCookiesFunction(this);
	}
	public getUser: ReturnType<typeof getUserFunction>;
	public getUserByProviderId: ReturnType<typeof getUserByProviderIdFunction>;
	public getSessionUser: ReturnType<typeof getSessionUserFunction>;
	public createUser: ReturnType<typeof createUserFunction>;
	public updateUserAttributes: ReturnType<typeof updateUserAttributesFunction>;
	public updateUserProviderId: ReturnType<typeof updateUserProviderIdFunction>;
	public updateUserPassword: ReturnType<typeof updateUserPasswordFunction>;
	public deleteUser: ReturnType<typeof deleteUserFunction>;
	public authenticateUser: ReturnType<typeof authenticateUserFunction>;

	public getSession: ReturnType<typeof getSessionFunction>;
	public validateSession: ReturnType<typeof validateSessionFunction>;
	public validateSessionUser: ReturnType<typeof validateSessionUserFunction>;
	public generateSessionId: ReturnType<typeof generateSessionIdFunction>;
	public createSession: ReturnType<typeof createSessionFunction>;
	public renewSession: ReturnType<typeof renewSessionFunction>;
	public invalidateSession: ReturnType<typeof invalidateSessionFunction>;
	public invalidateAllUserSessions: ReturnType<typeof invalidateAllUserSessionsFunction>;
	public deleteDeadUserSessions: ReturnType<typeof deleteDeadUserSessionsFunction>;

	public validateRequestHeaders: ReturnType<typeof validateRequestHeadersFunction>;

	public createSessionCookies: ReturnType<typeof createSessionCookiesFunction>;
}

type MaybePromise<T> = T | Promise<T>;

interface Configurations {
	adapter:
		| Adapter
		| {
				user: UserAdapter | Adapter;
				session: SessionAdapter | Adapter;
		  };
	env: Env;
	generateCustomUserId?: () => Promise<string | null>;
	csrfProtection?: boolean;
	sessionTimeout?: number;
	idlePeriodTimeout?: number;
	transformUserData?: (userData: UserData) => Record<string, any>;
	sessionCookieOptions?: CookieOption[];
	deleteCookieOptions?: CookieOption[];
	hash?: {
		generate: (s: string) => MaybePromise<string>;
		validate: (s: string, hash: string) => MaybePromise<boolean>;
	};
}

type CookieOption = {
	sameSite?: "strict" | "lax";
	path?: string;
	domain?: string;
};

type UserConfig<C extends Configurations = any> = {
	adapter: Adapter;
	env: Env;
	generateCustomUserId: () => Promise<string | null>;
	csrfProtection: boolean;
	sessionTimeout: number;
	idlePeriodTimeout: number;
	sessionCookieOptions: CookieOption[];
	deleteCookieOptions: CookieOption[];
	transformUserData: (
		userData: UserSchema
	) => C["transformUserData"] extends {} ? ReturnType<C["transformUserData"]> : { userId: string };
	hash: {
		generate: (s: string) => MaybePromise<string>;
		validate: (s: string, hash: string) => MaybePromise<boolean>;
	};
};
