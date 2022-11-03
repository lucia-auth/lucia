import type { Env, User } from "../types.js";
import {
	authenticateUserFunction,
	createUserFunction,
	deleteUserFunction,
	getUserFunction,
	getUserByProviderIdFunction,
	updateUserAttributesFunction,
	updateUserPasswordFunction,
	updateUserProviderIdFunction,
	getSessionUserFunction
} from "./user/index.js";
import {
	parseRequestFunction,
	validateRequestFunction,
	getSessionUserFromRequestFunction
} from "./request.js";
import {
	createSessionFunction,
	deleteDeadUserSessionsFunction,
	renewSessionFunction,
	invalidateAllUserSessionsFunction,
	validateSessionFunction,
	invalidateSessionFunction,
	generateSessionIdFunction
} from "./session.js";
import { createSessionCookiesFunction, createBlankSessionCookiesFunction } from "./cookie.js";
import clc from "cli-color";
import { Adapter, SessionAdapter, UserAdapter, UserData, UserSchema } from "../types.js";

export const lucia = <C extends Configurations>(configs: C) => {
	return new Auth(configs) as Omit<Auth<C>, "getAuthSession">;
};

const validateConfigurations = (configs: Configurations) => {
	const isAdapterIdentified = !configs.adapter;
	if (isAdapterIdentified) {
		console.log(
			`${clc.red.bold("[LUCIA_ERROR]")} ${clc.red(
				`Adapter is not defined in configuration ("config.adapter").`
			)}`
		);
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
		this.configs = {
			adapter:
				"user" in configs.adapter
					? { ...configs.adapter.user, ...configs.adapter.session }
					: configs.adapter,
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
			deleteCookieOptions: configs.deleteCookieOptions || []
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

		this.validateSession = validateSessionFunction(this);
		this.generateSessionId = generateSessionIdFunction(this);
		this.createSession = createSessionFunction(this);
		this.renewSession = renewSessionFunction(this);
		this.invalidateSession = invalidateSessionFunction(this);
		this.invalidateAllUserSessions = invalidateAllUserSessionsFunction(this);
		this.deleteDeadUserSessions = deleteDeadUserSessionsFunction(this);

		this.parseRequest = parseRequestFunction(this);
		this.validateRequest = validateRequestFunction(this);
		this.getSessionUserFromRequest = getSessionUserFromRequestFunction(this);

		this.createSessionCookies = createSessionCookiesFunction(this);
		this.createBlankSessionCookies = createBlankSessionCookiesFunction(this);
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

	public validateSession: ReturnType<typeof validateSessionFunction>;
	public generateSessionId: ReturnType<typeof generateSessionIdFunction>;
	public createSession: ReturnType<typeof createSessionFunction>;
	public renewSession: ReturnType<typeof renewSessionFunction>;
	public invalidateSession: ReturnType<typeof invalidateSessionFunction>;
	public invalidateAllUserSessions: ReturnType<typeof invalidateAllUserSessionsFunction>;
	public deleteDeadUserSessions: ReturnType<typeof deleteDeadUserSessionsFunction>;

	public parseRequest: ReturnType<typeof parseRequestFunction>;
	public validateRequest: ReturnType<typeof validateRequestFunction>;
	public getSessionUserFromRequest: ReturnType<typeof getSessionUserFromRequestFunction>;

	public createSessionCookies: ReturnType<typeof createSessionCookiesFunction>;
	public createBlankSessionCookies: ReturnType<typeof createBlankSessionCookiesFunction>;
}

interface Configurations {
	adapter:
		| Adapter
		| {
				user: UserAdapter;
				session: SessionAdapter;
		  };
	env: Env;
	generateCustomUserId?: () => Promise<string | null>;
	csrfProtection?: boolean;
	sessionTimeout?: number;
	idlePeriodTimeout?: number;
	transformUserData?: (userData: UserData) => Record<string, any>;
	sessionCookieOptions?: CookieOption[];
	deleteCookieOptions?: CookieOption[];
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
};
