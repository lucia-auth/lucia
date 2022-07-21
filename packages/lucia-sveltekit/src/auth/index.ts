import { GetSession, Handle } from "@sveltejs/kit";
import { generateRandomString } from "../utils/crypto.js";
import { Adapter, Env, LuciaUser } from "../types.js";
import {
    createAccessToken,
    createFingerprintToken,
    createRefreshToken,
} from "../utils/auth.js";
import { sequence } from "@sveltejs/kit/hooks";
import {
    AccessToken,
    EncryptedRefreshToken,
    FingerprintToken,
    RefreshToken,
} from "../utils/token.js";
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
import { RefreshAccessToken, refreshAccessTokenFunction } from "./token.js";

export const lucia = (configs: Configurations) => {
    return new Lucia(configs);
};

export class Lucia {
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
    public accessToken = (token: string) => {
        return new AccessToken(token, this.context);
    };
    public fingerprintToken = (token: string) => {
        return new FingerprintToken(token, this.context);
    };
    public refreshToken = (token: string) => {
        return new RefreshToken(token, this.context);
    };
    public encryptedRefreshToken = (token: string) => {
        return new EncryptedRefreshToken(token, this.context);
    };
    public createAccessToken = (user: LuciaUser, fingerprintToken: string) => {
        return createAccessToken(user, fingerprintToken, this.context);
    };
    public createRefreshToken = (fingerprintToken: string) => {
        return createRefreshToken(fingerprintToken, this.context);
    };
    public createFingerprintToken = () => {
        return createFingerprintToken(this.context);
    };
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
    public authenticateUser: authenticateUser = async (...params) => {
        return await authenticateUserFunction(this.context)(...params);
    };
    public createUser: CreateUser = async (...params) => {
        return await createUserFunction(this.context)(...params);
    };
    public getUser: GetUser = async (...params) => {
        return await getUserFunction(this.context)(...params);
    };
    public deleteUser: DeleteUser = async (...params) => {
        return await deleteUserFunction(this.context)(...params);
    };
    public validateRequest: ValidateRequest = async (...params) => {
        return await validateRequestFunction(this.context)(...params);
    };
    public refreshAccessToken: RefreshAccessToken = async (...params) => {
        return await refreshAccessTokenFunction(this.context)(...params);
    };
}

interface Configurations {
    adapter: Adapter;
    secret: string;
    env: Env;
    generateUserId?: () => string;
}

export interface Context {
    auth: Lucia;
    adapter: Adapter;
    secret: string;
    env: Env;
    generateUserId: () => string;
}
