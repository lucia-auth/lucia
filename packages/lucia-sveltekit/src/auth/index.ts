import type { Handle } from "../kit.js";
import type { Adapter, Env } from "../types.js";
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
    getSessionUserFunction
} from "./user/index.js";
import { parseRequestFunction } from "./request.js";
import {
    refreshTokensFunction,
    invalidateRefreshTokenFunction,
    validateAccessTokenFunction,
    validateRefreshTokenFunction,
} from "./token/index.js";
import {
    createSessionFunction,
    invalidateAllUserSessionsFunction,
    deleteExpiredUserSessionsFunction,
    getSessionFunction,
    invalidateSessionFunction
} from "./session.js";
import { handleServerSessionFunction } from "./load.js";
import { deleteAllCookiesFunction } from "./cookie.js";
import { generateRandomString } from "../utils/crypto.js";
import clc from "cli-color";

export const lucia = (configs: Configurations) => {
    return new Auth(configs) as Omit<Auth, "getAuthSession">;
};

const validateConfigurations = (configs: Configurations) => {
    const isSecretUndefined = !configs.secret;
    if (isSecretUndefined) {
        console.log(
            `${clc.red.bold("[LUCIA_ERROR]")} ${clc.red(
                `Secret key is not defined in configuration ("config.secret").`
            )}`
        );
        process.exit(0);
    }
    const isAdapterIdentified = !configs.adapter;
    if (isAdapterIdentified) {
        console.log(
            `${clc.red.bold("[LUCIA_ERROR]")} ${clc.red(
                `Adapter is not defined in configuration ("config.adapter").`
            )}`
        );
        process.exit(1);
    }
    const isDevAndUnsafeSecret =
        configs.secret.length < 32 && configs.env === "DEV";
    if (isDevAndUnsafeSecret) {
        console.log(
            `${clc.yellow.bold("[LUCIA_WARNING]")} ${clc.yellow(
                "Secret key should be longer than 32 chars."
            )}`
        );
    }
};

export class Auth {
    private context: Context;
    constructor(configs: Configurations) {
        validateConfigurations(configs);
        this.context = {
            auth: this,
            adapter: configs.adapter,
            secret: configs.secret,
            generateUserId: configs.generateUserId || (() => generateRandomString(8)),
            env: configs.env,
            addCsrfProtection: configs.addCsrfProtection || true
        };
        this.getUser = getUserFunction(this.context);
        this.getUserByProviderId = getUserByProviderIdFunction(this.context);
        this.getSessionUser = getSessionUserFunction(this.context);
        this.createUser = createUserFunction(this.context);
        this.authenticateUser = authenticateUserFunction(this.context);
        this.deleteUser = deleteUserFunction(this.context);
        this.updateUserData = updateUserDataFunction(this.context);
        this.updateUserProviderId = updateUserProviderIdFunction(this.context);
        this.updateUserPassword = updateUserPasswordFunction(this.context);
        this.parseRequest = parseRequestFunction(this.context);
        this.refreshTokens = refreshTokensFunction(this.context);
        this.getSession = getSessionFunction(this.context)
        this.createSession = createSessionFunction(this.context);
        this.invalidateSession = invalidateSessionFunction(
            this.context
        );
        this.invalidateAllUserSessions = invalidateAllUserSessionsFunction(
            this.context
        );
        this.deleteExpiredUserSessions = deleteExpiredUserSessionsFunction(
            this.context
        );
        this.validateAccessToken = validateAccessTokenFunction(this.context);
        this.validateRefreshToken = validateRefreshTokenFunction(this.context);
        this.invalidateRefreshToken = invalidateRefreshTokenFunction(
            this.context
        );
        this.handleHooks = handleHooksFunction(this.context);
        this.handleServerSession = handleServerSessionFunction(this.context);
        this.deleteAllCookies = deleteAllCookiesFunction(this.context);
    }
    public handleHooks: () => Handle;
    public authenticateUser: ReturnType<typeof authenticateUserFunction>;
    public createUser: ReturnType<typeof createUserFunction>;
    public getUser: ReturnType<typeof getUserFunction>;
    public getUserByProviderId: ReturnType<typeof getUserByProviderIdFunction>;
    public getSessionUser: ReturnType<typeof getSessionUserFunction>
    public deleteUser: ReturnType<typeof deleteUserFunction>;
    public parseRequest: ReturnType<typeof parseRequestFunction>;
    public refreshTokens: ReturnType<typeof refreshTokensFunction>;
    public invalidateRefreshToken: ReturnType<
        typeof invalidateRefreshTokenFunction
    >;
    public getSession: ReturnType<typeof getSessionFunction>
    public createSession: ReturnType<typeof createSessionFunction>;
    public deleteExpiredUserSessions: ReturnType<
        typeof deleteExpiredUserSessionsFunction
    >;
    public validateAccessToken: ReturnType<typeof validateAccessTokenFunction>;
    public validateRefreshToken: ReturnType<
        typeof validateRefreshTokenFunction
    >;
    public updateUserData: ReturnType<typeof updateUserDataFunction>;
    public updateUserProviderId: ReturnType<
        typeof updateUserProviderIdFunction
    >;
    public updateUserPassword: ReturnType<typeof updateUserPasswordFunction>;
    public handleServerSession: ReturnType<typeof handleServerSessionFunction>;
    public invalidateSession: ReturnType<
        typeof invalidateSessionFunction
    >;
    public invalidateAllUserSessions: ReturnType<
        typeof invalidateAllUserSessionsFunction
    >;
    public deleteAllCookies: ReturnType<typeof deleteAllCookiesFunction>;
}

interface Configurations {
    adapter: Adapter;
    secret: string;
    env: Env;
    generateUserId?: () => string;
    addCsrfProtection?: boolean;
}

export type Context = {
    auth: Auth;
} & Required<Configurations>
