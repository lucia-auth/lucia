import type { Handle, ServerLoad } from "@sveltejs/kit";
import { generateRandomString } from "../utils/crypto.js";
import type { Adapter, Env } from "../types.js";
import { sequence } from "@sveltejs/kit/hooks";
import { handleEndpointsFunction, handleTokensFunction } from "./hooks.js";
import type {
    authenticateUser,
    CreateUser,
    DeleteUser,
    GetUser,
} from "./user/index.js";
import {
    authenticateUserFunction,
    createUserFunction,
    deleteUserFunction,
    getUserFunction,
} from "./user/index.js";
import type { ValidateRequest, ValidateRequestByCookie } from "./request.js";
import {
    validateRequestByCookieFunction,
    validateRequestFunction,
} from "./request.js";
import type { RefreshTokens } from "./refresh-token/index.js";
import { refreshTokensFunction } from "./refresh-token/index.js";
import type { InvalidateRefreshToken } from "./refresh-token/invalidate.js";
import { invalidateRefreshTokenFunction } from "./refresh-token/invalidate.js";
import { createUserSessionFunction } from "./session.js";
import type { CreateUserSession } from "./session.js";
import type { UpdateUserData } from "./user/update/user-data.js";
import { updateUserDataFunction } from "./user/update/user-data.js";
import type { UpdateUserIdentifierToken } from "./user/update/identifier-token.js";
import { updateUserIdentifierTokenFunction } from "./user/update/identifier-token.js";
import type { ResetUserPassword } from "./user/reset-password.js";
import { resetUserPasswordFunction } from "./user/reset-password.js";
import { getUserByIdFunction } from "./user/get.js";
import type { GetUserById } from "./user/get.js";

export const lucia = (configs: Configurations) => {
    return new Lucia<Lucia.UserData>(configs);
};

export class Lucia<UserData extends {}> {
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
    }
    private handleTokens: Handle = async (params) => {
        return handleTokensFunction(this.context)(params);
    };
    private handleEndpoints: Handle = async (params) => {
        return handleEndpointsFunction(this.context)(params);
    };
    public getAuthSession: ServerLoad = async ({ locals }) => {
        return {
            lucia: locals.lucia,
        };
    };
    public handleAuth: Handle = (params: any) => {
        return sequence(this.handleTokens, this.handleEndpoints)(params);
    };
    public authenticateUser: authenticateUser<UserData> = async (...params) => {
        return await authenticateUserFunction<UserData>(this.context)(
            ...params
        );
    };
    public createUser: CreateUser<UserData> = async (...params) => {
        return await createUserFunction<UserData>(this.context)(...params);
    };
    public getUser: GetUser<UserData> = async (...params) => {
        return await getUserFunction<UserData>(this.context)(...params);
    };
    public getUserById: GetUserById<UserData> = async (...params) => {
        return await getUserByIdFunction<UserData>(this.context)(...params);
    };
    public deleteUser: DeleteUser = async (...params) => {
        return await deleteUserFunction(this.context)(...params);
    };
    public validateRequest: ValidateRequest<UserData> = async (...params) => {
        return await validateRequestFunction<UserData>(this.context)(...params);
    };
    public refreshTokens: RefreshTokens<UserData> = async (...params) => {
        return await refreshTokensFunction<UserData>(this.context)(...params);
    };
    public invalidateRefreshToken: InvalidateRefreshToken = async (
        ...params
    ) => {
        return await invalidateRefreshTokenFunction(this.context)(...params);
    };
    public createUserSession: CreateUserSession<UserData> = async (
        ...params
    ) => {
        return await createUserSessionFunction<UserData>(this.context)(
            ...params
        );
    };
    public updateUserData: UpdateUserData<UserData> = async (...params) => {
        return await updateUserDataFunction<UserData>(this.context)(...params);
    };
    public updateUserIdentifierToken: UpdateUserIdentifierToken<UserData> =
        async (...params) => {
            return await updateUserIdentifierTokenFunction<UserData>(
                this.context
            )(...params);
        };
    public resetUserPassword: ResetUserPassword = async (...params) => {
        return await resetUserPasswordFunction(this.context)(...params);
    };
    public validateRequestByCookie: ValidateRequestByCookie<UserData> = async (
        ...params
    ) => {
        return await validateRequestByCookieFunction<UserData>(this.context)(
            ...params
        );
    };
}

interface Configurations {
    adapter: Adapter;
    secret: string;
    env: Env;
    generateUserId?: () => string;
}

export interface Context {
    auth: Lucia<any>;
    adapter: Adapter;
    secret: string;
    env: Env;
    generateUserId: () => string;
}
