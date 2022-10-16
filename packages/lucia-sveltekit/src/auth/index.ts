import type { Handle } from "../kit.js";
import type { Env } from "../types.js";
import { handleHooksFunction } from "./hooks.js";
import {
    authenticateUserFunction,
    createUserFunction,
    deleteUserFunction,
    getUserFunction,
    getUserByProviderIdFunction,
    updateUserDataFunction,
    updateUserPasswordFunction,
    updateUserProviderIdFunction,
    getSessionUserFunction,
} from "./user/index.js";
import { parseRequestFunction, validateRequestFunction } from "./request.js";
import {
    createSessionFunction,
    deleteDeadUserSessionsFunction,
    renewSessionFunction,
    invalidateUserSessionsFunction,
    validateSessionFunction,
    invalidateSessionFunction,
    generateSessionIdFunction,
} from "./session.js";
import { handleServerSessionFunction } from "./load.js";
import { deleteAllCookiesFunction } from "./cookie.js";
import clc from "cli-color";
import { Adapter } from "../adapter/index.js";

export const lucia = (configs: Configurations) => {
    return new Auth(configs) as Omit<Auth, "getAuthSession">;
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

export class Auth {
    private context: Context;
    constructor(configs: Configurations) {
        validateConfigurations(configs);
        this.context = {
            auth: this,
            adapter: configs.adapter,
            generateCustomUserId:
                configs.generateCustomUserId || (async () => null),
            env: configs.env,
            csrfProtection: configs.csrfProtection || true,
            sessionTimeout: configs.sessionTimeout || 1000 * 60 * 60 * 24 * 7,
            renewalPeriod: configs.renewalPeriod || 1000 * 60 * 60 * 24 * 7,
        };
        this.getUser = getUserFunction(this.context);
        this.getUserByProviderId = getUserByProviderIdFunction(this.context);
        this.getSessionUser = getSessionUserFunction(this.context);
        this.createUser = createUserFunction(this.context);
        this.updateUserData = updateUserDataFunction(this.context);
        this.updateUserProviderId = updateUserProviderIdFunction(this.context);
        this.updateUserPassword = updateUserPasswordFunction(this.context);
        this.deleteUser = deleteUserFunction(this.context);
        this.authenticateUser = authenticateUserFunction(this.context);

        this.validateSession = validateSessionFunction(this.context);
        this.generateSessionId = generateSessionIdFunction(this.context);
        this.createSession = createSessionFunction(this.context);
        this.renewSession = renewSessionFunction(this.context);
        this.invalidateSession = invalidateSessionFunction(this.context);
        this.invalidateUserSessions = invalidateUserSessionsFunction(
            this.context
        );
        this.deleteDeadUserSessions = deleteDeadUserSessionsFunction(
            this.context
        );

        this.parseRequest = parseRequestFunction(this.context);
        this.validateRequest = validateRequestFunction(this.context);

        this.handleHooks = handleHooksFunction(this.context);
        this.handleServerSession = handleServerSessionFunction(this.context);
        this.deleteAllCookies = deleteAllCookiesFunction(this.context);
    }
    public getUser: ReturnType<typeof getUserFunction>;
    public getUserByProviderId: ReturnType<typeof getUserByProviderIdFunction>;
    public getSessionUser: ReturnType<typeof getSessionUserFunction>;
    public createUser: ReturnType<typeof createUserFunction>;
    public updateUserData: ReturnType<typeof updateUserDataFunction>;
    public updateUserProviderId: ReturnType<
        typeof updateUserProviderIdFunction
    >;
    public updateUserPassword: ReturnType<typeof updateUserPasswordFunction>;
    public deleteUser: ReturnType<typeof deleteUserFunction>;
    public authenticateUser: ReturnType<typeof authenticateUserFunction>;

    public validateSession: ReturnType<typeof validateSessionFunction>;
    public generateSessionId: ReturnType<typeof generateSessionIdFunction>;
    public createSession: ReturnType<typeof createSessionFunction>;
    public renewSession: ReturnType<typeof renewSessionFunction>;
    public invalidateSession: ReturnType<typeof invalidateSessionFunction>;
    public invalidateUserSessions: ReturnType<
        typeof invalidateUserSessionsFunction
    >;
    public deleteDeadUserSessions: ReturnType<
        typeof deleteDeadUserSessionsFunction
    >;

    public parseRequest: ReturnType<typeof parseRequestFunction>;
    public validateRequest: ReturnType<typeof validateRequestFunction>;

    public handleHooks: () => Handle;
    public handleServerSession: ReturnType<typeof handleServerSessionFunction>;
    public deleteAllCookies: ReturnType<typeof deleteAllCookiesFunction>;
}

interface Configurations {
    adapter: Adapter;
    env: Env;
    generateCustomUserId?: () => Promise<string | null>;
    csrfProtection?: boolean;
    sessionTimeout?: number;
    renewalPeriod?: number;
}

export type Context = {
    auth: Auth;
} & Required<Configurations>;
