import type { Handle } from "../kit.js";
import type { Adapter, Env } from "../types.js";

import { generateRandomString } from "../utils/crypto.js";
import { handleHooksFunction } from "./hooks.js";
import {
    authenticateUserFunction,
    createUserFunction,
    deleteUserFunction,
    getUserFunction,
    getUserByIdentifierFunction,
    updateUserDataFunction,
    updateUserIdentifierTokenFunction,
    updateUserPasswordFunction,
} from "./user/index.js";
import { validateRequestFunction } from "./request.js";
import {
    refreshTokensFunction,
    invalidateAccessTokenFunction,
    invalidateRefreshTokenFunction,
    validateAccessTokenFunction,
    validateRefreshTokenFunction,
} from "./token/index.js";
import {
    createSessionFunction,
    createSessionTokensFunction,
    invalidateAllUserSessionsFunction,
    deleteExpiredUserSessionsFunction,
} from "./session.js";
import { handleServerSessionFunction } from "./load.js";

export const lucia = (configs: Configurations) => {
    return new Auth(configs) as Omit<Auth, "getAuthSession">;
};

export class Auth {
    private adapter: Adapter;
    private secret: string;
    private generateUserId: () => string;
    private context: Context;
    private env: Env;
    constructor(configs: Configurations) {
        this.adapter = configs.adapter;
        this.secret = configs.secret;
        this.generateUserId =
            configs.generateUserId || (() => generateRandomString(8));
        this.env = configs.env;
        this.context = {
            auth: this,
            adapter: this.adapter,
            secret: this.secret,
            generateUserId: this.generateUserId,
            env: this.env,
        };
        this.authenticateUser = authenticateUserFunction(this.context);
        this.createUser = createUserFunction(this.context);
        this.getUser = getUserFunction(this.context);
        this.getUser = getUserFunction(this.context);
        this.getUserByIdentifierToken = getUserByIdentifierFunction(
            this.context
        );
        this.deleteUser = deleteUserFunction(this.context);
        this.validateRequest = validateRequestFunction(this.context);
        this.refreshTokens = refreshTokensFunction(this.context);
        this.invalidateRefreshToken = invalidateRefreshTokenFunction(
            this.context
        );
        this.createSession = createSessionFunction(this.context);
        this.createSessionTokens = createSessionTokensFunction(this.context);
        this.deleteExpiredUserSessions = deleteExpiredUserSessionsFunction(
            this.context
        );
        this.validateAccessToken = validateAccessTokenFunction(this.context);
        this.validateRefreshToken = validateRefreshTokenFunction(this.context);
        this.updateUserData = updateUserDataFunction(this.context);
        this.updateUserIdentifierToken = updateUserIdentifierTokenFunction(
            this.context
        );
        this.updateUserPassword = updateUserPasswordFunction(this.context);
        this.handleHooks = handleHooksFunction(this.context);
        this.handleServerSession = handleServerSessionFunction(this.context);
        this.invalidateAccessToken = invalidateAccessTokenFunction(
            this.context
        );
        this.invalidateAllUserSessions = invalidateAllUserSessionsFunction(
            this.context
        );
    }
    public handleHooks: () => Handle;
    public authenticateUser: ReturnType<typeof authenticateUserFunction>;
    public createUser: ReturnType<typeof createUserFunction>;
    public getUser: ReturnType<typeof getUserFunction>;
    public getUserByIdentifierToken: ReturnType<
        typeof getUserByIdentifierFunction
    >;
    public deleteUser: ReturnType<typeof deleteUserFunction>;
    public validateRequest: ReturnType<typeof validateRequestFunction>;
    public refreshTokens: ReturnType<typeof refreshTokensFunction>;
    public invalidateRefreshToken: ReturnType<
        typeof invalidateRefreshTokenFunction
    >;
    public createSession: ReturnType<typeof createSessionFunction>;
    public createSessionTokens: ReturnType<typeof createSessionTokensFunction>;
    public deleteExpiredUserSessions: ReturnType<
        typeof deleteExpiredUserSessionsFunction
    >;
    public validateAccessToken: ReturnType<typeof validateAccessTokenFunction>;
    public validateRefreshToken: ReturnType<
        typeof validateRefreshTokenFunction
    >;
    public updateUserData: ReturnType<typeof updateUserDataFunction>;
    public updateUserIdentifierToken: ReturnType<
        typeof updateUserIdentifierTokenFunction
    >;
    public updateUserPassword: ReturnType<typeof updateUserPasswordFunction>;
    public handleServerSession: ReturnType<typeof handleServerSessionFunction>;
    public invalidateAccessToken: ReturnType<
        typeof invalidateAccessTokenFunction
    >;
    public invalidateAllUserSessions: ReturnType<
        typeof invalidateAllUserSessionsFunction
    >;
}

interface Configurations {
    adapter: Adapter;
    secret: string;
    env: Env;
    generateUserId?: () => string;
}

export interface Context {
    auth: Auth;
    adapter: Adapter;
    secret: string;
    env: Env;
    generateUserId: () => string;
}
