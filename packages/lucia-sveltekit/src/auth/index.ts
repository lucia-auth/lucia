import { GetSession, Handle } from "@sveltejs/kit";
import { generateRandomString } from "../utils/crypto.js";
import { Adapter, Env } from "../types.js";
import { sequence } from "@sveltejs/kit/hooks";
import { handleEndpointsFunction, handleTokensFunction } from "./hooks.js";
import {
    authenticateUser,
    authenticateUserFunction,
    CreateUser,
    createUserFunction,
    DeleteUser,
    deleteUserFunction,
    GetUser,
    getUserFunction,
} from "./user/index.js";
import { ValidateRequest, validateRequestFunction } from "./request.js";
import { RefreshTokens, refreshTokensFunction } from "./token.js";

export const lucia = <UserData extends {}>(configs: Configurations) => {
    return new Lucia<UserData>(configs);
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
    public getAuthSession: GetSession = async ({ locals }) => {
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
    public deleteUser: DeleteUser = async (...params) => {
        return await deleteUserFunction(this.context)(...params);
    };
    public validateRequest: ValidateRequest<UserData> = async (...params) => {
        return await validateRequestFunction<UserData>(this.context)(...params);
    };
    public refreshTokens: RefreshTokens<UserData> = async (...params) => {
        return await refreshTokensFunction<UserData>(this.context)(...params);
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
